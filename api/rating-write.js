import * as dynamoDbLib from "./libs/dynamodb-lib";
import * as userNameLib from "./libs/username-lib";
import * as sesLib from "./libs/ses-lib";
import { success, failure } from "./libs/response-lib";

async function fetchPostDetails(postId) {
  let item;
  const params = {
    TableName: "NaadanChords",
    Key: {
      postId: postId
    }
  };

  try {
    let postResult = await dynamoDbLib.call("get", params);
    item = postResult.Item;
  } catch(e) {
    //do nothing
  }

  return item;
}

async function sendEmailToAuthor(postId, rating) {
  let post = await fetchPostDetails(postId);
  let emailId = await userNameLib.getAuthorEmail(post.userId);

  const emailBody = `
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>Naadan Chords - Someone rated ${post.title}</title>
        <style>
          img {
            border: none;
            -ms-interpolation-mode: bicubic;
            max-width: 100%;
          }

          body {
            background-color: #f6f6f6;
            font-family: sans-serif;
            -webkit-font-smoothing: antialiased;
            font-size: 14px;
            line-height: 1.4;
            margin: 0;
            padding: 0;
            -ms-text-size-adjust: 100%;
            -webkit-text-size-adjust: 100%;
          }

          table {
            border-collapse: separate;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
            width: 100%; }
            table td {
              font-family: sans-serif;
              font-size: 14px;
              vertical-align: top;
          }

          .body {
            background-color: #f6f6f6;
            width: 100%;
          }

          .container {
            display: block;
            margin: 0 auto !important;
            max-width: 580px;
            padding: 10px;
            width: 580px;
          }

          .content {
            box-sizing: border-box;
            display: block;
            margin: 0 auto;
            max-width: 580px;
            padding: 10px;
          }

          .main {
            background: #ffffff;
            border-radius: 3px;
            width: 100%;
          }

          .wrapper {
            box-sizing: border-box;
            padding: 20px;
          }

          .content-block {
            padding-bottom: 10px;
            padding-top: 10px;
          }

          .footer {
            clear: both;
            margin-top: 10px;
            text-align: center;
            width: 100%;
          }
            .footer td,
            .footer p,
            .footer span,
            .footer a {
              color: #999999;
              font-size: 12px;
              text-align: center;
          }

          h1,
          h2,
          h3,
          h4 {
            color: #000000;
            font-family: sans-serif;
            font-weight: 400;
            line-height: 1.4;
            margin: 0;
            margin-bottom: 30px;
          }

          h1 {
            font-size: 35px;
            font-weight: 300;
            text-align: center;
            text-transform: capitalize;
          }

          p,
          ul,
          ol {
            font-family: sans-serif;
            font-size: 14px;
            font-weight: normal;
            margin: 0;
            margin-bottom: 15px;
          }
            p li,
            ul li,
            ol li {
              list-style-position: inside;
              margin-left: 5px;
          }

          a {
            color: #3498db;
            text-decoration: underline;
          }

          .btn {
            box-sizing: border-box;
            width: 100%; }
            .btn > tbody > tr > td {
              padding-bottom: 15px; }
            .btn table {
              width: auto;
          }
            .btn table td {
              background-color: #ffffff;
              border-radius: 5px;
              text-align: center;
          }
            .btn a {
              background-color: #ffffff;
              border: solid 1px #3498db;
              border-radius: 5px;
              box-sizing: border-box;
              color: #3498db;
              cursor: pointer;
              display: inline-block;
              font-size: 14px;
              font-weight: bold;
              margin: 0;
              padding: 12px 25px;
              text-decoration: none;
              text-transform: capitalize;
          }

          .btn-primary table td {
            background-color: #093579;
          }

          .btn-primary a {
            background-color: #093579;
            border-color: #093579;
            color: #ffffff;
          }

          /* -------------------------------------
              OTHER STYLES THAT MIGHT BE USEFUL
          ------------------------------------- */
          .last {
            margin-bottom: 0;
          }

          .first {
            margin-top: 0;
          }

          .align-center {
            text-align: center;
          }

          .align-right {
            text-align: right;
          }

          .align-left {
            text-align: left;
          }

          .clear {
            clear: both;
          }

          .mt0 {
            margin-top: 0;
          }

          .mb0 {
            margin-bottom: 0;
          }

          .preheader {
            color: transparent;
            display: none;
            height: 0;
            max-height: 0;
            max-width: 0;
            opacity: 0;
            overflow: hidden;
            mso-hide: all;
            visibility: hidden;
            width: 0;
          }

          .powered-by a {
            text-decoration: none;
          }

          hr {
            border: 0;
            border-bottom: 1px solid #f6f6f6;
            margin: 20px 0;
          }

          /* -------------------------------------
              RESPONSIVE AND MOBILE FRIENDLY STYLES
          ------------------------------------- */
          @media only screen and (max-width: 620px) {
            table[class=body] h1 {
              font-size: 28px !important;
              margin-bottom: 10px !important;
            }
            table[class=body] p,
            table[class=body] ul,
            table[class=body] ol,
            table[class=body] td,
            table[class=body] span,
            table[class=body] a {
              font-size: 16px !important;
            }
            table[class=body] .wrapper,
            table[class=body] .article {
              padding: 10px !important;
            }
            table[class=body] .content {
              padding: 0 !important;
            }
            table[class=body] .container {
              padding: 0 !important;
              width: 100% !important;
            }
            table[class=body] .main {
              border-left-width: 0 !important;
              border-radius: 0 !important;
              border-right-width: 0 !important;
            }
            table[class=body] .btn table {
              width: 100% !important;
            }
            table[class=body] .btn a {
              width: 100% !important;
            }
            table[class=body] .img-responsive {
              height: auto !important;
              max-width: 100% !important;
              width: auto !important;
            }
          }

          /* -------------------------------------
              PRESERVE THESE STYLES IN THE HEAD
          ------------------------------------- */
          @media all {
            .ExternalClass {
              width: 100%;
            }
            .ExternalClass,
            .ExternalClass p,
            .ExternalClass span,
            .ExternalClass font,
            .ExternalClass td,
            .ExternalClass div {
              line-height: 100%;
            }
            .apple-link a {
              color: inherit !important;
              font-family: inherit !important;
              font-size: inherit !important;
              font-weight: inherit !important;
              line-height: inherit !important;
              text-decoration: none !important;
            }
            #MessageViewBody a {
              color: inherit;
              text-decoration: none;
              font-size: inherit;
              font-family: inherit;
              font-weight: inherit;
              line-height: inherit;
            }
            .btn-primary table td:hover {
              background-color: #34495e !important;
            }
            .btn-primary a:hover {
              background-color: #34495e !important;
              border-color: #34495e !important;
            }
          }

        </style>
      </head>
      <body class="">
        <span class="preheader">Naadan Chords - Someone rated ${post.title}</span>
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="body">
          <tr>
            <td>&nbsp;</td>
            <td class="container">
              <div class="content">

                <!-- START CENTERED WHITE CONTAINER -->
                <table role="presentation" class="main">

                  <!-- START MAIN CONTENT AREA -->
                  <tr>
                    <td class="wrapper">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td>
                            <header style="height:60px;background:#093579; margin-bottom: 20px;padding:0 10px;">
                              <a href="https://www.naadanchords.com" target="_blank"><img src="https://naadanchords-images.s3.ap-south-1.amazonaws.com/public/logo.png" height="60" /></a>
                            </header>
                            <p>Hey,</p>
                            <p>Someone just submitted a new rating on your post <a href="https://www.naadanchords.com/${post.postId}">${post.title}</a>.</p>
                            <p>The rating: <b>${rating}</b> stars</p>
                            <p>Thanks for being a contributor!</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                <!-- END MAIN CONTENT AREA -->
                </table>
                <!-- END CENTERED WHITE CONTAINER -->

              </div>
            </td>
            <td>&nbsp;</td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const emailParams = {
    Source: 'admin@naadanchords.com', // SES SENDING EMAIL
    ReplyToAddresses: ['naadanchords@gmail.com'],
    Destination: {
      ToAddresses: [emailId], // SES RECEIVING EMAIL
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: emailBody
        },
        Text: {
          Charset: 'UTF-8',
          Data: `New rating on your post ${post.title}\n\nRating: ${rating}`,
        },
      },
      Subject: {
        Charset: 'UTF-8',
        Data: `Naadan Chords - Someone rated ${post.title}`,
      },
    },
  };

  await sesLib.call("sendEmail", emailParams);
}

async function appendTitles(ratingMap) {
  let filterExpression = "";
  let expressionAttributeValues = {};
  let i = 0;

  for(let postId in ratingMap) {
    if(ratingMap.hasOwnProperty(postId)) {
      if(filterExpression) {
        filterExpression += ` OR contains(postId, :postId${i})`;
      } else {
        filterExpression = `contains(postId, :postId${i})`;
      }
      expressionAttributeValues[`:postId${i}`] = postId;
      i++;
    }
  }

  let params = {
    TableName: "NaadanChords",
    FilterExpression: filterExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ProjectionExpression: "postId, title"
  };

  try {
    let itemsResult = await dynamoDbLib.call("scan", params);
    let items = itemsResult.Items;
    
    for(let i = 0; i < items.length; i++) {
      ratingMap[items[i].postId].title = items[i].title;
    }
  } catch(e) {
    //Do nothing
  }

  return ratingMap;
}

function constructRatingMap(result) {
  let ratingMap = {};

  for(let i = 0; i < result.Items.length; i++) {
    let item = result.Items[i];
    if(ratingMap.hasOwnProperty(item.postId)) {
      let existingItem = ratingMap[item.postId];
      let newCount = existingItem.count + 1;
      let newRating = ((existingItem.rating * existingItem.count) + item.rating) / newCount;

      ratingMap[item.postId] = {
        rating: newRating,
        count: newCount
      }
    } else {
      ratingMap[item.postId] = {
        rating: item.rating,
        count: 1
      }
    }
  }

  return ratingMap;
}

function calculateWeightedRatings(ratingMap) {
  let totalAverageRating, totalAverage = 0, totalCount = 0;

  for(let postId in ratingMap) {
    if(ratingMap.hasOwnProperty(postId)) {
      let item = ratingMap[postId];
      totalAverage += item.rating;
      totalCount++;
    }
  }

  totalAverageRating = totalAverage / totalCount;

  for(let postId in ratingMap) {
    if(ratingMap.hasOwnProperty(postId)) {
      let averageRating = ratingMap[postId].rating;
      let ratingCount = ratingMap[postId].count;
      let tuneParameter = 25000;

      let weightedRating = (ratingCount / (ratingCount + tuneParameter)) * averageRating + (tuneParameter / (ratingCount + tuneParameter)) * totalAverageRating;
      ratingMap[postId].weightedRating = weightedRating;
    }
  }
  return ratingMap;
}

async function saveRatings(ratingMap) {
  let itemsArray = [];

  ratingMap = calculateWeightedRatings(ratingMap);
  ratingMap = await appendTitles(ratingMap);

  for(let postId in ratingMap) {
    if(ratingMap.hasOwnProperty(postId)) {
      let item = {
        PutRequest : {
          Item : {
            postId: postId,
            postType: "POST",
            ...ratingMap[postId]
          }
        }
      };
      itemsArray.push(item);
    }
  }

  const params = {
    RequestItems: {
      "NaadanChordsRatings": itemsArray
    },
    ReturnItemCollectionMetrics: "SIZE",
    ConsumedCapacity: "INDEXES"
  };

  try {
    let result = await dynamoDbLib.batchCall(params);
    return result;
  } catch(e) {
    return e;
  }
}

async function generateRatings() {
  let params = {
    TableName: "NaadanChordsRatingsLog",
    ProjectionExpression: "postId, rating"
  };

  try {
    let ratingMap = {};
    let result = await dynamoDbLib.call("scan", params);
    ratingMap = constructRatingMap(result);
    while(result.hasOwnProperty("LastEvaluatedKey")) {
      params.ExclusiveStartKey = result.LastEvaluatedKey;
      result = await dynamoDbLib.call("scan", params);
      ratingMap = constructRatingMap(result);
    }
    let saveRatingsResponse = await saveRatings(ratingMap);
    return saveRatingsResponse;
  } catch(e) {
    return false;
  }
}

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
    await sendEmailToAuthor(data.postId, rating);
    await generateRatings();
    return success(params.Item);
  } catch (e) {
    return failure({ status: false, error: e });
  }
}