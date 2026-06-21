# Import Service

AWS CDK stack for **Task 5** (S3 integration, CSV import). Lives next to `product_service/` in the monorepo.

## Prerequisites

- **Node.js** 18+ and AWS credentials (same as Product Service).
- **AWS SDK for JavaScript v3** and **csv-parser** are listed in `package.json` (installed via `npm install`).

## Repository layout

```
nodejs-aws-shop-service/
  product_service/
  import_service/    ← this package
```

## Task 5.1 — S3 bucket

**CDK создаёт bucket при deploy** (`new s3.Bucket` в `import-service-stack.ts`): имя **`{IMPORT_BUCKET_BASE_NAME}-{accountId}`** (например `aws-rs-front-import-bucket-tsk-642917031658`), CORS для браузерной загрузки, block public access, шифрование SSE-S3. Базовое имя — в `constants/s3.ts` → `IMPORT_BUCKET_BASE_NAME`.

Папки `uploaded/` и `parsed/` — это префиксы ключей; появятся при первой загрузке и после парсинга, отдельно создавать в консоли не нужно.

Если bucket с таким именем **уже есть** в аккаунте, deploy может упасть — удалите старый bucket или смените `IMPORT_BUCKET_BASE_NAME` в `constants/s3.ts`.

При `cdk destroy` bucket удаляется вместе со стеком (`RemovalPolicy: DESTROY`, `autoDeleteObjects: true`).

## Task 5.2 — `GET /import` (presigned upload URL)

The **`importProductsFile`** Lambda returns a **presigned `PutObject` URL** as plain text for the key `uploaded/${name}`, where `name` is the **`name`** query string parameter (required at API Gateway).

Example after deploy (use **`ImportServiceApiUrl`** from stack outputs):

```text
GET {ImportServiceApiUrl}import?name=products.csv
```

Response body: the signed URL string only (`text/plain`).

## Task 7.2 — Lambda authorizer on `GET /import`

`GET /import` is protected by the **`basicAuthorizer`** Lambda from **`authorization_service/`** (TOKEN authorizer, `Authorization: Basic …` header).

Deploy order:

1. `authorization_service` — `npm run deploy` (creates `basicAuthorizer`)
2. `import_service` — `npm run deploy` (wires authorizer to `/import`)

Without a valid `Authorization` header, API Gateway returns **401** / **403** before `importProductsFile` runs.

### Frontend API paths

Point your **import** API base URL at this stack’s API Gateway origin (same pattern as the product API). Example:

```ts
const API_PATHS = {
  product: "https://xxxxxxxx.execute-api.eu-west-1.amazonaws.com/prod",
  import: "https://yyyyyyyy.execute-api.eu-west-1.amazonaws.com/prod",
};

// Presigned URL:
// `${API_PATHS.import}/import?name=${encodeURIComponent(fileName)}`
```

Use the **`ImportServiceApiUrl`** output (trailing slash is fine either way with `/import`).

### Загрузка из браузера (CORS на S3)

CORS на import-bucket задаётся в CDK (`cors` на `s3.Bucket`). После `npm run deploy` настраивать CORS в консоли не нужно.

Пример загрузки после получения URL (тело — `File` или `Blob`, без лишних заголовков):

```ts
const url = await fetch(`${importApi}import?name=${encodeURIComponent(file.name)}`)
  .then((r) => r.text());
await fetch(url, { method: "PUT", body: file });
```

Если бы в подпись входил фиксированный `Content-Type`, при несовпадении заголовка S3 отвечал бы 403 — в DevTools это часто выглядит как ошибка CORS.

## Task 5.3+ — `importFileParser` (S3 → CSV → CloudWatch → `parsed/`)

Lambda **`importFileParser`** срабатывает на **`s3:ObjectCreated:*`** только для ключей с префиксом **`uploaded/`**. Читает объект **потоком** из S3, парсит **csv-parser**, логирует каждую строку в **CloudWatch**, затем **переносит** файл: копия в **`parsed/`**, удаление из **`uploaded/`**.

После загрузки CSV проверьте:

- **CloudWatch** → `/aws/lambda/importFileParser` — строки `CSV record:`
- **S3** → bucket → `parsed/products-sample.csv` (файла в `uploaded/` больше нет)

### Unit tests

Моки S3 / presigner — без реальных вызовов AWS:

```bash
npm test
```

## Install and deploy

From `import_service/`:

```bash
npm install
npm run synth
npm run deploy
```

First-time CDK in an account/region: run `npx cdk bootstrap` from either service folder (once per account/region).

## Useful commands

| Command          | Purpose                     |
| ---------------- | --------------------------- |
| `npm run build`  | Compile TypeScript          |
| `npm run synth`  | Synthesize CloudFormation   |
| `npm run deploy` | Deploy Import Service stack |

```bash
npx cdk destroy
```

Destroys only resources defined in this stack (not the Console-created bucket unless you add it to the stack later).
