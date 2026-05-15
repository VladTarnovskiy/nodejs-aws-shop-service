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

| Setting | Suggestion |
| ------- | ---------- |
| Block Public Access | Keep all blocks **on** |
| Versioning | Optional |
| Encryption | SSE-S3 (default) is fine |

Optional: block public access and use default encryption; no public ACLs needed.

### Wire the bucket name into CDK (optional output)

Before deploy, set the bucket name so the stack can echo it in outputs:

```bash
export IMPORT_BUCKET_NAME=your-bucket-name-here
```

On Windows (PowerShell):

```powershell
$env:IMPORT_BUCKET_NAME = "your-bucket-name-here"
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

| Command | Purpose |
| ------- | ------- |
| `npm run build` | Compile TypeScript |
| `npm run synth` | Synthesize CloudFormation |
| `npm run deploy` | Deploy Import Service stack |

```bash
npx cdk destroy
```

Destroys only resources defined in this stack (not the Console-created bucket unless you add it to the stack later).
