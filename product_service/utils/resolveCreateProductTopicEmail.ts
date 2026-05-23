import type { Construct } from "constructs";

export function resolveCreateProductTopicEmail(scope: Construct): string {
  const fromEnv = process.env.CREATE_PRODUCT_TOPIC_EMAIL?.trim();
  const fromContext = scope.node.tryGetContext("createProductTopicEmail") as
    | string
    | undefined;

  const email = fromEnv || fromContext?.trim();
  if (!email) {
    throw new Error(
      "Set CREATE_PRODUCT_TOPIC_EMAIL in .env or createProductTopicEmail in cdk.json context",
    );
  }
  return email;
}
