import { success, failure } from "./libs/response-lib";

const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

export async function handler(event, context, callback) {
	const ERROR_MESSAGE = 'No query parameter given!';

	if (event.queryStringParameters) {
		const targetUrl = event.queryStringParameters.url;

		if (!targetUrl) {
			return failure(ERROR_MESSAGE);
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
			const result = await page.content();
			browser.close();
			return success(result);
		} catch(e) {
			return failure(JSON.stringify(e));
		}
	} else {
		return failure(ERROR_MESSAGE);
	}
}
