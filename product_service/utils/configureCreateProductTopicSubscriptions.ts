import * as sns from "aws-cdk-lib/aws-sns";
import type { Construct } from "constructs";
import {
  HIGH_PRICE_THRESHOLD,
  LOW_STOCK_THRESHOLD,
  SNS_PRODUCT_ATTR_COUNT,
  SNS_PRODUCT_ATTR_PRICE,
} from "../constants/sns";
import type { CreateProductTopicEmails } from "./resolveCreateProductTopicEmails";

/**
 * SNS allows only one subscription per (topic, protocol, endpoint).
 * If all emails are the same, create a single subscription without a filter.
 */
export function configureCreateProductTopicSubscriptions(
  scope: Construct,
  topic: sns.ITopic,
  emails: CreateProductTopicEmails,
): void {
  const { defaultEmail, highPriceEmail, lowStockEmail } = emails;
  const allSameEmail =
    defaultEmail === highPriceEmail && defaultEmail === lowStockEmail;

  if (allSameEmail) {
    new sns.CfnSubscription(scope, "CreateProductTopicAllProductsSub", {
      topicArn: topic.topicArn,
      protocol: sns.SubscriptionProtocol.EMAIL,
      endpoint: defaultEmail,
      filterPolicy: {},
    });
    return;
  }

  new sns.Subscription(scope, "CreateProductTopicDefaultSub", {
    topic,
    endpoint: defaultEmail,
    protocol: sns.SubscriptionProtocol.EMAIL,
  });

  if (highPriceEmail !== defaultEmail) {
    new sns.Subscription(scope, "CreateProductTopicHighPriceSub", {
      topic,
      endpoint: highPriceEmail,
      protocol: sns.SubscriptionProtocol.EMAIL,
      filterPolicy: {
        [SNS_PRODUCT_ATTR_PRICE]: sns.SubscriptionFilter.numericFilter({
          greaterThanOrEqualTo: HIGH_PRICE_THRESHOLD,
        }),
      },
    });
  }

  if (
    lowStockEmail !== defaultEmail &&
    lowStockEmail !== highPriceEmail
  ) {
    new sns.Subscription(scope, "CreateProductTopicLowStockSub", {
      topic,
      endpoint: lowStockEmail,
      protocol: sns.SubscriptionProtocol.EMAIL,
      filterPolicy: {
        [SNS_PRODUCT_ATTR_COUNT]: sns.SubscriptionFilter.numericFilter({
          lessThan: LOW_STOCK_THRESHOLD,
        }),
      },
    });
  }
}
