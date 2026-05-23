import type { APIGatewayProxyEvent } from "aws-lambda";
import { describe, expect, it } from "vitest";
import { handler } from "../../src/lambda/getProductsById";
import { products as mockProducts } from "../../src/mock/products";

function eventWithProductId(
  productId: string | undefined,
): APIGatewayProxyEvent {
  return {
    httpMethod: "GET",
    path: `/products/${productId ?? ""}`,
    pathParameters: productId !== undefined ? { productId } : undefined,
  } as unknown as APIGatewayProxyEvent;
}

describe("getProductById handler", () => {
  it("returns 400 when productId is missing", async () => {
    const res = await handler(eventWithProductId(undefined));

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body)).toEqual({ message: "Missing productId" });
  });

  it("returns 404 when product is not found", async () => {
    const res = await handler(
      eventWithProductId("00000000-0000-0000-0000-000000000000"),
    );

    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body)).toEqual({ message: "Product not found" });
  });

  it("returns 200 and product when id exists", async () => {
    const product = mockProducts[0];
    const res = await handler(eventWithProductId(product.id));

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual(product);
  });
});
