import NodeCache from "node-cache";
import * as dynamoDbLib from "../libs/dynamodb-lib";
import * as userNameLib from "../libs/username-lib";
import { success, failure } from "../libs/response-lib";
import { appendRatings } from "../common/post-ratings";
import { appendCommentsCount } from "../common/post-comments";

const cacheTTL = 300; // 5 mins
const myCache = new NodeCache();

myCache.set("getCache", {}, cacheTTL);

function retryLoop(postId, cache = {}, cacheKey = "") {
  let keywords = postId.split("-");

  if (keywords.length > 1) {
    keywords.pop();
    return retryGet(keywords.join("-"), cache, cacheKey);
  } else {
    return failure({ status: false, error: "Item not found." });
  }
}

async function retryGet(postId, cache = {}, cacheKey = "") {
  let params = {
    TableName: "NaadanChords",
    ScanFilter: {
      postId: {
        ComparisonOperator: "CONTAINS",
        AttributeValueList: [postId],
      },
    },
  };

  if (postId.length > 2) {
    try {
      const result = await dynamoDbLib.call("scan", params);
      if (result.Items.length > 0) {
        let finalResult = result.Items[0];
        let userId = finalResult.userId;

        //Get full attributes of author
        let authorAttributes = await userNameLib.getAuthorAttributes(userId);
        finalResult.authorName = authorAttributes.authorName;
        finalResult.userName =
          authorAttributes.preferredUsername ?? authorAttributes.userName;
        finalResult.authorPicture = authorAttributes.picture;

        //Do not expose userId
        delete finalResult.userId;

        finalResult = await appendRatings({ Items: [finalResult] });
        finalResult = await appendCommentsCount(finalResult);
        cache[cacheKey] = finalResult.Items[0];
        myCache.set("getCache", cache, cacheTTL);
        return success({ ...finalResult.Items[0], responseFromCache: false });
      } else {
        return retryLoop(postId, cache, cacheKey);
      }
    } catch (e) {
      return failure({ status: false, error: e });
    }
  } else {
    return failure({ status: false, error: "Item not found." });
  }
}

export async function main(event) {
  let responseFromCache = true;
  let cacheKey = event.pathParameters.id;
  let cache = myCache.get("getCache") || {};

  if (event.queryStringParameters && event.queryStringParameters.clearCache) {
    delete cache[cacheKey];
  }

  if (!cache[cacheKey]) {
    responseFromCache = false;
    const params = {
      TableName: "NaadanChords",
      Key: {
        postId: event.pathParameters.id,
      },
    };

    try {
      const result = await dynamoDbLib.call("get", params);
      if (result.Item) {
        let userId = result.Item.userId;

        //Get full attributes of author
        let authorAttributes = await userNameLib.getAuthorAttributes(userId);
        result.Item.authorName = authorAttributes.authorName;
        result.Item.userName =
          authorAttributes.preferredUsername ?? authorAttributes.userName;
        result.Item.authorPicture = authorAttributes.picture;

        //Do not expose userId
        delete result.Item.userId;

        let finalResult = await appendRatings({ Items: [result.Item] });
        finalResult = await appendCommentsCount(finalResult);
        cache[cacheKey] = finalResult.Items[0];
        myCache.set("getCache", cache, cacheTTL);
      } else {
        return retryGet(event.pathParameters.id, cache, cacheKey);
      }
    } catch (e) {
      return failure({ status: false, error: e });
    }
  }

  cache = myCache.get("getCache") || {};
  return success({ ...cache[cacheKey], responseFromCache });
}
