import { success, failure, redirect, custom } from "./libs/response-lib";
import * as dynamoDbLib from "./libs/dynamodb-lib";

const chromium = require("chrome-aws-lambda");
const puppeteer = require("puppeteer-core");
const axios = require("axios").default;
const { XMLParser } = require("fast-xml-parser");

async function dynamoDbCache(targetUrl) {
  const params = {
    TableName: "NaadanChordsPrerender",
    Key: {
      url: targetUrl,
    },
  };

  try {
    let result = await dynamoDbLib.call("get", params);
    if (result.Item) {
      return result.Item.html;
    }
  } catch (e) {
    // Do nothing for now
  }
}

async function writeDynamoDbCache(url, html) {
  const params = {
    TableName: "NaadanChordsPrerender",
    Item: {
      url: url,
      html: html,
      timestamp: Date.now(),
    },
  };

  try {
    await dynamoDbLib.call("put", params);
    return params.Item;
  } catch (e) {
    // Do nothing for now
  }
}

function trimUrl(targetUrl) {
  //Remove query parameters
  let cleanUrl = targetUrl.split("?")[0];

  //Remove trailing slashes
  return cleanUrl.replace(/\/$/, "");
}

export async function handler(event) {
  const ERROR_MESSAGE = "No query parameter given!";
  const INVALID_URL = "Invalid URL!";
  const ALLOWED_HOSTNAMES = [
    "www.naadanchords.com",
    "naadanchords.com",
    "www.nadanchords.com",
    "nadanchords.com",
  ];
  const HOSTNAME = "https://www.naadanchords.com";

  if (event.queryStringParameters) {
    const targetUrl = trimUrl(event.queryStringParameters.url);
    let parsedUrl;

    if (!targetUrl) {
      return failure(ERROR_MESSAGE);
    } else {
      parsedUrl = new URL(targetUrl);
      if (!ALLOWED_HOSTNAMES.includes(parsedUrl.hostname)) {
        return failure(INVALID_URL);
      }
    }

    //Check if cache present in DynamoDB
    let cache = await dynamoDbCache(targetUrl);
    if (cache) {
      return success(cache);
    }

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    // Allow only URLs from sitemap
    let whitelistedURL;
    try {
      let sitemapResult = await axios.get(`${HOSTNAME}/sitemap.xml`);
      const parser = new XMLParser();
      const jObj = parser.parse(sitemapResult.data);
      const urlArray = jObj.urlset.url.map((item) => item.loc);
      whitelistedURL = urlArray[urlArray.indexOf(targetUrl)];
      if (!whitelistedURL) {
        // Try appending trailing slash
        whitelistedURL = urlArray[urlArray.indexOf(`${targetUrl}/`)];
      }
    } catch (e) {
      return failure(e);
    }

    if (!whitelistedURL) {
      whitelistedURL = `${HOSTNAME}/page/not/found`;
    }

    try {
      let page = await browser.newPage();

      // Set flag to disable speedy mode
      let url = new URL(whitelistedURL);
      url.searchParams.append("isPrerendered", true);
      await page.goto(url.href);

      //remove layout breaking ads
      let elementClassToRemove = ".ad, .google-auto-placed";

      await page.evaluate((sel) => {
        var elements = document.querySelectorAll(sel);
        for (let i = 0; i < elements.length; i++) {
          elements[i].parentNode.removeChild(elements[i]);
        }
      }, elementClassToRemove);

      const result = await page.content();

      //Check for status code
      let status;
      try {
        await page.$("head > meta[name='prerender-status-code']");
        status = await page.$eval(
          "head > meta[name='prerender-status-code']",
          (element) => element.content
        );
      } catch (e) {
        // do nothing for now
      }

      if (status) {
        if (status === "301") {
          try {
            await page.$("head > meta[name='prerender-header']");
            let redirectUrl = await page.$eval(
              "head > meta[name='prerender-header']",
              (element) => element.content
            );
            browser.close();
            return redirect(redirectUrl);
          } catch (e) {
            // do nothing for now
          }
        } else {
          browser.close();
          return custom(parseInt(status), result);
        }
      }
      browser.close();
      await writeDynamoDbCache(targetUrl, result);
      return success(result);
    } catch (e) {
      return failure(e);
    }
  } else {
    return failure(ERROR_MESSAGE);
  }
}
