import * as dynamoDbLib from "../libs/dynamodb-lib";
import * as userNameLib from "../libs/username-lib";
import * as searchFilterLib from "../libs/searchfilter-lib";

async function countReplyComments(commentId) {
  const params = {
    TableName: "NaadanChordsComments",
    ScanFilter: {
      commentId: {
        ComparisonOperator: "EQ",
        AttributeValueList: [commentId],
      },
    },
  };
  const comment = await dynamoDbLib.call("scan", params);
  if (comment.Items && comment.Items.length === 1) {
    let count = 1;
    let commentItem = comment.Items[0];
    let replies = commentItem.replies || [];
    for (let i = 0; i < replies.length; i++) {
      const replyCommentsCount = await countReplyComments(replies[i]);
      count += replyCommentsCount;
    }
    return count;
  }
  return 0;
}

async function appendCommentsCount(result) {
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
    TableName: "NaadanChordsComments",
    FilterExpression: filterExpression,
    ExpressionAttributeValues: expressionAttributeValues,
  };

  try {
    let commentsResult = await dynamoDbLib.call("scan", params);
    let comments = commentsResult.Items;
    let commentsObject = {};

    for (let i = 0; i < comments.length; i++) {
      let commentItem = comments[i];
      let replies = commentItem.replies || [];
      commentsObject[commentItem.postId] =
        (commentsObject[commentItem.postId] || 0) + 1;
      for (let j = 0; j < replies.length; j++) {
        const replyCommentsCount = await countReplyComments(replies[j]);
        commentsObject[commentItem.postId] += replyCommentsCount;
      }
    }

    for (let i = 0; i < items.length; i++) {
      if (commentsObject.hasOwnProperty(items[i].postId)) {
        items[i].commentsCount = commentsObject[items[i].postId];
      }
    }

    result.Items = items;
  } catch (e) {
    result.commentsError = e;
  }

  return result;
}

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
  let dynamoDbQueryType = "query";

  if (!event.userName) {
    return { status: false, error: "No username specified" };
  }

  let userId = await userNameLib.getUserId(event.userName);

  if (userId === "") {
    return [];
  }

  var lastEvaluatedKey;
  if (event.page) {
    var page = event.page - 1;

    if (page > 0) {
      let skipParams = {
        TableName: "NaadanChords",
        IndexName: "userId-createdAt-index",
        KeyConditionExpression: "userId = :userId",
        FilterExpression: "postType = :postType",
        ExpressionAttributeValues: {
          ":userId": userId,
          ":postType": event.postType ? event.postType : "POST",
        },
        ScanIndexForward: false,
        ProjectionExpression: "postId",
        Limit: 15 * page,
      };

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

  let params = {
    TableName: "NaadanChords",
    IndexName: "userId-createdAt-index",
    KeyConditionExpression: "userId = :userId",
    FilterExpression: "postType = :postType",
    ExpressionAttributeValues: {
      ":userId": userId,
      ":postType": event.postType ? event.postType : "POST",
    },
    ScanIndexForward: false,
    ProjectionExpression: "postId, createdAt, postType, title, userId",
    Limit: 15,
  };

  if (event.search) {
    //search
    dynamoDbQueryType = "scan";
    params = {
      TableName: "NaadanChords",
      ProjectionExpression: "postId, createdAt, postType, title, userId",
      ...searchFilterLib.getSearchFilter(
        event.search,
        userId,
        event.postType ? event.postType : "POST"
      ),
    };
  }

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

  try {
    let result = {};
    result = await dynamoDbLib.call(dynamoDbQueryType, params);

    //Get full attributes of author
    let authorAttributes = await userNameLib.getAuthorAttributes(userId);

    if (result.Items.length > 15) {
      result.Items = result.Items.slice(0, 15);
    }

    if (result.Items.length > 0) {
      for (let i = 0; i < result.Items.length; i++) {
        result.Items[i].userName =
          authorAttributes.preferredUsername ?? authorAttributes.userName;
        result.Items[i].authorName = authorAttributes.authorName;
        result.Items[i].authorPicture = authorAttributes.picture;
        delete result.Items[i].userId;
      }
    }

    //append ratings
    let finalResult = await appendRatings(result);

    //append comments count
    finalResult = await appendCommentsCount(result);

    finalResult.authorCreateDate = authorAttributes.userCreateDate;
    return finalResult;
  } catch (e) {
    return { status: false, error: e };
  }
}
