import * as dynamoDbLib from "../libs/dynamodb-lib";

export async function appendRatings(result) {
  let items = result.Items;
  if (!items || items.length === 0) {
    return result;
  }

  try {
    const ratingPromises = items.map(async (item) => {
      const params = {
        TableName: "NaadanChordsRatings",
        Key: {
          postId: item.postId,
        },
      };
      const ratingResult = await dynamoDbLib.call("get", params);
      return ratingResult.Item;
    });

    const ratings = (await Promise.all(ratingPromises)).filter(Boolean);
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
