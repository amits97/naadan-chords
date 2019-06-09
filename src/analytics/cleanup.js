require("babel-register")({
  presets: ["es2015", "react"]
});
 
const AWSAmplify = require("aws-amplify");
const Amplify = AWSAmplify.default;
const API = AWSAmplify.API;
const config = require("../config").default;

Amplify.configure({
  API: {
    endpoints: [
      {
        name: "posts",
        endpoint: config.apiGateway.URL,
        region: config.apiGateway.REGION
      },
    ]
  }
});

async function deleteCall() {
  try {
    let queryRequest = "/analytics-clean";
  
    let postsResult = await API.get("posts", queryRequest);
    return postsResult; 
  } catch(e) {
    console.log(e);
  }
}

async function cleanupAnalytics() {
  try {
    console.log("Running Analytics cleanup")
    console.log("Deleting items older than 3 weeks..");
    let result = await deleteCall();
    console.log(result.message);
    console.log("");
  } catch(e) {
    console.log(e);
  }
}

cleanupAnalytics();