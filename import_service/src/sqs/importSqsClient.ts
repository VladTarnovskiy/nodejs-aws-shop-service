import { SQSClient } from "@aws-sdk/client-sqs";

/** Shared SQS client for import Lambdas (mockable in unit tests via `send`). */
export const importSqs = new SQSClient({});
