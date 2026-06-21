import { describe, expect, it } from "vitest";
import {
  buildTargetUrl,
  getRecipientUrl,
  parseRequestPath,
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
        "https://example.com/prod/products",
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

describe("getRecipientUrl", () => {
  it("reads recipient URL from environment", () => {
    process.env.product = "https://example.com/products";

    expect(getRecipientUrl("product")).toBe("https://example.com/products");

    delete process.env.product;
  });

  it("returns undefined when mapping is missing", () => {
    delete process.env.unknown;

    expect(getRecipientUrl("unknown")).toBeUndefined();
  });
});
