import * as dynamoDbLib from "./libs/dynamodb-lib";
import { success, failure } from "./libs/response-lib";

export async function main(event, context) {
  const data = JSON.parse(event.body);
  const params = {
    TableName: "NaadanChords",
    Key: {
      postId: event.pathParameters.id
    },
    UpdateExpression: "SET title = :title, song = :song, album = :album, singers = :singers, music = :music, content = :content, leadTabs = :leadTabs, youtubeId = :youtubeId, postType = :postType",
    ExpressionAttributeValues: {
      ":title": data.title || null,
      ":song": data.song || null,
      ":album": data.album || null,
      ":singers": data.singers || null,
      ":music": data.music || null,
      ":content": data.content || null,
      ":leadTabs": data.leadTabs || null,
      ":youtubeId": data.youtubeId || null,
      ":postType": data.postType || null
    },
    ReturnValues: "ALL_NEW"
  };

  try {
    const result = await dynamoDbLib.call("update", params);
    return success({ status: true });
  } catch (e) {
    return failure({ status: false, error: e });
  }
}