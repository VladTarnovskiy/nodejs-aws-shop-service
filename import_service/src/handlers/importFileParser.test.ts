import type { S3Event, S3EventRecord } from "aws-lambda";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PARSED_PREFIX, UPLOADED_PREFIX } from "../../constants/s3";

const TEST_BUCKET_NAME = "aws-rs-front-import-bucket-tsk-642917031658";
import { importS3 } from "../s3/importS3Client";
import { uploadedKeyToParsedKey } from "./importFileParserKeys";
import { handler } from "./importFileParser";

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
  const sendSpy = vi.spyOn(importS3, "send");

  beforeEach(() => {
    process.env.IMPORT_BUCKET_NAME = TEST_BUCKET_NAME;
    sendSpy.mockReset();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("streams CSV, logs each record, then copies to parsed and deletes uploaded", async () => {
    sendSpy.mockImplementation(async (command) => {
      if (command instanceof GetObjectCommand) {
        return { Body: Readable.from([CSV_BODY]) };
      }
      return {};
    });

    await handler(
      s3Event(s3Record(`${UPLOADED_PREFIX}products-sample.csv`)),
    );

    expect(sendSpy).toHaveBeenCalledTimes(3);

    const getCmd = sendSpy.mock.calls[0][0] as GetObjectCommand;
    expect(getCmd.input.Key).toBe(`${UPLOADED_PREFIX}products-sample.csv`);

    const copyCmd = sendSpy.mock.calls[1][0] as CopyObjectCommand;
    expect(copyCmd.input).toEqual({
      Bucket: TEST_BUCKET_NAME,
      CopySource: `${TEST_BUCKET_NAME}/${UPLOADED_PREFIX}products-sample.csv`,
      Key: `${PARSED_PREFIX}products-sample.csv`,
    });

    const deleteCmd = sendSpy.mock.calls[2][0] as DeleteObjectCommand;
    expect(deleteCmd.input).toEqual({
      Bucket: TEST_BUCKET_NAME,
      Key: `${UPLOADED_PREFIX}products-sample.csv`,
    });

    const logSpy = vi.mocked(console.log);
    expect(logSpy).toHaveBeenCalledWith("CSV record:", {
      title: "Book A",
      price: "12",
    });
    expect(logSpy).toHaveBeenCalledWith("CSV record:", {
      title: "Book B",
      price: "25",
    });
    expect(logSpy).toHaveBeenCalledWith(
      "Moved file to parsed folder:",
      expect.objectContaining({
        from: `${UPLOADED_PREFIX}products-sample.csv`,
        to: `${PARSED_PREFIX}products-sample.csv`,
      }),
    );
  });

  it("skips objects outside uploaded prefix without calling S3", async () => {
    await handler(s3Event(s3Record(`${PARSED_PREFIX}already.csv`)));

    expect(sendSpy).not.toHaveBeenCalled();
  });
});
