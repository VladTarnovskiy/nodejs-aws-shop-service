# Product Service

AWS CDK stack: **API Gateway (REST)** + **Lambda** for `getProductsList`, `getProductsById`, and `createProduct`, backed by **DynamoDB** (`products`, `stocks`).

Product rows and stock counts are stored in separate tables and **joined** in Lambda responses (`id`, `title`, `description`, `price`, `count`). `POST /products` creates both the product row and matching stock row in a **single DynamoDB transaction** (`TransactWriteItems`) so neither table is left orphaned if the write fails.

## Prerequisites

- **Node.js** 18 or newer (Lambda uses Node.js 20).
- **AWS account** and credentials available to the AWS CLI (for example `aws configure` or environment variables).
- **AWS CDK CLI** (optional but useful): [Getting started with the AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html). You can also run CDK via `npx` through the npm scripts below.

## DynamoDB schemas

The assignment describes creating these in the Console; **this repo also provisions the same schemas via CDK** on deploy (table names **`products`** and **`stocks`**).

| Table      | Partition key                     | Attributes (items)                                       |
| ---------- | --------------------------------- | -------------------------------------------------------- |
| `products` | `id` (String, UUID)               | `title` (required), `description`, `price` (integer ≥ 0) |
| `stocks`   | `product_id` (String, product id) | `count` (integer ≥ 0)                                    |

Lambdas receive `PRODUCTS_TABLE_NAME` and `STOCKS_TABLE_NAME` from the stack outputs / environment variables.

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

Deploys DynamoDB tables, API Gateway, all Lambdas, and integrations:

```bash
npm run deploy
```

The first run can take a few minutes. When it finishes, copy the **Outputs** (especially **`ProductServiceApiUrl`**) — that HTTPS URL prefix is used for **`GET /products`** and **`POST /products`**. Paths such as **`GET /products/{id}`** use the same API host with the `{id}` appended.

### Seed sample rows

After tables exist (from deploy), load the sample fixture from **`src/mock/products.ts`**:

```bash
PRODUCTS_TABLE_NAME=products STOCKS_TABLE_NAME=stocks npm run seed
```

Use your actual names from the **`ProductsTableName`** and **`StocksTableName`** outputs if they differ.

## After deploy — HTTP API

| Method & path                 | Lambda            | Behaviour                                                            |
| ----------------------------- | ----------------- | -------------------------------------------------------------------- |
| `GET {ProductServiceApiUrl}`  | `getProductsList` | Lists products joined with `count` from stocks                       |
| `GET .../products/{id}`       | `getProductsById` | One joined product                                                   |
| `POST {ProductServiceApiUrl}` | `createProduct`   | Validates body; transactional create Product + Stock; **201** + body |

Example:

```bash
curl -sS "$API_URL/products"
curl -sS "$API_URL/products/7567ec4b-b10c-48c5-9345-fc73c48a80aa"
curl -sS -X POST "$API_URL/products" \
  -H "Content-Type: application/json" \
  -d '{"title":"Widget","description":"Nice","price":99,"count":5}'
```

**Cross-check:** put the **`ProductServiceApiUrl`** output (and deployed front-end URL, if separate) into your RS App submission / PR description.

### Frontend integration (joined `Product`)

Use one client-side type that mirrors the joined API payload (same identifiers as DynamoDB rows, aggregated for the UI):

```ts
interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  count: number; // stock; future cart logic should enforce quantity ≤ count
}
```

Fetch `GET /products` and map the JSON array to this shape (no extra merge needed if you trust the API).

### OpenAPI (Swagger)

The contract for this API is in **`openapi.yaml`** at the root of this package. Open [Swagger Editor](https://editor.swagger.io/) in a browser and use **File → Import file** (or paste the YAML) to render paths, schemas, and documented responses.

### Unit tests

Handler logic is covered with **Vitest** (mocks DynamoDB; no AWS calls). From `product_service/`:

```bash
npm test
```

Watch mode while developing:

```bash
npm run test:watch
```

## Useful commands

| Command              | Purpose                                             |
| -------------------- | --------------------------------------------------- |
| `npm run build`      | Compile TypeScript (`bin/`, `lib/` for CDK)         |
| `npm run watch`      | Watch mode for TypeScript                           |
| `npm test`           | Run unit tests (Vitest)                             |
| `npm run test:watch` | Vitest watch mode                                   |
| `npm run synth`      | Synthesize CDK to `cdk.out/`                        |
| `npm run deploy`     | Deploy stack without interactive approval prompts   |
| `npm run seed`       | Put sample products + stocks (requires env + creds) |

To destroy the stack when you no longer need it:

```bash
npx cdk destroy
```

**Note:** DynamoDB tables use `RemovalPolicy: DESTROY` in this stack so they are removed with the stack; switch to `RETAIN` in `lib/product-service-stack.ts` if you need to keep data after stack deletion.
