import { dedupe, token_set_ratio } from "fuzzball";
import * as dynamoDbLib from "../../libs/dynamodb-lib";
import * as adminCheckLib from "../../libs/admincheck-lib";
import { success, failure } from "../../libs/response-lib";

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
        cutoff: 60,
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
        if (token_set_ratio(searchQuery, result[j].searchQuery) > 70) {
          similarQueries.push(result[j].searchQuery);
          result[j].marked = true;
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

  return finalResult.sort((a, b) => b.count - a.count);
}

export async function main(event) {
  const provider = event.requestContext.identity.cognitoAuthenticationProvider;
  const sub = provider.split(":")[2];

  let isAdminUser = await adminCheckLib.checkIfAdmin(sub);
  if (!isAdminUser) {
    return failure({ status: false, message: "Access denied" });
  }

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
    return success(resultItems || []);
  } catch (e) {
    return failure({ status: false, error: e });
  }
}
