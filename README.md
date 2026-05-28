# nodejs-aws-shop-back

Backend monorepo layout:

| Service | Folder | Description |
| ------- | ------ | ----------- |
| Product Service | `product_service/` | API Gateway, Lambda, DynamoDB |
| Import Service | `import_service/` | Task 5 — S3 CSV import (CDK stack) |
| Authorization Service | `authorization_service/` | Task 7.1 — `basicAuthorizer` Lambda (Basic auth) |

Deploy each service from its folder after configuring AWS credentials: `npm install` then `npm run deploy`. See each package `README.md` for setup (Import Service: create the S3 bucket with an `uploaded/` folder in the Console per Task 5.1).