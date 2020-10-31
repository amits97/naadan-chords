import AWS from "aws-sdk";

export function call(action, params) {
  const s3 = new AWS.S3({apiVersion: "2016-04-19", region: "ap-south-1"});

  return s3[action](params).promise();
}
