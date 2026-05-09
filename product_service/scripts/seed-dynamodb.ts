import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { products as seedProducts } from "../src/mock/products";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing env ${name}`);
  }
  return v;
}

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
  const productsTable = requireEnv("PRODUCTS_TABLE_NAME");
  const stocksTable = requireEnv("STOCKS_TABLE_NAME");

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

  console.log(`Writing ${productRows.length} products to ${productsTable} …`);
  await writeAll(client, productsTable, productRows);
  console.log(`Writing ${stockRows.length} stocks to ${stocksTable} …`);
  await writeAll(client, stocksTable, stockRows);
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
