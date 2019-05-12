require("babel-register")({
  presets: ["es2015", "react"]
});
 
const router = require("./sitemap-routes").default;
const Sitemap = require("react-router-sitemap").default;

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

function prepareLastEvaluatedPostRequest(lastEvaluatedPost) {
  return encodeURIComponent(JSON.stringify(lastEvaluatedPost).replace(/"/g, "'"));
}

async function loadPosts(exclusiveStartKey) {
  try {
    let queryRequest = "/posts";
    if(exclusiveStartKey) {
      queryRequest = `/posts?exclusiveStartKey=${exclusiveStartKey}`;
    }
  
    let postsResult = await API.get("posts", queryRequest);
    return postsResult; 
  } catch(e) {
    console.log(e);
  }
}

async function loadPages(page, category) {
  try {
    let queryRequest = `/posts/page/${page}`;
    if(category) {
      queryRequest = `/posts/category/${category}/page/${page}`;
    }
    let pageResult = await API.get("posts", queryRequest);
    return pageResult;
  } catch(e) {
    console.log(e);
  }
}

async function generateSitemap() {
  //posts
  let postsResult = await loadPosts();
  let idMap = [];

  while(postsResult.hasOwnProperty("LastEvaluatedKey")) {
    for(var i = 0; i < postsResult.Items.length; i++) {
      idMap.push({ id: postsResult.Items[i].postId });
    }

    postsResult = await loadPosts(prepareLastEvaluatedPostRequest(postsResult.LastEvaluatedKey));
  }

  for(var i = 0; i < postsResult.Items.length; i++) {
    idMap.push({ id: postsResult.Items[i].postId });
  }

  //posts pages
  let page = 0;
  let pageMap = [];
  let pagesResult = await loadPages(page+1);
  while(pagesResult.hasOwnProperty("LastEvaluatedKey")) {
    pageMap.push({ number: page+1 });
    page++;
    pagesResult = await loadPages(page);
  }

  //Malayalam category pages
  let malayalamPage = 0;
  let malayalamPageMap = [];
  let malayalamPagesResult = await loadPages(malayalamPage+1, "MALAYALAM");
  while(malayalamPagesResult.hasOwnProperty("LastEvaluatedKey")) {
    malayalamPageMap.push({ malayalamPageNumber: malayalamPage+1 });
    malayalamPage++;
    malayalamPagesResult = await loadPages(malayalamPage, "MALAYALAM");
  }

  const paramsConfig = {
    "/:id": idMap,
    "/page/:number": pageMap,
    "/category/malayalam/page/:malayalamPageNumber": malayalamPageMap
  };

  return (
    new Sitemap(router)
        .applyParams(paramsConfig)
        .build("https://www.naadanchords.com")
        .save("./public/sitemap.xml")
  );
}

generateSitemap();