import Fuse from "fuse.js";
import * as dynamoDbLib from "../libs/dynamodb-lib";

async function getPostDetails(postId) {
  const params = {
    TableName: "NaadanChords",
    ProjectionExpression:
      "postId, category, createdAt, updatedAt, postType, title, userId",
    Key: {
      postId,
    },
  };
  let result = await dynamoDbLib.call("get", params);
  return result.Item;
}

export async function fuzzySearch(query) {
  let allPostIds = [];
  let params = {
    TableName: "NaadanChords",
    IndexName: "postType-updatedAt-index",
    KeyConditionExpression: "postType = :postType",
    ExpressionAttributeValues: {
      ":postType": "POST",
    },
    ScanIndexForward: false,
    ProjectionExpression: "postId",
  };

  let lek = "init";
  while (lek) {
    const data = await dynamoDbLib.call("query", params);
    allPostIds.push(...data.Items);
    lek = data.LastEvaluatedKey;
    if (lek) params.ExclusiveStartKey = lek;
  }

  const options = {
    includeScore: true,
    threshold: 0.4,
    isCaseSensitive: false,
    keys: ["postId"],
  };

  const scanResult = new Fuse(allPostIds, options);
  let result = scanResult.search(query, { limit: 15 });

  if (result.length > 0) {
    allPostIds = result.map((item) => item.item.postId);
  } else {
    return { Items: [] };
  }

  // Get post details
  result = { Items: [] };
  for (let i = 0; i < allPostIds.length; i++) {
    const res = await getPostDetails(allPostIds[i]);
    result.Items.push(res);
  }

  return result;
}
