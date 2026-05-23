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
 * Filter policies are defined per email subscription.
 * Lambda must publish matching MessageAttributes on each notification.
 */
export function configureCreateProductTopicSubscriptions(
  scope: Construct,
  topic: sns.ITopic,
  emails: CreateProductTopicEmails,
): void {
  new sns.Subscription(scope, "CreateProductTopicDefaultSub", {
    topic,
    endpoint: emails.defaultEmail,
    protocol: sns.SubscriptionProtocol.EMAIL,
  });

  new sns.Subscription(scope, "CreateProductTopicHighPriceSub", {
    topic,
    endpoint: emails.highPriceEmail,
    protocol: sns.SubscriptionProtocol.EMAIL,
    filterPolicy: {
      [SNS_PRODUCT_ATTR_PRICE]: sns.SubscriptionFilter.numericFilter({
        greaterThanOrEqualTo: HIGH_PRICE_THRESHOLD,
      }),
    },
  });

  new sns.Subscription(scope, "CreateProductTopicLowStockSub", {
    topic,
    endpoint: emails.lowStockEmail,
    protocol: sns.SubscriptionProtocol.EMAIL,
    filterPolicy: {
      [SNS_PRODUCT_ATTR_COUNT]: sns.SubscriptionFilter.numericFilter({
        lessThan: LOW_STOCK_THRESHOLD,
      }),
    },
  });
}
