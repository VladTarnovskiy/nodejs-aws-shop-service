import type { APIGatewayProxyEvent } from "aws-lambda";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { handler as batchHandler } from "../../src/lambda/catalogBatchProcess";
import { productSns } from "../../src/sns/productSnsClient";
import { handler as createHandler } from "../../src/lambda/createProduct";
import { handler as byIdHandler } from "../../src/lambda/getProductsById";
import { handler as listHandler } from "../../src/lambda/getProductsList";

describe("lambda handlers", () => {
  beforeEach(() => {
    process.env.CREATE_PRODUCT_TOPIC_ARN =
      "arn:aws:sns:eu-west-1:642917031658:createProductTopic";
    vi.spyOn(productSns, "send").mockResolvedValue({});
  });

  it("getProductsList entry delegates to list handler", async () => {
    const res = await listHandler({
      httpMethod: "GET",
      path: "/products",
    } as APIGatewayProxyEvent);
    expect(res.statusCode).toBe(200);
  });

  it("getProductsById entry delegates to by-id handler", async () => {
    const res = await byIdHandler({
      httpMethod: "GET",
      path: "/products/x",
      pathParameters: { productId: "00000000-0000-0000-0000-000000000000" },
    } as unknown as APIGatewayProxyEvent);
    expect(res.statusCode).toBe(404);
  });

  it("createProduct entry delegates to create handler", async () => {
    const res = await createHandler({
      httpMethod: "POST",
      path: "/products",
      body: JSON.stringify({ title: "Entry", price: 1 }),
    } as APIGatewayProxyEvent);
    expect(res.statusCode).toBe(201);
  });

  it("catalogBatchProcess handles SQS events", async () => {
    await expect(
      batchHandler({
        Records: [
          {
            messageId: "1",
            body: JSON.stringify({ title: "Entry", price: 1 }),
          },
        ],
      } as never),
    ).resolves.toBeUndefined();
  });
});
