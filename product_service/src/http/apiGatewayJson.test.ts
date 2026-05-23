import { describe, expect, it } from "vitest";
import { corsJsonHeaders, jsonResponse } from "./apiGatewayJson";

describe("apiGatewayJson", () => {
  it("jsonResponse sets status, CORS headers, and stringified body", () => {
    const res = jsonResponse(404, { message: "Product not found" });

    expect(res.statusCode).toBe(404);
    expect(res.headers).toEqual(corsJsonHeaders);
    expect(JSON.parse(res.body)).toEqual({ message: "Product not found" });
  });
});
