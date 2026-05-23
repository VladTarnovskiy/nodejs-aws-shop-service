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
