import * as dynamoDbLib from "../../libs/dynamodb-lib";
import * as adminCheckLib from "../../libs/admincheck-lib";
import { success, failure } from "../../libs/response-lib";

export async function main(event, context) {
  const data = JSON.parse(event.body);
  const provider = event.requestContext.identity.cognitoAuthenticationProvider;
  const sub = provider.split(":")[2];

  let isAdminUser = await adminCheckLib.checkIfAdmin(sub);
  if (!isAdminUser) {
    return failure({ status: false, message: "No write permissions" });
  }

  let params = {
    TableName: "NaadanChords",
    Key: {
      postId: event.pathParameters.id,
    },
  };

  let updateExpression =
    "SET title = :title, song = :song, album = :album, singers = :singers, lyrics = :lyrics, music = :music, category = :category, image = :image, scale = :scale, tempo = :tempo, timeSignature = :timeSignature, content = :content, leadTabs = :leadTabs, youtubeId = :youtubeId, postType = :postType";
  let expressionAttributeValues = {
    ":title": data.title || null,
    ":song": data.song || null,
    ":album": data.album || "PAGE",
    ":singers": data.singers || null,
    ":lyrics": data.lyrics || null,
    ":music": data.music || null,
    ":category":
      data.category || (data.postType === "POST" ? "MALAYALAM" : "PAGE"),
    ":image": data.image || null,
    ":scale": data.scale || null,
    ":tempo": data.tempo || null,
    ":timeSignature": data.timeSignature || null,
    ":content": data.content || null,
    ":leadTabs": data.leadTabs || null,
    ":youtubeId": data.youtubeId || null,
    ":postType": data.postType || "POST",
    ":chordPreferences": data.chordPreferences || null,
  };

  try {
    let result = await dynamoDbLib.call("get", params);

    const createdAt = result.Item.createdAt;
    const timeNow = Date.now();

    // Set updated at if only 7 days has passed and addUpdatedTag flag is true
    if (timeNow - createdAt > 1000 * 60 * 60 * 24 * 7 && data.addUpdatedTag) {
      updateExpression += ", updatedAt = :updatedAt";
      expressionAttributeValues[":updatedAt"] = timeNow;
    }

    params = {
      TableName: "NaadanChords",
      Key: {
        postId: event.pathParameters.id,
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    };

    await dynamoDbLib.call("update", params);
    return success({ status: true });
  } catch (e) {
    return failure({ status: false, error: e });
  }
}
