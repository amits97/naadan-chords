import * as dynamoDbLib from "../libs/dynamodb-lib";
import * as usernameLib from "../libs/username-lib";
import * as emailLib from "../libs/email-lib";
import { success, failure } from "../libs/response-lib";

async function clearTable() {
  const previousPositions = [];
  let params = {
    TableName: "NaadanChordsEmptySearch",
    ScanIndexForward: false,
  };

  let result = await dynamoDbLib.call("scan", params);
  let resultArray = result.Items;

  let deleteRequestArray = [];
  for (let i = 0; i < resultArray.length; i++) {
    previousPositions.push(resultArray[i].timestamp);
    let deleteItem = {
      DeleteRequest: {
        Key: {
          timestamp: resultArray[i].timestamp,
        },
      },
    };
    deleteRequestArray.push(deleteItem);
  }

  if (deleteRequestArray.length > 0) {
    const deleteParams = {
      RequestItems: {
        NaadanChordsEmptySearch: deleteRequestArray,
      },
      ReturnItemCollectionMetrics: "SIZE",
      ConsumedCapacity: "INDEXES",
    };

    await dynamoDbLib.batchCall(deleteParams);
  }
  return previousPositions;
}

function removeDuplicates(result) {
  let newResult = [];
  let prevItem;
  for (let i = 0; i < result.length; i++) {
    if (prevItem) {
      if (
        prevItem.ipAddress === result[i].ipAddress &&
        prevItem.searchQuery.includes(result[i].searchQuery)
      ) {
        // skip
        continue;
      }
    }
    newResult.push(result[i]);
    prevItem = result[i];
  }
  return newResult;
}

async function notifyAdmins(data) {
  let adminEmails = [];
  const adminUsers = await usernameLib.getAdminUsers();

  const title = `Naadan Chords - Empty Search Results Summary`;
  const message = `
    <p>Hey,</p>
    <p>Here is the summary for empty search results performed today:</p>
    <ol>
      ${data.map((item) => `<li>${item.searchQuery}</li>`).join("")}
    </ol>
    <p>Consider posting some of the requests above soon :)</p>
    <p>Thanks for being an Admin!</p>
  `;
  const textMessage = `Naadan Chords - Empty Search Results Summary`;

  adminUsers.forEach(async (user) => {
    let adminEmail;
    user.Attributes.forEach((attribute) => {
      if (attribute.Name === "email") {
        adminEmail = attribute.Value;
      }
    });
    adminEmails.push(adminEmail);
  });

  await emailLib.sendEmail(title, message, textMessage, adminEmails);
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
    await clearTable();
    resultItems = removeDuplicates(resultItems);
    await notifyAdmins(resultItems);
    return success({ status: true, result: resultItems });
  } catch (e) {
    return failure({ status: false, error: e });
  }
}
