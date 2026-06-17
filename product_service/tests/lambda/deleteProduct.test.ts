import type { APIGatewayProxyEvent } from "aws-lambda";
import { describe, expect, it } from "vitest";
import * as productWrite from "../../src/db/productWrite";
import { handler } from "../../src/lambda/deleteProduct";
import { products as mockProducts } from "../../src/mock/products";

function eventWithProductId(
  productId: string | undefined,
): APIGatewayProxyEvent {
  return {
    httpMethod: "DELETE",
    path: `/products/${productId ?? ""}`,
    pathParameters: productId !== undefined ? { productId } : undefined,
  } as unknown as APIGatewayProxyEvent;
}

describe("deleteProduct handler", () => {
  it("returns 400 when productId is missing", async () => {
    const res = await handler(eventWithProductId(undefined));

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body)).toEqual({ message: "Missing productId" });
    expect(productWrite.deleteProductAndStockTxn).not.toHaveBeenCalled();
  });

  it("returns 404 when product is not found", async () => {
    const res = await handler(
      eventWithProductId("00000000-0000-0000-0000-000000000000"),
    );

    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body)).toEqual({ message: "Product not found" });
    expect(productWrite.deleteProductAndStockTxn).not.toHaveBeenCalled();
  });

  it("returns 200 and deleted product on success", async () => {
    const product = mockProducts[0];
    const res = await handler(eventWithProductId(product.id));

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual(product);
    expect(productWrite.deleteProductAndStockTxn).toHaveBeenCalledWith(
      product.id,
    );
  });
});
