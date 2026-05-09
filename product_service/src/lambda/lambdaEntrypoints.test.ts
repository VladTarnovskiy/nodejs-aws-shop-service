import type { APIGatewayProxyEvent } from "aws-lambda";
import { describe, expect, it } from "vitest";
import { handler as createHandler } from "./createProduct";
import { handler as byIdHandler } from "./getProductsById";
import { handler as listHandler } from "./getProductsList";

describe("lambda entry re-exports", () => {
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
});
