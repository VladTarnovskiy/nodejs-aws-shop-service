# Product Service

AWS CDK stack for the shop product API: **API Gateway (REST)** + **Lambda** handlers `getProductsList` and `getProductsById`.

## Prerequisites

- **Node.js** 18 or newer (Lambda uses Node.js 20).
- **AWS account** and credentials available to the AWS CLI (for example `aws configure` or environment variables).
- **AWS CDK CLI** (optional but useful): [Getting started with the AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html). You can also run CDK via `npx` through the npm scripts below.

## First-time setup in an AWS account/region

If you have never used CDK in this account and region, bootstrap once:

```bash
npx cdk bootstrap aws://ACCOUNT-ID/REGION
```

Replace `ACCOUNT-ID` and `REGION` with your values (for example `aws sts get-caller-identity` and your chosen region).

## Install dependencies

From this directory (`product_service/`):

```bash
npm install
```

## Synthesize the CloudFormation template

Checks that the app compiles and prints the template (no AWS changes):

```bash
npm run synth
```

Optional: see pending changes before deploy:

```bash
npx cdk diff
```

## Deploy (launch the stack)

Deploys API Gateway, both Lambdas, and integrations:

```bash
npm run deploy
```

The first run can take a few minutes. When it finishes, note the **Outputs** in the terminal (or in the CloudFormation stack in the AWS Console), especially **ProductServiceApiUrl** — that is the public **GET /products** URL.

## After deploy

- **Product list:** `GET {ProductServiceApiUrl}` — returns a JSON array of products.
- **Product by id:** `GET` the same API base, path `/products/{productId}`, where `{productId}` is the product `id` from the list (UUID).

### OpenAPI (Swagger)

The contract for this API is in **`openapi.yaml`** at the root of this package. Open [Swagger Editor](https://editor.swagger.io/) in a browser and use **File → Import file** (or paste the YAML) to render paths, schemas, and documented responses.

### Unit tests

Handler and domain logic are covered with **Vitest** (no CDK or real AWS calls). From `product_service/`:

```bash
npm test
```

Watch mode while developing:

```bash
npm run test:watch
```

```bash
curl -s "https://xxxxxxxx.execute-api.REGION.amazonaws.com/prod/products"
curl -s "https://xxxxxxxx.execute-api.REGION.amazonaws.com/prod/products/7567ec4b-b10c-48c5-9345-fc73c48a80aa"
```

## Useful commands

| Command              | Purpose                                           |
| -------------------- | ------------------------------------------------- |
| `npm run build`      | Compile TypeScript (`bin/`, `lib/`)               |
| `npm run watch`      | Watch mode for TypeScript                         |
| `npm test`           | Run unit tests (Vitest)                           |
| `npm run test:watch` | Vitest watch mode                                 |
| `npm run synth`      | Synthesize CDK to `cdk.out/`                      |
| `npm run deploy`     | Deploy stack without interactive approval prompts |

To destroy the stack when you no longer need it:

```bash
npx cdk destroy
```
