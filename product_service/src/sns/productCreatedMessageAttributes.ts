import type { MessageAttributeValue } from "@aws-sdk/client-sns";
import {
  SNS_PRODUCT_ATTR_COUNT,
  SNS_PRODUCT_ATTR_PRICE,
  SNS_PRODUCT_ATTR_TITLE,
} from "../../constants/sns";
import type { ProductJoined } from "../db/productTypes";

export function buildProductCreatedMessageAttributes(
  product: ProductJoined,
): Record<string, MessageAttributeValue> {
  return {
    [SNS_PRODUCT_ATTR_PRICE]: {
      DataType: "Number",
      StringValue: String(product.price),
    },
    [SNS_PRODUCT_ATTR_COUNT]: {
      DataType: "Number",
      StringValue: String(product.count),
    },
    [SNS_PRODUCT_ATTR_TITLE]: {
      DataType: "String",
      StringValue: product.title,
    },
  };
}
