import type { SQSEvent, SQSRecord } from "aws-lambda";
import { PublishCommand } from "@aws-sdk/client-sns";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as productWrite from "../../src/db/productWrite";
import {
  handler,
  normalizeCatalogPayload,
  notifyProductCreated,
} from "../../src/lambda/catalogBatchProcess";
import { productSns } from "../../src/sns/productSnsClient";

const TEST_TOPIC_ARN = "arn:aws:sns:eu-west-1:642917031658:createProductTopic";

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

describe("notifyProductCreated", () => {
  const snsSendSpy = vi.spyOn(productSns, "send");

  beforeEach(() => {
    process.env.CREATE_PRODUCT_TOPIC_ARN = TEST_TOPIC_ARN;
    snsSendSpy.mockReset();
    snsSendSpy.mockResolvedValue({});
  });

  it("publishes product JSON to SNS topic", async () => {
    await notifyProductCreated({
      id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      title: "Book A",
      description: "Desc",
      price: 12,
      count: 3,
    });

    expect(snsSendSpy).toHaveBeenCalledTimes(1);
    const command = snsSendSpy.mock.calls[0][0] as PublishCommand;
    expect(command.input.TopicArn).toBe(TEST_TOPIC_ARN);
    expect(command.input.Subject).toBe("Product created: Book A");
    expect(command.input.Message).toBe(
      JSON.stringify({
        id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        title: "Book A",
        description: "Desc",
        price: 12,
        count: 3,
      }),
    );
    expect(command.input.MessageAttributes).toEqual({
      price: { DataType: "Number", StringValue: "12" },
      count: { DataType: "Number", StringValue: "3" },
      title: { DataType: "String", StringValue: "Book A" },
    });
  });
});

describe("catalogBatchProcess handler", () => {
  const snsSendSpy = vi.spyOn(productSns, "send");

  beforeEach(() => {
    process.env.CREATE_PRODUCT_TOPIC_ARN = TEST_TOPIC_ARN;
    snsSendSpy.mockReset();
    snsSendSpy.mockResolvedValue({});
  });

  it("creates a product and sends SNS for each valid SQS message", async () => {
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
    expect(snsSendSpy).toHaveBeenCalledTimes(2);
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
    expect(snsSendSpy).toHaveBeenCalledTimes(1);
    expect(productWrite.createProductAndStockTxn).toHaveBeenCalledWith({
      title: "Valid",
      description: undefined,
      price: 10,
      count: undefined,
    });
  });

  it("skips non-JSON SQS bodies without creating products or sending SNS", async () => {
    await handler({
      Records: [
        {
          messageId: "bad-json",
          body: "not-json",
        },
      ],
    } as SQSEvent);

    expect(productWrite.createProductAndStockTxn).not.toHaveBeenCalled();
    expect(snsSendSpy).not.toHaveBeenCalled();
  });
});
