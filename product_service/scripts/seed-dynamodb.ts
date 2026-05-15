import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  PRODUCTS_TABLE_NAME,
  STOCKS_TABLE_NAME,
} from "../constants/dynamodb";
import { products as seedProducts } from "../src/mock/products";

async function writeAll(
  client: DynamoDBDocumentClient,
  tableName: string,
  rows: Record<string, unknown>[],
): Promise<void> {
  const chunks: Record<string, unknown>[][] = [];
  for (let i = 0; i < rows.length; i += 25) {
    chunks.push(rows.slice(i, i + 25));
  }
  for (const chunk of chunks) {
    await client.send(
      new BatchWriteCommand({
        RequestItems: {
          [tableName]: chunk.map((Item) => ({ PutRequest: { Item } })),
        },
      }),
    );
  }
}

async function main(): Promise<void> {
  console.log(`Products table: ${PRODUCTS_TABLE_NAME}`);
  console.log(`Stocks table: ${STOCKS_TABLE_NAME}`);

  const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

  const productRows = seedProducts.map(({ id, title, description, price }) => ({
    id,
    title,
    description,
    price,
  }));

  const stockRows = seedProducts.map(({ id, count }) => ({
    product_id: id,
    count,
  }));

  console.log(`Writing ${productRows.length} products to ${PRODUCTS_TABLE_NAME} …`);
  await writeAll(client, PRODUCTS_TABLE_NAME, productRows);
  console.log(`Writing ${stockRows.length} stocks to ${STOCKS_TABLE_NAME} …`);
  await writeAll(client, STOCKS_TABLE_NAME, stockRows);
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
