import Fuse from "fuse.js";
import NodeCache from "node-cache";
import * as dynamoDbLib from "../libs/dynamodb-lib";

const cacheTTL = 3600; // 1 hour
const myCache = new NodeCache();

myCache.set("scanResult", undefined, cacheTTL);

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
  let responseFromCache = true;

  if (!myCache.get("scanResult")) {
    responseFromCache = false;

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
    myCache.set("scanResult", scanResult, cacheTTL);
  }

  let result = myCache.get("scanResult").search(query, { limit: 15 });

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

  return { ...result, responseFromCache };
}
