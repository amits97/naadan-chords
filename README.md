## Naadan Chords
Source code for Naadan Chords - a platform for Guitarists : https://www.naadanchords.com

> This project is a `create-react-app` application which communicates with a [serverless](https://serverless.com/) backend. Powered by AWS Services and a `Puppeteer` powered Prerenderer for SEO benefits.

At a high level, this is how the project is split:
* **Backend API** - Managed by serverless. Uses AWS Lambda over API Gateway to fetch data from DynamoDB.
* **Frontend React Application** - All React frontend assets (HTML, CSS and JS from your npm build command) on AWS S3. Served using CloudFront.
* **Middleware** - Lambda@Edge on CloudFront which contains logic to send crawlers to fully rendered HTML content served from a Lambda function which runs `Puppeteer` using a `Chromium` headless browser. There is a cache layer in DynamoDB for already rendered pages.

## Running Locally
* Clone the repository using: `git clone https://github.com/amits97/naadan-chords.git`
* Change into the cloned directory: `cd naadan-chords`
* Install required dependencies: `npm install`
* Start local server: `npm start`

## Commands
### Frontend (root `/` folder)
* `npm start` to run project locally after installing all dependencies using `npm install`.
* `npm run sitemap` to run sitemap generator which generates updated sitemap.xml in public folder.
* `npm run deploy` to create new sitemap.xml and deploy all changes to S3 bucket and invalidate CloudFront cache.
* `npm version minor --no-git-tag-version` to bump version number manually. This number appears in footer for verifying client version deployed.

### Backend (`api/` folder)
* Install `serverless` using the command `npm install serverless -g`.
* `serverless deploy` to deploy new API changes after installing all dependencies using `npm install`.
* `serverless deploy -f function-name` to deploy specific functions.

### Middleware (`prerender/` folder)
* `serverless deploy` to deploy new API changes after installing all dependencies using `npm install`.
