import http from "http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { proxyRequest } from "../src/proxyRequest";

describe("proxyRequest", () => {
  let upstreamServer: http.Server;
  let upstreamPort: number;
  let bffServer: http.Server;
  let bffPort: number;

  beforeAll(async () => {
    process.env.product = "";

    upstreamServer = http.createServer((req, res) => {
      if (req.url === "/items?var1=someValue") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, method: req.method }));
        return;
      }

      if (req.url === "/items/missing") {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Not found" }));
        return;
      }

      res.writeHead(500);
      res.end("Unexpected upstream request");
    });

    await new Promise<void>((resolve) => {
      upstreamServer.listen(0, "127.0.0.1", () => resolve());
    });

    upstreamPort = (upstreamServer.address() as { port: number }).port;
    process.env.product = `http://127.0.0.1:${upstreamPort}/items`;

    bffServer = http.createServer((req, res) => {
      void proxyRequest(req, res);
    });

    await new Promise<void>((resolve) => {
      bffServer.listen(0, "127.0.0.1", () => resolve());
    });

    bffPort = (bffServer.address() as { port: number }).port;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => bffServer.close(() => resolve()));
    await new Promise<void>((resolve) => upstreamServer.close(() => resolve()));
    delete process.env.product;
  });

  it("returns 502 when recipient mapping is missing", async () => {
    const response = await fetch(`http://127.0.0.1:${bffPort}/unknown-service`);

    expect(response.status).toBe(502);
    expect(await response.text()).toBe("Cannot process request");
  });

  it("proxies request to recipient and returns upstream response", async () => {
    const response = await fetch(
      `http://127.0.0.1:${bffPort}/product?var1=someValue`,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      method: "GET",
    });
  });

  it("forwards upstream error status and body", async () => {
    const response = await fetch(`http://127.0.0.1:${bffPort}/product/missing`);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ message: "Not found" });
  });
});
