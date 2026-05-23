import type { Product } from "../mock/products";
import { products as mockProducts } from "../mock/products";

export function listProducts(): Product[] {
  return mockProducts;
}

export function findProductById(productId: string): Product | undefined {
  return mockProducts.find((p) => p.id === productId);
}
