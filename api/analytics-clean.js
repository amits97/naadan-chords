import AWS from "aws-sdk";
import * as dynamoDbLib from "./libs/dynamodb-lib";
import { success, failure } from "./libs/response-lib";

const dynamoDb = new AWS.DynamoDB.DocumentClient();

function getTimestamp3WeeksAgo() {
  var ourDate = new Date();
 
  //Change it so that it is 7 days in the past.
  var pastDate = ourDate.getDate() - 21;
  ourDate.setDate(pastDate);
  
  //Log the date to our web console.
  return ourDate;
}

async function deleteItems(items) {
  let deleteRequestArray = [];
  for(let i = 0; i < items.length; i++) {
    let deleteItem = {
      DeleteRequest : {
        Key : {
          "timestamp": items[i].timestamp
        }
      }
    };
    deleteRequestArray.push(deleteItem);
  }

  const params = {
    RequestItems: {
      "NaadanChordsAnalytics": deleteRequestArray
    },
    ReturnItemCollectionMetrics: "SIZE",
    ConsumedCapacity: "INDEXES"
  };

  try {
    let result = await dynamoDbLib.batchCall(params);
    return result;
  } catch(e) {
    return e;
  }
}

export async function main(event, context, callback) {
  const params = {
    TableName: "NaadanChordsAnalytics",
    FilterExpression: "#timestamp < :timestamp",
    ExpressionAttributeValues: {
      ":timestamp": getTimestamp3WeeksAgo().getTime()
    },
    ExpressionAttributeNames: {
      "#timestamp": "timestamp"
    }
  };

  try {
    let result = await dynamoDbLib.call("scan", params);
    let resultArray = result.Items;
    let deleteCount = resultArray.length;
    while(resultArray.length) {
      await deleteItems(resultArray.splice(0,25));
    }
    return success({ status: true, message: `Deleted ${deleteCount} items`});
  } catch (e) {
    return failure({ status: false, error: e });
  }
}