import http from "http";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  clearProductsListCache,
  getCachedProductsList,
  isProductsListRequest,
  setCachedProductsList,
} from "../src/productsListCache";
import { proxyRequest } from "../src/proxyRequest";

describe("isProductsListRequest", () => {
  it("matches GET /products list requests", () => {
    expect(isProductsListRequest("GET", "products", "")).toBe(true);
    expect(isProductsListRequest("GET", "product", "")).toBe(true);
  });

  it("does not match product-by-id or mutating requests", () => {
    expect(isProductsListRequest("GET", "products", "/123")).toBe(false);
    expect(isProductsListRequest("POST", "products", "")).toBe(false);
    expect(isProductsListRequest("GET", "cart", "")).toBe(false);
  });
});

describe("products list cache store", () => {
  afterEach(() => {
    clearProductsListCache();
    vi.useRealTimers();
  });

  it("returns cached entry before TTL expires", () => {
    setCachedProductsList(
      "http://example.com/products",
      {
        statusCode: 200,
        headers: { "content-type": "application/json" },
        body: Buffer.from("[]"),
      },
      60_000,
    );

    expect(getCachedProductsList("http://example.com/products")).toBeDefined();
  });

  it("drops expired cache entries", () => {
    vi.useFakeTimers();

    setCachedProductsList(
      "http://example.com/products",
      {
        statusCode: 200,
        headers: { "content-type": "application/json" },
        body: Buffer.from("[]"),
      },
      1_000,
    );

    vi.advanceTimersByTime(1_001);

    expect(getCachedProductsList("http://example.com/products")).toBeUndefined();
  });
});

describe("products list cache in proxy", () => {
  let upstreamServer: http.Server;
  let upstreamPort: number;
  let bffServer: http.Server;
  let bffPort: number;
  let upstreamCalls: number;

  beforeAll(async () => {
    upstreamCalls = 0;

    upstreamServer = http.createServer((_req, res) => {
      upstreamCalls += 1;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify([{ id: "1", title: "Cached product" }]));
    });

    await new Promise<void>((resolve) => {
      upstreamServer.listen(0, "127.0.0.1", () => resolve());
    });

    upstreamPort = (upstreamServer.address() as { port: number }).port;
    process.env.products = `http://127.0.0.1:${upstreamPort}/items`;

    bffServer = http.createServer((req, res) => {
      void proxyRequest(req, res);
    });

    await new Promise<void>((resolve) => {
      bffServer.listen(0, "127.0.0.1", () => resolve());
    });

    bffPort = (bffServer.address() as { port: number }).port;
  });

  afterEach(() => {
    clearProductsListCache();
    upstreamCalls = 0;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => bffServer.close(() => resolve()));
    await new Promise<void>((resolve) => upstreamServer.close(() => resolve()));
    delete process.env.products;
  });

  it("caches GET /products list for 2 minutes", async () => {
    const url = `http://127.0.0.1:${bffPort}/products`;

    await fetch(url);
    await fetch(url);

    expect(upstreamCalls).toBe(1);
  });

  it("refetches products list after cache expires", async () => {
    vi.useFakeTimers();

    const url = `http://127.0.0.1:${bffPort}/products`;

    await fetch(url);
    vi.advanceTimersByTime(2 * 60 * 1000 + 1);
    await fetch(url);

    expect(upstreamCalls).toBe(2);
  });

  it("does not cache GET /products/{id}", async () => {
    const url = `http://127.0.0.1:${bffPort}/products/123`;

    await fetch(url);
    await fetch(url);

    expect(upstreamCalls).toBe(2);
  });
});
