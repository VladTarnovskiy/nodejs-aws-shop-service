import { SNSClient } from "@aws-sdk/client-sns";

/** Shared SNS client for product Lambdas (mockable in unit tests via `send`). */
export const productSns = new SNSClient({});
