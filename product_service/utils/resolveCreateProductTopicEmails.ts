import type { Construct } from "constructs";
import { resolveCreateProductTopicEmail } from "./resolveCreateProductTopicEmail";

export type CreateProductTopicEmails = {
  /** Receives every product-created notification (no filter). */
  defaultEmail: string;
  /** Receives notifications when `price` >= HIGH_PRICE_THRESHOLD. */
  highPriceEmail: string;
  /** Receives notifications when `count` < LOW_STOCK_THRESHOLD. */
  lowStockEmail: string;
};

function readOptionalEmail(
  scope: Construct,
  envKey: string,
  contextKey: string,
): string | undefined {
  const fromEnv = process.env[envKey]?.trim();
  const fromContext = scope.node.tryGetContext(contextKey) as string | undefined;
  return fromEnv || fromContext?.trim() || undefined;
}

export function resolveCreateProductTopicEmails(
  scope: Construct,
): CreateProductTopicEmails {
  const defaultEmail = resolveCreateProductTopicEmail(scope);

  const highPriceEmail = readOptionalEmail(
    scope,
    "CREATE_PRODUCT_TOPIC_EMAIL_HIGH_PRICE",
    "createProductTopicEmailHighPrice",
  );
  const lowStockEmail = readOptionalEmail(
    scope,
    "CREATE_PRODUCT_TOPIC_EMAIL_LOW_STOCK",
    "createProductTopicEmailLowStock",
  );

  if (!highPriceEmail || !lowStockEmail) {
    throw new Error(
      "Set CREATE_PRODUCT_TOPIC_EMAIL_HIGH_PRICE and CREATE_PRODUCT_TOPIC_EMAIL_LOW_STOCK in .env " +
        "(or createProductTopicEmailHighPrice / createProductTopicEmailLowStock in cdk.json context)",
    );
  }

  return { defaultEmail, highPriceEmail, lowStockEmail };
}
