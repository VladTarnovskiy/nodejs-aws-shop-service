import type { APIGatewayProxyEvent } from "aws-lambda";
import { describe, expect, it } from "vitest";
import { products as mockProducts } from "../mock/products";
import { handler } from "./getProductsList";

describe("getProductsList handler", () => {
  it("returns 200 and JSON array of products", async () => {
    const event = {
      httpMethod: "GET",
      path: "/products",
    } as APIGatewayProxyEvent;
    const res = await handler(event);

    expect(res.statusCode).toBe(200);
    expect(res.headers?.["Content-Type"]).toBe("application/json");
    const body = JSON.parse(res.body);
    expect(body).toEqual(mockProducts);
  });
});
