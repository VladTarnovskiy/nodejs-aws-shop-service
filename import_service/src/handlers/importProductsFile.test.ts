import type { APIGatewayProxyEvent } from "aws-lambda";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UPLOADED_PREFIX } from "../../constants/s3";

const TEST_BUCKET_NAME = "aws-rs-front-import-bucket-tsk-642917031658";

const mockGetSignedUrl = vi.fn();

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: (...args: unknown[]) => mockGetSignedUrl(...args),
}));

import { importS3 } from "../s3/importS3Client";
import { handler } from "./importProductsFile";

describe("importProductsFile handler", () => {
  beforeEach(() => {
    process.env.IMPORT_BUCKET_NAME = TEST_BUCKET_NAME;
    mockGetSignedUrl.mockReset();
    mockGetSignedUrl.mockResolvedValue("https://signed.example/upload");
  });

  it("returns 200 and presigned URL for a valid csv name", async () => {
    const event = {
      queryStringParameters: { name: "products-sample.csv" },
    } as unknown as APIGatewayProxyEvent;

    const res = await handler(event);

    expect(res.statusCode).toBe(200);
    expect(res.body).toBe("https://signed.example/upload");
    expect(res.headers?.["Content-Type"]).toContain("text/plain");
    expect(mockGetSignedUrl).toHaveBeenCalledTimes(1);

    const [client, command, options] = mockGetSignedUrl.mock.calls[0];
    expect(client).toBe(importS3);
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(command.input).toEqual({
      Bucket: TEST_BUCKET_NAME,
      Key: `${UPLOADED_PREFIX}products-sample.csv`,
    });
    expect(options).toEqual({ expiresIn: 3600 });
  });

  it("returns 400 when name query parameter is missing", async () => {
    const event = { queryStringParameters: null } as APIGatewayProxyEvent;

    const res = await handler(event);

    expect(res.statusCode).toBe(400);
    expect(res.body).toContain("name");
    expect(mockGetSignedUrl).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid file names", async () => {
    const event = {
      queryStringParameters: { name: "../evil.csv" },
    } as unknown as APIGatewayProxyEvent;

    const res = await handler(event);

    expect(res.statusCode).toBe(400);
    expect(mockGetSignedUrl).not.toHaveBeenCalled();
  });
});
