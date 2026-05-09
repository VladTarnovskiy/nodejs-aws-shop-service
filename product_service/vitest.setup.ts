import { beforeEach, vi } from "vitest";

vi.mock("./src/db/productRead", () => ({
  listProductsJoined: vi.fn(),
  findProductJoinedById: vi.fn(),
}));

vi.mock("./src/db/productWrite", () => ({
  createProductAndStockTxn: vi.fn(),
}));

beforeEach(async () => {
  const { products: mockProducts } = await import("./src/mock/products");
  const reads = await import("./src/db/productRead");
  const writes = await import("./src/db/productWrite");

  vi.mocked(reads.listProductsJoined).mockClear();
  vi.mocked(reads.findProductJoinedById).mockClear();
  vi.mocked(writes.createProductAndStockTxn).mockClear();

  vi.mocked(reads.listProductsJoined).mockResolvedValue(mockProducts);

  vi.mocked(reads.findProductJoinedById).mockImplementation(async (id) =>
    mockProducts.find((p) => p.id === id) ?? null
  );

  vi.mocked(writes.createProductAndStockTxn).mockImplementation(
    async (input) => ({
      id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      title: input.title,
      description: input.description ?? "",
      price: input.price,
      count: input.count ?? 0,
    })
  );
});
