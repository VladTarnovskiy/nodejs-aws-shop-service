# Authorization Service

AWS CDK stack with a **`basicAuthorizer`** Lambda for API Gateway **TOKEN** authorization using **HTTP Basic** credentials.

## Prerequisites

- **Node.js** 18 or newer (Lambda uses Node.js 20).
- **AWS credentials** configured for deploy (`aws configure` or environment variables).

## Credentials (`.env`)

Before **`npm run deploy`**, create **`authorization_service/.env`** (same folder as `package.json`). CDK reads it via `dotenv` and passes each entry to the Lambda environment.

Use your **GitHub account login** as the variable name and `TEST_PASSWORD` as the value:

```env
VladTarnovskiy=TEST_PASSWORD
```

As example use .env.template

## Install and deploy

```bash
cd authorization_service
npm install
npm run deploy
```

Stack outputs:

- **BasicAuthorizerArn** — attach this Lambda as a TOKEN authorizer on Import Service `/import` (Task 7.2).
- **BasicAuthorizerName** — Lambda function name (`basicAuthorizer`).

## Authorizer behavior

| Case                                                  | Response                                 |
| ----------------------------------------------------- | ---------------------------------------- |
| Missing / empty `Authorization` token                 | **401** (`Unauthorized` error)           |
| Invalid Basic token or wrong credentials              | **403** (IAM policy with `Effect: Deny`) |
| Valid `Authorization: Basic {base64(login:password)}` | **Allow** IAM policy for `methodArn`     |

Example header value:

```http
Authorization: Basic <base64-encoded VladTarnovskiy:TEST_PASSWORD>
```

## Tests

```bash
npm test
```
