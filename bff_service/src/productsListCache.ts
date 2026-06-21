export const PRODUCTS_LIST_CACHE_TTL_MS = 2 * 60 * 1000;

export interface ProductsListCacheEntry {
  statusCode: number;
  headers: Record<string, string | string[]>;
  body: Buffer;
  expiresAt: number;
}

const cache = new Map<string, ProductsListCacheEntry>();

export function isProductsListRequest(
  method: string | undefined,
  recipientName: string,
  remainingPath: string,
): boolean {
  return (
    (method ?? "GET") === "GET" &&
    (recipientName === "product" || recipientName === "products") &&
    remainingPath === ""
  );
}

export function getCachedProductsList(
  cacheKey: string,
): ProductsListCacheEntry | undefined {
  const entry = cache.get(cacheKey);

  if (!entry) {
    return undefined;
  }

  if (Date.now() >= entry.expiresAt) {
    cache.delete(cacheKey);
    return undefined;
  }

  return entry;
}

export function setCachedProductsList(
  cacheKey: string,
  entry: Omit<ProductsListCacheEntry, "expiresAt">,
  ttlMs: number = PRODUCTS_LIST_CACHE_TTL_MS,
): void {
  cache.set(cacheKey, {
    ...entry,
    expiresAt: Date.now() + ttlMs,
  });
}

export function clearProductsListCache(): void {
  cache.clear();
}
