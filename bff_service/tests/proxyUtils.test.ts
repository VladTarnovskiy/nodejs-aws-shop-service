import { describe, expect, it } from "vitest";
import {
  buildTargetUrl,
  parseRequestPath,
  pickHeaders,
} from "../src/proxyUtils";

describe("parseRequestPath", () => {
  it("extracts recipient name and remaining path", () => {
    expect(parseRequestPath("/product/123")).toEqual({
      recipientName: "product",
      remainingPath: "/123",
    });
  });

  it("returns empty remaining path when only recipient is present", () => {
    expect(parseRequestPath("/cart")).toEqual({
      recipientName: "cart",
      remainingPath: "",
    });
  });
});

describe("buildTargetUrl", () => {
  it("appends remaining path and query string to recipient URL", () => {
    expect(
      buildTargetUrl(
        "https://example.com/prod/products/",
        "/abc",
        "?limit=10",
      ),
    ).toBe("https://example.com/prod/products/abc?limit=10");
  });

  it("forwards query string without remaining path", () => {
    expect(
      buildTargetUrl("https://example.com/prod/products", "", "?var1=value"),
    ).toBe("https://example.com/prod/products?var1=value");
  });
});

describe("pickHeaders", () => {
  it("removes undefined values", () => {
    expect(
      pickHeaders({
        "content-type": "application/json",
        "x-missing": undefined,
      }),
    ).toEqual({
      "content-type": "application/json",
    });
  });

  it("removes hop-by-hop headers for upstream requests", () => {
    expect(
      pickHeaders(
        {
          authorization: "Basic token",
          host: "localhost:3000",
          connection: "keep-alive",
        },
        { omitHopByHop: true },
      ),
    ).toEqual({
      authorization: "Basic token",
    });
  });
});
