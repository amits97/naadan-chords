require("babel-register")({
  presets: ["es2015", "react"]
});
 
const router = require("./sitemap-routes").default;
const Sitemap = require("react-router-sitemap").default;

const config = require("../config").default;
const axios = require('axios').default;

const slugify = require("../libs/utils").slugify;

function prepareLastEvaluatedPostRequest(lastEvaluatedPost) {
  return encodeURIComponent(JSON.stringify(lastEvaluatedPost).replace(/"/g, "'"));
}

async function loadPosts(exclusiveStartKey) {
  try {
    let queryRequest = "/posts";
    if(exclusiveStartKey) {
      queryRequest = `/posts?exclusiveStartKey=${exclusiveStartKey}`;
    }
  
    let postsResult = await axios.get(config.apiGateway.URL + queryRequest);
    return postsResult.data; 
  } catch(e) {
    console.log(e);
  }
}

async function loadPages(page, category, author) {
  try {
    let queryRequest = `/posts?page=${page}`;
    if(category) {
      queryRequest = `/posts?category=${category}&page=${page}`;
    }
    if(author) {
      queryRequest = `/user-posts?userName=${author}&page=${page}`;
    }
    let pageResult = await axios.get(config.apiGateway.URL + queryRequest);
    return pageResult.data;
  } catch(e) {
    console.log(e);
  }
}

async function generatePagination(category) {
  let page = 0;
  let pageMap = [];
  let pagesResult = await loadPages(page+1, category ? category : null);
  while(pagesResult.hasOwnProperty("LastEvaluatedKey")) {
    pageMap.push({ number: page+1 });
    page++;
    pagesResult = await loadPages(page, category ? category : null);
  }
  return pageMap;
}

async function generateAuthorPagination(author) {
  let page = 0;
  let pageMap = [];

  let pagesResult = await loadPages(page+1, null, author);
  while(pagesResult.hasOwnProperty("LastEvaluatedKey")) {
    pageMap.push({ userName: author, number: page+1});
    page++;
    pagesResult = await loadPages(page, null, author);
  }
  return pageMap;
}

async function generateSitemap() {
  //posts
  let postsResult = await loadPosts();
  let idMap = [];
  let authorList = {};
  let albumList = {};

  while(true) {
    for(var i = 0; i < postsResult.Items.length; i++) {
      idMap.push({ id: postsResult.Items[i].postId });

      if(!authorList.hasOwnProperty(postsResult.Items[i].userName)) {
        authorList[postsResult.Items[i].userName] = 1;
      }

      if(!albumList.hasOwnProperty(postsResult.Items[i].album)) {
        albumList[postsResult.Items[i].album] = 1;
      }
    }

    if(!postsResult.hasOwnProperty("LastEvaluatedKey")) break;

    postsResult = await loadPosts(prepareLastEvaluatedPostRequest(postsResult.LastEvaluatedKey));
  }

  for(var i = 0; i < postsResult.Items.length; i++) {
    idMap.push({ id: postsResult.Items[i].postId });
  }

  //posts pages
  let pageMap = await generatePagination();
  let malayalamPageMap = await generatePagination("MALAYALAM");

  let authorMap = [];
  let authorPageMap = [];
  //author pages
  for(let author in authorList) {
    if(authorList.hasOwnProperty(author)) {
      authorMap.push({ userName: author });
      let authorPaginationResult = await generateAuthorPagination(author);
      authorPageMap.push(...authorPaginationResult);
    }
  }

  let albumMap = [];
  for(let album in albumList) {
    if(albumList.hasOwnProperty(album)) {
      albumMap.push({ album: slugify(album) });
    }
  }

  const paramsConfig = {
    "/:id": idMap,
    "/page/:number": pageMap,
    "/category/malayalam/page/:number": malayalamPageMap,
    "/album/:album": albumMap,
    "/author/:userName": authorMap,
    "/author/:userName/page/:number": authorPageMap
  };

  return (
    new Sitemap(router)
        .applyParams(paramsConfig)
        .build("https://www.naadanchords.com")
        .save("./public/sitemap.xml")
  );
}

generateSitemap();