import * as dynamoDbLib from "../../libs/dynamodb-lib";
import * as adminCheckLib from "../../libs/admincheck-lib";
import { success, failure } from "../../libs/response-lib";

async function deleteItems(deleteRequestArray) {
  const deleteParams = {
    RequestItems: {
      NaadanChordsEmptySearch: deleteRequestArray,
    },
    ReturnItemCollectionMetrics: "SIZE",
    ConsumedCapacity: "INDEXES",
  };

  await dynamoDbLib.batchCall(deleteParams);
}

async function clearTable() {
  let params = {
    TableName: "NaadanChordsEmptySearch",
    ScanIndexForward: false,
  };

  let result = await dynamoDbLib.call("scan", params);
  let resultArray = result.Items;

  let deleteRequestArray = [];
  for (let i = 0; i < resultArray.length; i++) {
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
    while (deleteRequestArray.length) {
      await deleteItems(deleteRequestArray.splice(0, 25));
    }
  }
}

export async function main(event) {
  const provider = event.requestContext.identity.cognitoAuthenticationProvider;
  const sub = provider.split(":")[2];

  let isAdminUser = await adminCheckLib.checkIfAdmin(sub);
  if (!isAdminUser) {
    return failure({ status: false, message: "Access denied" });
  }

  try {
    await clearTable();
    return success({ status: true });
  } catch (e) {
    return failure({ status: false, error: e });
  }
}
