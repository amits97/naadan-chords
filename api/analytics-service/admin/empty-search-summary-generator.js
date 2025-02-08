import { dedupe, token_set_ratio } from "fuzzball";
import * as dynamoDbLib from "../../libs/dynamodb-lib";
import { success, failure } from "../../libs/response-lib";

async function deleteItems(tableName, deleteRequestArray) {
  const deleteParams = {
    RequestItems: {
      [tableName]: deleteRequestArray,
    },
    ReturnItemCollectionMetrics: "SIZE",
    ConsumedCapacity: "INDEXES",
  };

  await dynamoDbLib.batchCall(deleteParams);
}

async function insertItems(tableName, itemsArray) {
  const insertParams = {
    RequestItems: {
      [tableName]: itemsArray,
    },
    ReturnItemCollectionMetrics: "SIZE",
    ConsumedCapacity: "INDEXES",
  };

  await dynamoDbLib.batchCall(insertParams);
}

async function clearTable(tableName, key) {
  let params = {
    TableName: tableName,
    ScanIndexForward: false,
  };

  let result = await dynamoDbLib.call("scan", params);
  let resultArray = result.Items;

  let deleteRequestArray = [];
  for (let i = 0; i < resultArray.length; i++) {
    let deleteItem = {
      DeleteRequest: {
        Key: {
          [key]: resultArray[i][key],
        },
      },
    };
    deleteRequestArray.push(deleteItem);
  }

  if (deleteRequestArray.length > 0) {
    while (deleteRequestArray.length) {
      await deleteItems(tableName, deleteRequestArray.splice(0, 25));
    }
  }
}

function removeDuplicates(result) {
  const ipSearchMap = {};
  const finalResult = [];

  for (let i = 0; i < result.length; i++) {
    const ipAddress = result[i].ipAddress;
    ipSearchMap[ipAddress] = ipSearchMap[ipAddress] || [];
    ipSearchMap[ipAddress].push(result[i].searchQuery);
  }

  for (let ipAddress in ipSearchMap) {
    if (ipSearchMap.hasOwnProperty(ipAddress)) {
      ipSearchMap[ipAddress] = dedupe(ipSearchMap[ipAddress], {
        cutoff: 45,
        scorer: token_set_ratio,
      }).map((item) => item[0]);
    }
  }

  for (let ipAddress in ipSearchMap) {
    if (ipSearchMap.hasOwnProperty(ipAddress)) {
      ipSearchMap[ipAddress].forEach((item) => {
        finalResult.push({ searchQuery: item, ipAddress });
      });
    }
  }

  return finalResult;
}

function countSearchOccurances(result) {
  const finalResult = [];

  for (let i = 0; i < result.length; i++) {
    if (!result[i].marked) {
      const similarQueries = [result[i].searchQuery];
      const searchQuery = result[i].searchQuery;

      for (let j = i + 1; j < result.length; j++) {
        if (token_set_ratio(searchQuery, result[j].searchQuery) > 75) {
          if (
            result[j].ipAddress !== result[i].ipAddress &&
            !result[j].marked
          ) {
            similarQueries.push(result[j].searchQuery);
            result[j].marked = true;
          }
        }
      }

      const count = similarQueries.length;
      const bestQuery = dedupe(similarQueries, {
        cutoff: 60,
        scorer: token_set_ratio,
      }).map((item) => item[0])[0];

      finalResult.push({
        searchQuery: bestQuery,
        count,
      });
    }
  }

  return finalResult.sort((a, b) => b.count - a.count).slice(0, 100);
}

async function writeToTable(tableName, result) {
  let itemsArray = [];
  const dedupe = {};

  // Final dedupe
  for (let i = 0; i < result.length; i++) {
    if (!dedupe[result[i].searchQuery]) {
      dedupe[result[i].searchQuery] = result[i];
    } else {
      dedupe[result[i].searchQuery].count =
        dedupe[result[i].searchQuery].count + result[i].count;
    }
  }

  for (let key in dedupe) {
    let item = {
      PutRequest: {
        Item: {
          searchQuery: dedupe[key].searchQuery,
          count: dedupe[key].count,
          type: "SEARCH",
        },
      },
    };
    itemsArray.push(item);
  }

  while (itemsArray.length) {
    await insertItems(tableName, itemsArray.splice(0, 25));
  }
}

async function writeResultsToTable(newResult) {
  let existingResultItems = [];
  let params = {
    TableName: "NaadanChordsEmptySearchSummary",
    IndexName: "type-count-index",
    KeyConditionExpression: "#type = :type",
    ExpressionAttributeValues: {
      ":type": "SEARCH",
    },
    ExpressionAttributeNames: {
      "#type": "type",
    },
    ScanIndexForward: false,
    Limit: 3000,
  };
  let result = await dynamoDbLib.call("query", params);
  existingResultItems = existingResultItems.concat(result.Items);
  while (result.hasOwnProperty("LastEvaluatedKey")) {
    params.ExclusiveStartKey = result.LastEvaluatedKey;
    result = await dynamoDbLib.call("query", params);
    existingResultItems = existingResultItems.concat(result.Items);
  }

  let resultsToWrite = [];
  for (let i = 0; i < newResult.length; i++) {
    const newItem = newResult[i];
    let itemUsed = false;
    for (let j = 0; j < existingResultItems.length; j++) {
      if (!existingResultItems[j].marked) {
        if (
          token_set_ratio(
            newItem.searchQuery,
            existingResultItems[j].searchQuery
          ) > 75
        ) {
          resultsToWrite.push({
            searchQuery: dedupe(
              [newItem.searchQuery, existingResultItems[j].searchQuery],
              {
                cutoff: 60,
                scorer: token_set_ratio,
              }
            ).map((item) => item[0])[0],
            count: newItem.count + existingResultItems[j].count,
          });
          existingResultItems[j].marked = true;
          itemUsed = true;
        }
      }
    }
    if (!itemUsed) {
      resultsToWrite.push(newItem);
    }
  }

  for (let i = 0; i < existingResultItems.length; i++) {
    if (!existingResultItems[i].marked) {
      resultsToWrite.push(existingResultItems[i]);
    }
  }

  resultsToWrite = resultsToWrite
    .sort((a, b) => b.count - a.count)
    .slice(0, 100);

  await clearTable("NaadanChordsEmptySearchSummary", "searchQuery");
  await clearTable("NaadanChordsEmptySearch", "timestamp");

  const finalResult = await writeToTable(
    "NaadanChordsEmptySearchSummary",
    resultsToWrite
  );
  return finalResult;
}

export async function main() {
  let params = {
    TableName: "NaadanChordsEmptySearch",
    IndexName: "type-timestamp-index",
    KeyConditionExpression: "#type = :type",
    ExpressionAttributeValues: {
      ":type": "SEARCH",
    },
    ExpressionAttributeNames: {
      "#type": "type",
    },
    ScanIndexForward: false,
    Limit: 3000,
  };

  try {
    let resultItems = [];
    let result = await dynamoDbLib.call("query", params);
    resultItems = resultItems.concat(result.Items);
    while (result.hasOwnProperty("LastEvaluatedKey")) {
      params.ExclusiveStartKey = result.LastEvaluatedKey;
      result = await dynamoDbLib.call("query", params);
      resultItems = resultItems.concat(result.Items);
    }
    resultItems = countSearchOccurances(removeDuplicates(resultItems));
    await writeResultsToTable(resultItems);
    return success({ status: true });
  } catch (e) {
    return failure({ status: false, error: e });
  }
}
