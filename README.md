# nodejs-aws-shop-back

Backend monorepo layout:

| Service | Folder | Description |
| ------- | ------ | ----------- |
| Product Service | `product_service/` | API Gateway, Lambda, DynamoDB |
| Import Service | `import_service/` | Task 5 — S3 CSV import (CDK stack) |
| Authorization Service | `authorization_service/` | Task 7.1 — `basicAuthorizer` Lambda (Basic auth) |

Deploy each service from its folder after configuring AWS credentials: `npm install` then `npm run deploy`. See each package `README.md` for setup.

For **Task 7.x**, deploy **`authorization_service`** before **`import_service`** (Import API `/import` uses `basicAuthorizer`).