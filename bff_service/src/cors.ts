import { ServerResponse } from "http";

export const ALLOWED_RECIPIENTS = new Set(["product", "products", "cart"]);

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};

export function withCorsHeaders(
  headers: Record<string, string | string[] | undefined> = {},
): Record<string, string | string[]> {
  const normalized: Record<string, string | string[]> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (value !== undefined) {
      normalized[key] = value;
    }
  }

  return {
    ...normalized,
    ...CORS_HEADERS,
  };
}

export function sendOptionsResponse(res: ServerResponse): void {
  res.writeHead(204, CORS_HEADERS);
  res.end();
}
