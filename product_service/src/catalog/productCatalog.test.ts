import { describe, expect, it } from "vitest";
import { findProductById, listProducts } from "./productCatalog";

describe("productCatalog", () => {
  it("listProducts returns non-empty array", () => {
    const list = listProducts();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
  });

  it("findProductById returns product for known id", () => {
    const id = listProducts()[0].id;
    expect(findProductById(id)?.id).toBe(id);
  });

  it("findProductById returns undefined for unknown id", () => {
    expect(findProductById("00000000-0000-0000-0000-000000000000")).toBeUndefined();
  });
});
