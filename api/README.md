## Naadan Chords API
This directory contains a set of microservices for the Naadan Chords React frontend to communicate with various backend services like AWS DynamoDB and Cognito.

> Created using the [Serverless Framework](https://www.serverless.com), which is the simplest way to develop infinitely scalable, pay-per-execution serverless applications. The `serverless.yml` configuration file allows listing the functions and define endpoints that they’re subscribed to.

The API is split into the following microservices which can be deployed independent of each other.
* **account-service** - Contains APIs and functions for account/user related operations.
* **analytics-service** - Contains APIs and functions to measure popular posts.
* **contribution-service** - Contains APIs to manage user contributed posts.
* **draft-service** - Contains APIs to manage post drafts.
* **posts-service** - The main set of APIs to list and manage posts.
* **rating-service** - Contains APIs to manage post star ratings and to measure top rated posts.
* **top-posts-service** - `Soon to be deprecated` Contains a single API to return top 10 most popular posts. Will be moved to posts-service.
* **top-rated-posts-service** - `Soon to be deprecated` Contains a single API to return the 10 top rated posts. Will be moved to rating-service.

## Deploying changes
Since the microservices have different basePath mappings on the domain https://api.naadanchords.com, they can be deployed and managed independently.

* Install Serverless Framework: https://www.serverless.com/framework/docs/getting-started/
* Change into the required service: `cd posts-service`
* Install required dependencies: `npm install`
* `serverless deploy` to deploy new API changes.
