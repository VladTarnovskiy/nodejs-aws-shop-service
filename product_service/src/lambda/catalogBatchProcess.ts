import type { SQSEvent, SQSRecord } from "aws-lambda";
import { createProductAndStockTxn } from "../db/productWrite";
import { validateCreateProductBody } from "../handlers/productValidation";

/** Coerce CSV string fields from SQS messages before API-style validation. */
export function normalizeCatalogPayload(payload: unknown): unknown {
  if (
    typeof payload !== "object" ||
    payload === null ||
    Array.isArray(payload)
  ) {
    return payload;
  }

  const body = payload as Record<string, unknown>;
  const normalized: Record<string, unknown> = { ...body };

  if (typeof body.price === "string") {
    const price = Number(body.price);
    if (!Number.isNaN(price)) {
      normalized.price = price;
    }
  }

  if (typeof body.count === "string" && body.count.trim() !== "") {
    const count = Number(body.count);
    if (!Number.isNaN(count)) {
      normalized.count = count;
    }
  }

  return normalized;
}

async function processRecord(record: SQSRecord): Promise<void> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(record.body);
  } catch {
    console.error("Invalid SQS message body (not JSON):", record.messageId);
    return;
  }

  const validation = validateCreateProductBody(
    normalizeCatalogPayload(parsed),
  );
  if (!validation.ok) {
    console.error(
      "Invalid catalog item:",
      validation.message,
      record.messageId,
    );
    return;
  }

  const created = await createProductAndStockTxn(validation.value);
  console.log("Created product from catalog batch:", {
    id: created.id,
    title: created.title,
  });
}

export async function handler(event: SQSEvent): Promise<void> {
  for (const record of event.Records) {
    await processRecord(record);
  }
}
