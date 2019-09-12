import * as dynamoDbLib from "./libs/dynamodb-lib";
import { success, failure } from "./libs/response-lib";

export async function main(event, context, callback) {
  // Request body is passed in as a JSON encoded string in 'event.body'
  const data = JSON.parse(event.body);
  const provider = event.requestContext.identity.cognitoAuthenticationProvider;
  const sub = provider.split(':')[2];

  //basic validation
  let rating = data.rating;
  if(rating < 0 || rating > 5) {
    return failure({ status: false, message: "Invalid rating" });
  }

  let params = {
    TableName: "NaadanChordsRatingsLog",
    Item: {
      postId: data.postId,
      rating: rating,
      userId: sub
    }
  };

  try {
    await dynamoDbLib.call("put", params);
    return success(params.Item);
  } catch (e) {
    return failure({ status: false, error: e });
  }
}