import { describe, expect, it } from "vitest";
import { buildProductCreatedMessageAttributes } from "../../src/sns/productCreatedMessageAttributes";

describe("buildProductCreatedMessageAttributes", () => {
  it("maps product fields to SNS filterable message attributes", () => {
    expect(
      buildProductCreatedMessageAttributes({
        id: "id-1",
        title: "Book A",
        description: "Desc",
        price: 99,
        count: 3,
      }),
    ).toEqual({
      price: { DataType: "Number", StringValue: "99" },
      count: { DataType: "Number", StringValue: "3" },
      title: { DataType: "String", StringValue: "Book A" },
    });
  });
});
