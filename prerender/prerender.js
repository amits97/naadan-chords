import { success, failure, redirect, custom } from "./libs/response-lib";
import * as dynamoDbLib from "./libs/dynamodb-lib";

const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

async function dynamoDbCache(targetUrl) {
  const params = {
    TableName: "NaadanChordsPrerender",
    Key: {
      url: targetUrl
    }
  };

  try {
    let result = await dynamoDbLib.call("get", params);
    if(result.Item) {
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
      timestamp: Date.now()
    }
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

export async function handler(event, context, callback) {
  const ERROR_MESSAGE = 'No query parameter given!';

  if (event.queryStringParameters) {
    const targetUrl = trimUrl(event.queryStringParameters.url);

    if (!targetUrl) {
      return failure(ERROR_MESSAGE);
    }

    //Check if cache present in DynamoDB
    let cache = await dynamoDbCache(targetUrl);
    if(cache) {
      return success(cache);
    }

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless
    });

    try {
      let page = await browser.newPage();
      await page.goto(targetUrl);

      //remove layout breaking ads
      let elementClassToRemove = ".ad, .google-auto-placed";

      await page.evaluate((sel) => {
        var elements = document.querySelectorAll(sel);
        for(let i = 0; i < elements.length; i++){
          elements[i].parentNode.removeChild(elements[i]);
        }
      }, elementClassToRemove);

      const result = await page.content();

      //Check for status code
      let status;
      try {
        await page.$("head > meta[name='prerender-status-code']");
        status = await page.$eval("head > meta[name='prerender-status-code']", element => element.content);
      } catch (e) {
        // do nothing for now
      }

      if(status) {
        if(status === "301") {
          try {
            await page.$("head > meta[name='prerender-header']");
            let redirectUrl = await page.$eval("head > meta[name='prerender-header']", element => element.content);
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
    } catch(e) {
      return failure(elementFetched);
    }
  } else {
    return failure(ERROR_MESSAGE);
  }
}
