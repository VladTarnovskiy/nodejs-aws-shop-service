import { S3Client } from "@aws-sdk/client-s3";

/** Shared S3 client for import Lambdas (mockable in unit tests via `send`). */
export const importS3 = new S3Client({});
