# nodejs-aws-shop-back

Backend monorepo layout:

| Service | Folder | Description |
| ------- | ------ | ----------- |
| Product Service | `product_service/` | API Gateway, Lambda, DynamoDB |
| Import Service | `import_service/` | Task 5 — S3 CSV import (CDK stack) |
| Authorization Service | `authorization_service/` | Task 7.1 — `basicAuthorizer` Lambda (Basic auth) |
| BFF Service | `bff_service/` | Task 10.1 — proxy to Product and Cart APIs |

Deploy each service from its folder after configuring AWS credentials: `npm install` then `npm run deploy`. See each package `README.md` for setup.

**BFF Service (Task 10.2):** from `bff_service/` copy `.env.example` to `.env`, then run `npm run deploy:eb`. Application name: `VladTarnovskiy-bff-api`, environment: `prod`, CNAME: `VladTarnovskiy-bff-api-prod`. Uses `--single` (no load balancer).

For **Task 7.x**, deploy **`authorization_service`** before **`import_service`** (Import API `/import` uses `basicAuthorizer`).