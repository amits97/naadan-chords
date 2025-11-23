import * as dynamoDbLib from "../libs/dynamodb-lib";
import { success, failure } from "../libs/response-lib";

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

export async function main(event, context, callback) {
  // Request body is passed in as a JSON encoded string in 'event.body'
  const data = JSON.parse(event.body);
  const provider = event.requestContext.identity.cognitoAuthenticationProvider;
  const sub = provider.split(":")[2];

  let params = {
    TableName: "NaadanChordsDrafts",
    Item: {
      userId: sub,
      postId: slugify(data.title),
      title: data.title,
      song: data.song || null,
      album: data.album || null,
      singers: data.singers || null,
      lyrics: data.lyrics || null,
      music: data.music || null,
      category: data.category || "MALAYALAM",
      image: data.image || null,
      scale: data.scale || null,
      tempo: data.tempo || null,
      timeSignature: data.timeSignature || null,
      content: data.content,
      leadTabs: data.leadTabs || null,
      youtubeId: data.youtubeId || null,
      postType: data.postType || "POST",
      chordPreferences: data.chordPreferences || null,
      createdAt: Date.now(),
    },
  };

  try {
    await dynamoDbLib.call("put", params);
    return success(params.Item);
  } catch (e) {
    //draft exists, update
    try {
      params = {
        TableName: "NaadanChordsDrafts",
        Key: {
          postId: slugify(data.title),
        },
        UpdateExpression:
          "SET title = :title, song = :song, album = :album, singers = :singers, lyrics = :lyrics, music = :music, category = :category, image = :image, scale = :scale, tempo = :tempo, timeSignature = :timeSignature, content = :content, leadTabs = :leadTabs, youtubeId = :youtubeId, postType = :postType, chordPreferences = :chordPreferences",
        ExpressionAttributeValues: {
          ":title": data.title || null,
          ":song": data.song || null,
          ":album": data.album || null,
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
        },
        ReturnValues: "ALL_NEW",
      };

      await dynamoDbLib.call("update", params);
      return success({ status: true });
    } catch (e) {
      return failure({ status: false });
    }
  }
}
