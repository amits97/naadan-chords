const AWS = require('aws-sdk');
const SES = new AWS.SES({
  region: 'us-east-1' 
});

export function call(action, params) {
  return SES[action](params).promise();
}