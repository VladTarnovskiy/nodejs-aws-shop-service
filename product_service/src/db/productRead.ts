import {
  BatchGetCommand,
  GetCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { chunk, requireTableNames } from "./dynamoTables";
import { dynamoDoc } from "./dynamoDocClient";
import type { ProductJoined } from "./productTypes";

export async function listProductsJoined(): Promise<ProductJoined[]> {
  const { products, stocks } = requireTableNames();
  const scan = await dynamoDoc.send(new ScanCommand({ TableName: products }));
  const rows = (scan.Items ?? []) as Array<{
    id: string;
    title: string;
    description?: string;
    price: number;
  }>;

  if (rows.length === 0) {
    return [];
  }

  const stockByProductId = new Map<string, number>();
  const idChunks = chunk(
    rows.map((r) => r.id),
    100
  );

  for (const ids of idChunks) {
    const keys = ids.map((id) => ({ product_id: id }));
    const batch = await dynamoDoc.send(
      new BatchGetCommand({
        RequestItems: {
          [stocks]: { Keys: keys },
        },
      })
    );
    const stockItems = (batch.Responses?.[stocks] ?? []) as Array<{
      product_id: string;
      count: number;
    }>;
    for (const s of stockItems) {
      stockByProductId.set(s.product_id, s.count);
    }
  }

  return rows.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description ?? "",
    price: p.price,
    count: stockByProductId.get(p.id) ?? 0,
  }));
}

export async function findProductJoinedById(
  productId: string
): Promise<ProductJoined | null> {
  const { products, stocks } = requireTableNames();
  const [productRes, stockRes] = await Promise.all([
    dynamoDoc.send(
      new GetCommand({
        TableName: products,
        Key: { id: productId },
      })
    ),
    dynamoDoc.send(
      new GetCommand({
        TableName: stocks,
        Key: { product_id: productId },
      })
    ),
  ]);

  const p = productRes.Item as
    | {
        id: string;
        title: string;
        description?: string;
        price: number;
      }
    | undefined;

  if (!p) {
    return null;
  }

  const s = stockRes.Item as { count?: number } | undefined;

  return {
    id: p.id,
    title: p.title,
    description: p.description ?? "",
    price: p.price,
    count: typeof s?.count === "number" ? s.count : 0,
  };
}
