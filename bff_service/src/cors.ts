import { ServerResponse } from "http";
import { pickHeaders } from "./proxyUtils";

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};

export function withCorsHeaders(
  headers: Record<string, string | string[] | undefined> = {},
): Record<string, string | string[]> {
  return {
    ...pickHeaders(headers),
    ...CORS_HEADERS,
  };
}

export function sendOptionsResponse(res: ServerResponse): void {
  res.writeHead(204, CORS_HEADERS);
  res.end();
}
