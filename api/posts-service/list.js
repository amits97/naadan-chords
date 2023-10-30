import * as dynamoDbLib from "../libs/dynamodb-lib";
import * as userNameLib from "../libs/username-lib";
import * as searchFilterLib from "../libs/searchfilter-lib";

async function appendRatings(result) {
  let items = result.Items;
  let filterExpression = "";
  let expressionAttributeValues = {};

  for (let i = 0; i < items.length; i++) {
    let postId = items[i].postId;
    if (filterExpression) {
      filterExpression += ` OR contains(postId, :postId${i})`;
    } else {
      filterExpression = `contains(postId, :postId${i})`;
    }
    expressionAttributeValues[`:postId${i}`] = postId;
  }

  let params = {
    TableName: "NaadanChordsRatings",
    FilterExpression: filterExpression,
    ExpressionAttributeValues: expressionAttributeValues,
  };

  try {
    let ratingsResult = await dynamoDbLib.call("scan", params);
    let ratings = ratingsResult.Items;
    let ratingsObject = {};

    for (let i = 0; i < ratings.length; i++) {
      let ratingItem = ratings[i];
      ratingsObject[ratingItem.postId] = {
        rating: ratingItem.rating,
        ratingCount: ratingItem.count,
      };
    }

    for (let i = 0; i < items.length; i++) {
      if (ratingsObject.hasOwnProperty(items[i].postId)) {
        items[i].rating = ratingsObject[items[i].postId].rating;
        items[i].ratingCount = ratingsObject[items[i].postId].ratingCount;
      }
    }

    result.Items = items;
  } catch (e) {
    result.ratingsError = e;
  }

  return result;
}

export async function main(event, context, callback) {
  var lastEvaluatedKey;
  if (event.page) {
    var page = event.page - 1;

    if (page > 0) {
      let skipParams = {
        TableName: "NaadanChords",
        IndexName: "postType-updatedAt-index",
        KeyConditionExpression: "postType = :postType",
        ExpressionAttributeValues: {
          ":postType": event.postType || "POST",
        },
        ScanIndexForward: false,
        ProjectionExpression: "postId",
        Limit: 15 * page,
      };

      if (event.category) {
        //filter by category
        skipParams.IndexName = "category-updatedAt-index";
        skipParams.KeyConditionExpression = "category = :category";
        skipParams.ExpressionAttributeValues = {
          ":category": event.category,
        };
      }

      if (event.album) {
        //filter by album
        skipParams.IndexName = "album-createdAt-index";
        skipParams.KeyConditionExpression = "album = :album";
        skipParams.ExpressionAttributeValues = {
          ":album": event.album,
        };
      }

      try {
        var skipResult = await dynamoDbLib.call("query", skipParams);
        if (skipResult.hasOwnProperty("LastEvaluatedKey")) {
          lastEvaluatedKey = skipResult.LastEvaluatedKey;
        } else {
          return [];
        }
      } catch (e) {
        return { status: false, error: e };
      }
    } else if (page !== 0) {
      return [];
    }
  }

  let projectionExpression =
    "postId, createdAt, updatedAt, postType, title, album, userId";

  if (event.includeContentDetails === "true") {
    projectionExpression += ", content, leadTabs, youtubeId";
  }

  let params = {
    TableName: "NaadanChords",
    IndexName: "postType-updatedAt-index",
    KeyConditionExpression: "postType = :postType",
    ExpressionAttributeValues: {
      ":postType": event.postType || "POST",
    },
    ScanIndexForward: false,
    ProjectionExpression: projectionExpression,
    Limit: 15,
  };

  if (event.exclusiveStartKey) {
    //pagination
    params.ExclusiveStartKey = JSON.parse(
      decodeURIComponent(event.exclusiveStartKey).replace(/'/g, '"')
    );
  }
  if (lastEvaluatedKey) {
    //pagination
    params.ExclusiveStartKey = lastEvaluatedKey;
  }

  if (event.category) {
    //filter by category
    params.IndexName = "category-updatedAt-index";
    params.KeyConditionExpression = "category = :category";
    params.ExpressionAttributeValues = {
      ":category": event.category,
    };
  }

  if (event.album) {
    //filter by album
    params.IndexName = "album-createdAt-index";
    params.KeyConditionExpression = "album = :album";
    params.ExpressionAttributeValues = {
      ":album": event.album,
    };
  }

  try {
    let result = {};
    if (event.search) {
      //search
      params = {
        TableName: "NaadanChords",
        ProjectionExpression:
          "postId, createdAt, updatedAt, postType, title, userId",
        ...searchFilterLib.getSearchFilter(
          event.search,
          null,
          event.postType ? event.postType : "POST"
        ),
      };
      result = await dynamoDbLib.call("scan", params);
    } else {
      result = await dynamoDbLib.call("query", params);
    }

    let users = {};

    if (result.Items.length > 15) {
      result.Items = result.Items.slice(0, 15);
    }

    for (let i = 0; i < result.Items.length; i++) {
      let userId = result.Items[i].userId;

      if (!users.hasOwnProperty(userId)) {
        users[userId] = {};

        //Get full attributes of author
        let authorAttributes = await userNameLib.getAuthorAttributes(userId);
        users[userId].authorName = authorAttributes.authorName;
        users[userId].userName =
          authorAttributes.preferredUsername ?? authorAttributes.userName;
        users[userId].authorPicture = authorAttributes.picture;
      }

      delete result.Items[i].userId;
      result.Items[i].authorName = users[userId].authorName;
      result.Items[i].userName = users[userId].userName;
      result.Items[i].authorPicture = users[userId].authorPicture;

      // Append content details for sitemap
      if (event.includeContentDetails === "true") {
        result.Items[i].contentDetails = {
          hasContent:
            !!result.Items[i].content && !!result.Items[i].content?.trim(),
          hasTabs:
            !!result.Items[i].leadTabs && !!result.Items[i].leadTabs?.trim(),
          hasVideo:
            !!result.Items[i].youtubeId && !!result.Items[i].youtubeId?.trim(),
        };
        delete result.Items[i].content;
        delete result.Items[i].leadTabs;
        delete result.Items[i].youtubeId;
      }
    }

    //append ratings
    let finalResult = await appendRatings(result);

    return finalResult;
  } catch (e) {
    return { status: false, error: e };
  }
}
