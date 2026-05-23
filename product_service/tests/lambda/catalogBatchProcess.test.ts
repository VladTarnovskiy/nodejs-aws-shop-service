import type { SQSEvent, SQSRecord } from "aws-lambda";
import { describe, expect, it } from "vitest";
import * as productWrite from "../../src/db/productWrite";
import {
  handler,
  normalizeCatalogPayload,
} from "../../src/lambda/catalogBatchProcess";

function sqsRecord(body: unknown, messageId = "msg-1"): SQSRecord {
  return {
    messageId,
    body: JSON.stringify(body),
  } as SQSRecord;
}

function sqsEvent(...records: SQSRecord[]): SQSEvent {
  return { Records: records } as SQSEvent;
}

describe("normalizeCatalogPayload", () => {
  it("coerces string price and count from CSV rows", () => {
    expect(
      normalizeCatalogPayload({
        title: "Book A",
        description: "Desc",
        price: "12",
        count: "5",
      }),
    ).toEqual({
      title: "Book A",
      description: "Desc",
      price: 12,
      count: 5,
    });
  });
});

describe("catalogBatchProcess handler", () => {
  it("creates a product for each valid SQS message", async () => {
    await handler(
      sqsEvent(
        sqsRecord({ title: "Book A", price: 12, count: 3 }, "msg-1"),
        sqsRecord(
          { title: "Book B", description: "Paperback", price: "25" },
          "msg-2",
        ),
      ),
    );

    expect(productWrite.createProductAndStockTxn).toHaveBeenCalledTimes(2);
    expect(productWrite.createProductAndStockTxn).toHaveBeenNthCalledWith(1, {
      title: "Book A",
      description: undefined,
      price: 12,
      count: 3,
    });
    expect(productWrite.createProductAndStockTxn).toHaveBeenNthCalledWith(2, {
      title: "Book B",
      description: "Paperback",
      price: 25,
      count: undefined,
    });
  });

  it("skips invalid messages without throwing", async () => {
    await handler(
      sqsEvent(
        sqsRecord({ title: "", price: 1 }),
        sqsRecord({ title: "Valid", price: 10 }),
      ),
    );

    expect(productWrite.createProductAndStockTxn).toHaveBeenCalledTimes(1);
    expect(productWrite.createProductAndStockTxn).toHaveBeenCalledWith({
      title: "Valid",
      description: undefined,
      price: 10,
      count: undefined,
    });
  });
});
