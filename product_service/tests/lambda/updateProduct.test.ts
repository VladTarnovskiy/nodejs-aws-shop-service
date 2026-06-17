import type { APIGatewayProxyEvent } from "aws-lambda";
import { describe, expect, it } from "vitest";
import * as productRead from "../../src/db/productRead";
import * as productWrite from "../../src/db/productWrite";
import { handler } from "../../src/lambda/updateProduct";
import { products as mockProducts } from "../../src/mock/products";

function eventWithBody(
  productId: string | undefined,
  body: string | undefined,
): APIGatewayProxyEvent {
  return {
    httpMethod: "PUT",
    path: `/products/${productId ?? ""}`,
    pathParameters: productId !== undefined ? { productId } : undefined,
    body,
  } as unknown as APIGatewayProxyEvent;
}

describe("updateProduct handler", () => {
  it("returns 400 when productId is missing", async () => {
    const res = await handler(
      eventWithBody(undefined, JSON.stringify({ title: "X", price: 1 })),
    );

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body)).toEqual({ message: "Missing productId" });
    expect(productWrite.updateProductAndStockTxn).not.toHaveBeenCalled();
  });

  it("returns 400 when body is missing", async () => {
    const res = await handler(eventWithBody(mockProducts[0].id, undefined));

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body)).toEqual({
      message: "Request body is required",
    });
    expect(productWrite.updateProductAndStockTxn).not.toHaveBeenCalled();
  });

  it("returns 404 when product is not found", async () => {
    const res = await handler(
      eventWithBody(
        "00000000-0000-0000-0000-000000000000",
        JSON.stringify({ title: "X", price: 1 }),
      ),
    );

    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body)).toEqual({ message: "Product not found" });
    expect(productRead.findProductJoinedById).toHaveBeenCalled();
    expect(productWrite.updateProductAndStockTxn).not.toHaveBeenCalled();
  });

  it("returns 200 and updated product on success", async () => {
    const product = mockProducts[0];
    const res = await handler(
      eventWithBody(
        product.id,
        JSON.stringify({
          title: "Updated",
          description: "New desc",
          price: 99,
          count: 7,
        }),
      ),
    );

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({
      id: product.id,
      title: "Updated",
      description: "New desc",
      price: 99,
      count: 7,
    });
    expect(productWrite.updateProductAndStockTxn).toHaveBeenCalledWith(
      product.id,
      {
        title: "Updated",
        description: "New desc",
        price: 99,
        count: 7,
      },
    );
  });
});
