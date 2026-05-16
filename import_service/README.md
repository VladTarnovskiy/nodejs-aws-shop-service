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

## Task 5.1 — S3 bucket in the AWS Console

Create and configure the bucket **manually** (assignment requirement):

1. Open **Amazon S3** in the [AWS Console](https://console.aws.amazon.com/s3/).
2. **Create bucket** (unique name, same **Region** as Product Service / CDK).
3. Create a **folder** named `uploaded` (S3 treats this as the key prefix `uploaded/`).
4. Note the **bucket name** for later steps.

Recommended settings for homework:

| Setting             | Suggestion               |
| ------------------- | ------------------------ |
| Block Public Access | Keep all blocks **on**   |
| Versioning          | Optional                 |
| Encryption          | SSE-S3 (default) is fine |

Optional: block public access and use default encryption; no public ACLs needed.

### Wire the bucket name into CDK

Set **`IMPORT_BUCKET_NAME`** in **`constants/s3.ts`** to the bucket you created (must match the Console bucket name and region).

## Task 5.2 — `GET /import` (presigned upload URL)

The **`importProductsFile`** Lambda returns a **presigned `PutObject` URL** as plain text for the key `uploaded/${name}`, where `name` is the **`name`** query string parameter (required at API Gateway).

Example after deploy (use **`ImportServiceApiUrl`** from stack outputs):

```text
GET {ImportServiceApiUrl}import?name=products.csv
```

Response body: the signed URL string only (`text/plain`).

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

Запрос **GET /import** идёт на API Gateway (CORS уже есть). **PUT** по presigned URL идёт на **S3** — CORS нужно включить **на вашем import-bucket** в консоли (bucket создаётся вручную по Task 5.1; имя должно совпадать с `constants/s3.ts` → `IMPORT_BUCKET_NAME`).

**Важно:** если bucket с таким именем ещё не создан в том же регионе, что CDK (`us-east-1` и т.д.), деплой Lambda/API всё равно пройдёт, но загрузка и presigned URL не сработают, пока bucket не появится.

S3 → ваш bucket → **Permissions** → **CORS** → вставьте:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "HEAD", "POST"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

Пример загрузки после получения URL (тело — `File` или `Blob`, без лишних заголовков):

```ts
const url = await fetch(`${importApi}import?name=${encodeURIComponent(file.name)}`)
  .then((r) => r.text());
await fetch(url, { method: "PUT", body: file });
```

Если бы в подпись входил фиксированный `Content-Type`, при несовпадении заголовка S3 отвечал бы 403 — в DevTools это часто выглядит как ошибка CORS.

## Task 5.3 — `importFileParser` (S3 → CSV → CloudWatch)

Lambda **`importFileParser`** срабатывает на **`s3:ObjectCreated:*`** только для ключей с префиксом **`uploaded/`**. Читает объект потоком из S3, парсит **csv-parser** и пишет каждую строку в **CloudWatch Logs**.

После деплоя загрузите CSV через presigned URL, затем в консоли: **CloudWatch → Log groups → `/aws/lambda/importFileParser`**.

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
