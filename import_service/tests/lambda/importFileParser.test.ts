import type { S3Event, S3EventRecord } from "aws-lambda";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { Readable } from "stream";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PARSED_PREFIX, UPLOADED_PREFIX } from "../../constants/s3";
import { handler } from "../../src/lambda/importFileParser";
import { uploadedKeyToParsedKey } from "../../src/utils/importFileParserKeys";
import { importS3 } from "../../src/s3/importS3Client";
import { importSqs } from "../../src/sqs/importSqsClient";

const TEST_BUCKET_NAME = "aws-rs-front-import-bucket-tsk-642917031658";
const TEST_QUEUE_URL =
  "https://sqs.eu-west-1.amazonaws.com/642917031658/catalogItemsQueue";

const CSV_BODY = "title,price\nBook A,12\nBook B,25\n";

function s3Record(key: string, bucket = TEST_BUCKET_NAME): S3EventRecord {
  return {
    s3: {
      bucket: { name: bucket },
      object: { key },
    },
  } as S3EventRecord;
}

function s3Event(...records: S3EventRecord[]): S3Event {
  return { Records: records } as S3Event;
}

describe("importFileParserKeys", () => {
  it("maps uploaded key to parsed key", () => {
    expect(uploadedKeyToParsedKey(`${UPLOADED_PREFIX}products.csv`)).toBe(
      `${PARSED_PREFIX}products.csv`,
    );
  });
});

describe("importFileParser handler", () => {
  const s3SendSpy = vi.spyOn(importS3, "send");
  const sqsSendSpy = vi.spyOn(importSqs, "send");

  beforeEach(() => {
    process.env.IMPORT_BUCKET_NAME = TEST_BUCKET_NAME;
    process.env.CATALOG_ITEMS_QUEUE_URL = TEST_QUEUE_URL;
    s3SendSpy.mockReset();
    sqsSendSpy.mockReset();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("streams CSV, enqueues each record to SQS, then copies to parsed and deletes uploaded", async () => {
    s3SendSpy.mockImplementation(async (command) => {
      if (command instanceof GetObjectCommand) {
        return { Body: Readable.from([CSV_BODY]) };
      }
      return {};
    });
    sqsSendSpy.mockResolvedValue({});

    await handler(s3Event(s3Record(`${UPLOADED_PREFIX}products-sample.csv`)));

    expect(s3SendSpy).toHaveBeenCalledTimes(3);

    const getCmd = s3SendSpy.mock.calls[0][0] as GetObjectCommand;
    expect(getCmd.input.Key).toBe(`${UPLOADED_PREFIX}products-sample.csv`);

    expect(sqsSendSpy).toHaveBeenCalledTimes(2);

    const firstSqs = sqsSendSpy.mock.calls[0][0] as SendMessageCommand;
    expect(firstSqs.input).toEqual({
      QueueUrl: TEST_QUEUE_URL,
      MessageBody: JSON.stringify({ title: "Book A", price: "12" }),
    });

    const secondSqs = sqsSendSpy.mock.calls[1][0] as SendMessageCommand;
    expect(secondSqs.input).toEqual({
      QueueUrl: TEST_QUEUE_URL,
      MessageBody: JSON.stringify({ title: "Book B", price: "25" }),
    });

    const copyCmd = s3SendSpy.mock.calls[1][0] as CopyObjectCommand;
    expect(copyCmd.input).toEqual({
      Bucket: TEST_BUCKET_NAME,
      CopySource: `${TEST_BUCKET_NAME}/${UPLOADED_PREFIX}products-sample.csv`,
      Key: `${PARSED_PREFIX}products-sample.csv`,
    });

    const deleteCmd = s3SendSpy.mock.calls[2][0] as DeleteObjectCommand;
    expect(deleteCmd.input).toEqual({
      Bucket: TEST_BUCKET_NAME,
      Key: `${UPLOADED_PREFIX}products-sample.csv`,
    });

    const logSpy = vi.mocked(console.log);
    expect(logSpy).not.toHaveBeenCalledWith("CSV record:", expect.anything());
    expect(logSpy).toHaveBeenCalledWith(
      "Moved file to parsed folder:",
      expect.objectContaining({
        from: `${UPLOADED_PREFIX}products-sample.csv`,
        to: `${PARSED_PREFIX}products-sample.csv`,
      }),
    );
  });

  it("skips objects outside uploaded prefix without calling S3 or SQS", async () => {
    await handler(s3Event(s3Record(`${PARSED_PREFIX}already.csv`)));

    expect(s3SendSpy).not.toHaveBeenCalled();
    expect(sqsSendSpy).not.toHaveBeenCalled();
  });
});
