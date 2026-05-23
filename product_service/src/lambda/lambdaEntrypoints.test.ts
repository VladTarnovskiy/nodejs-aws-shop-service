import type { APIGatewayProxyEvent } from "aws-lambda";
import { describe, expect, it } from "vitest";
import { handler as byIdHandler } from "./getProductsById";
import { handler as listHandler } from "./getProductsList";

describe("lambda entry re-exports", () => {
  it("getProductsList entry delegates to list handler", async () => {
    const res = await listHandler({} as APIGatewayProxyEvent);
    expect(res.statusCode).toBe(200);
  });

  it("getProductsById entry delegates to by-id handler", async () => {
    const res = await byIdHandler({
      pathParameters: { productId: "00000000-0000-0000-0000-000000000000" },
    } as APIGatewayProxyEvent);
    expect(res.statusCode).toBe(404);
  });
});
