import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { dynamoDoc } from "./dynamoDocClient";
import { requireTableNames } from "./dynamoTables";
import type { CreateProductInput, ProductJoined } from "./productTypes";

export async function createProductAndStockTxn(
  input: CreateProductInput
): Promise<ProductJoined> {
  const { products, stocks } = requireTableNames();
  const id = randomUUID();
  const count = input.count ?? 0;

  await dynamoDoc.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: products,
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
            TableName: stocks,
            Item: {
              product_id: id,
              count,
            },
          },
        },
      ],
    })
  );

  return {
    id,
    title: input.title,
    description: input.description ?? "",
    price: input.price,
    count,
  };
}
