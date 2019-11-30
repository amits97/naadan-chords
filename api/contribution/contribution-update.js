import * as dynamoDbLib from "../libs/dynamodb-lib";
import { success, failure } from "../libs/response-lib";

export async function main(event) {
  const data = JSON.parse(event.body);
  let provider, sub;

  try {
    provider = event.requestContext.identity.cognitoAuthenticationProvider;
    sub = provider.split(':')[2];
  } catch(e) {
    return failure({ status: "Not authorized", error: e });
  }

  if(!sub) {
    return failure({ status: "Not authorized" });
  }

  let params = {
    TableName: "NaadanChordsContributions",
    Key: {
      postId: event.pathParameters.id
    }
  };

  try {
    let result = await dynamoDbLib.call("get", params);
    
    if(result.Item.userId === sub) {
      params.UpdateExpression = "SET title = :title, song = :song, album = :album, singers = :singers, music = :music, category = :category, content = :content, leadTabs = :leadTabs, youtubeId = :youtubeId, #status = :status";
      params.ExpressionAttributeValues = {
        ":title": data.title || null,
        ":song": data.song || null,
        ":album": data.album || null,
        ":singers": data.singers || null,
        ":music": data.music || null,
        ":category": data.category || "MALAYALAM",
        ":content": data.content || null,
        ":leadTabs": data.leadTabs || null,
        ":youtubeId": data.youtubeId || null,
        ":status": "PENDING"
      };
      params.ExpressionAttributeNames = {
        "#status": "status"
      };
      params.ReturnValues = "ALL_NEW";

      await dynamoDbLib.call("update", params);
      return success({ status: true });
    } else {
      return failure({ status: "Not authorized" })
    }
  } catch (e) {
    return failure({ status: false, error: e });
  }
}
