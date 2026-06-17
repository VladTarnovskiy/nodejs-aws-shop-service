import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import {
  PRODUCTS_TABLE_NAME,
  STOCKS_TABLE_NAME,
} from "../../constants/dynamodb";
import { dynamoDoc } from "./dynamoDocClient";
import type { CreateProductInput, ProductJoined } from "./productTypes";

export async function createProductAndStockTxn(
  input: CreateProductInput,
): Promise<ProductJoined> {
  const id = randomUUID();
  const count = input.count ?? 0;

  await dynamoDoc.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: PRODUCTS_TABLE_NAME,
            Item: {
              id,
              title: input.title,
              description: input.description ?? "",
              price: input.price,
            },
          },
        },
        {
          Put: {
            TableName: STOCKS_TABLE_NAME,
            Item: {
              product_id: id,
              count,
            },
          },
        },
      ],
    }),
  );

  return {
    id,
    title: input.title,
    description: input.description ?? "",
    price: input.price,
    count,
  };
}

export async function updateProductAndStockTxn(
  productId: string,
  input: CreateProductInput,
): Promise<ProductJoined> {
  const count = input.count ?? 0;

  await dynamoDoc.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Update: {
            TableName: PRODUCTS_TABLE_NAME,
            Key: { id: productId },
            UpdateExpression:
              "SET title = :title, description = :description, price = :price",
            ExpressionAttributeValues: {
              ":title": input.title,
              ":description": input.description ?? "",
              ":price": input.price,
            },
            ConditionExpression: "attribute_exists(id)",
          },
        },
        {
          Update: {
            TableName: STOCKS_TABLE_NAME,
            Key: { product_id: productId },
            UpdateExpression: "SET #count = :count",
            ExpressionAttributeNames: { "#count": "count" },
            ExpressionAttributeValues: { ":count": count },
            ConditionExpression: "attribute_exists(product_id)",
          },
        },
      ],
    }),
  );

  return {
    id: productId,
    title: input.title,
    description: input.description ?? "",
    price: input.price,
    count,
  };
}

export async function deleteProductAndStockTxn(
  productId: string,
): Promise<void> {
  await dynamoDoc.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Delete: {
            TableName: PRODUCTS_TABLE_NAME,
            Key: { id: productId },
            ConditionExpression: "attribute_exists(id)",
          },
        },
        {
          Delete: {
            TableName: STOCKS_TABLE_NAME,
            Key: { product_id: productId },
            ConditionExpression: "attribute_exists(product_id)",
          },
        },
      ],
    }),
  );
}
