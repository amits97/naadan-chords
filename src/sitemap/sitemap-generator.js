require("@babel/register")({
  presets: ["@babel/preset-env", "@babel/preset-react"],
});

const { generateDelayPromise } = require("../libs/utils");
const router = require("./sitemap-routes").default;
const Sitemap = require("react-router-sitemap").default;

const config = require("../config");
const axios = require("axios").default;

const slugify = require("../libs/utils").slugify;

function prepareLastEvaluatedPostRequest(lastEvaluatedPost) {
  return encodeURIComponent(
    JSON.stringify(lastEvaluatedPost).replace(/"/g, "'")
  );
}

async function loadPosts(exclusiveStartKey) {
  try {
    let queryRequest = "/posts?includeContentDetails=true";
    if (exclusiveStartKey) {
      queryRequest = `/posts?includeContentDetails=true&exclusiveStartKey=${exclusiveStartKey}`;
    }

    let postsResult = await axios.get(
      config.default.apiGateway.URL + queryRequest
    );
    return postsResult.data;
  } catch (e) {
    console.log(e);
  }
}

async function loadPages(page, category, author) {
  try {
    let queryRequest = `/posts?page=${page}`;
    if (category) {
      queryRequest = `/posts?category=${category}&page=${page}`;
    }
    if (author) {
      queryRequest = `/posts/user-posts?userName=${author}&page=${page}`;
    }
    let pageResult = await axios.get(
      config.default.apiGateway.URL + queryRequest
    );
    return pageResult.data;
  } catch (e) {
    console.log(e);
  }
}

async function generatePagination(category) {
  let page = 0;
  let pageMap = [];
  let pagesResult;
  do {
    pagesResult = await loadPages(page + 1, category ? category : null);
    if (pagesResult.Items && pagesResult.Items.length > 0) {
      pageMap.push({ number: page + 1 });
      page++;
    } else {
      if (
        pagesResult.error &&
        pagesResult.error.code === "TooManyRequestsException"
      ) {
        pagesResult.LastEvaluatedKey = {};
        // Delay next call by 1 sec to prevent Lambda throttle error.
        await generateDelayPromise(1000);
      }
    }
  } while (pagesResult.hasOwnProperty("LastEvaluatedKey"));
  return pageMap;
}

async function generateAuthorPagination(author) {
  let page = 0;
  let pageMap = [];
  let pagesResult;

  do {
    pagesResult = await loadPages(page + 1, null, author);
    if (pagesResult.Items && pagesResult.Items.length > 0) {
      if (page === 0 && !pagesResult.hasOwnProperty("LastEvaluatedKey")) {
        // Add author pagination only if minimum 2 pages are present
        break;
      }
      pageMap.push({ userName: author, number: page + 1 });
      page++;
    } else {
      if (
        pagesResult.error &&
        pagesResult.error.code === "TooManyRequestsException"
      ) {
        pagesResult.LastEvaluatedKey = {};
        // Delay next call by 1 sec to prevent Lambda throttle error.
        await generateDelayPromise(1000);
      }
    }
  } while (pagesResult.hasOwnProperty("LastEvaluatedKey"));
  return pageMap;
}

async function generateSitemap() {
  //posts
  let postsResult = await loadPosts();
  let idMap = [];
  let authorList = {};
  let albumList = {};

  while (true) {
    for (var i = 0; i < postsResult.Items.length; i++) {
      idMap.push({ id: postsResult.Items[i].postId });

      if (
        postsResult.Items[i].contentDetails.hasContent &&
        postsResult.Items[i].contentDetails.hasTabs
      ) {
        idMap.push({ id: `${postsResult.Items[i].postId}?tab=tabs` });
      }

      if (postsResult.Items[i].contentDetails.hasVideo) {
        idMap.push({ id: `${postsResult.Items[i].postId}?tab=video` });
      }

      if (!authorList.hasOwnProperty(postsResult.Items[i].userName)) {
        authorList[postsResult.Items[i].userName] = 1;
      }

      if (!albumList.hasOwnProperty(postsResult.Items[i].album)) {
        albumList[postsResult.Items[i].album] = 1;
      }
    }

    if (!postsResult.hasOwnProperty("LastEvaluatedKey")) break;

    postsResult = await loadPosts(
      prepareLastEvaluatedPostRequest(postsResult.LastEvaluatedKey)
    );
  }

  //posts pages
  let pageMap = await generatePagination();
  let malayalamPageMap = await generatePagination("MALAYALAM");
  let tamilPageMap = await generatePagination("TAMIL");
  let teluguPageMap = await generatePagination("TELUGU");
  let hindiPageMap = await generatePagination("HINDI");

  let authorMap = [];
  let authorPageMap = [];
  //author pages
  for (let author in authorList) {
    if (authorList.hasOwnProperty(author)) {
      authorMap.push({ userName: author });
      let authorPaginationResult = await generateAuthorPagination(author);
      authorPageMap.push(...authorPaginationResult);
    }
  }

  let albumMap = [];
  for (let album in albumList) {
    if (albumList.hasOwnProperty(album)) {
      albumMap.push({ album: slugify(album) });
    }
  }

  const paramsConfig = {
    "/:id": idMap,
    "/page/:number": pageMap,
    "/category/malayalam/page/:number": malayalamPageMap,
    "/category/tamil/page/:number": tamilPageMap,
    "/category/telugu/page/:number": teluguPageMap,
    "/category/hindi/page/:number": hindiPageMap,
    "/album/:album": albumMap,
    "/author/:userName": authorMap,
    "/author/:userName/page/:number": authorPageMap,
  };

  return new Sitemap(router)
    .applyParams(paramsConfig)
    .build("https://www.naadanchords.com")
    .save("./public/sitemap.xml");
}

generateSitemap();
