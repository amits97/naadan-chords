import * as dynamoDbLib from "./libs/dynamodb-lib";
import { success, failure } from "./libs/response-lib";

export async function main(event, context) {
  const data = JSON.parse(event.body);
  const params = {
    TableName: "NaadanChords",
    Key: {
      postId: event.pathParameters.id
    },
    UpdateExpression: "SET title = :title, content = :content, postType = :postType",
    ExpressionAttributeValues: {
      ":title": data.title || null,
      ":content": data.content || null,
      ":postType": data.postType || null
    },
    ReturnValues: "ALL_NEW"
  };

  try {
    const result = await dynamoDbLib.call("update", params);
    return success({ status: true });
  } catch (e) {
    return failure({ status: false });
  }
}