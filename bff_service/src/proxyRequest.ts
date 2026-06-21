import http from "http";
import https from "https";
import { IncomingMessage, ServerResponse } from "http";
import { ALLOWED_RECIPIENTS, withCorsHeaders } from "./cors";
import {
  buildTargetUrl,
  filterRequestHeaders,
  getRecipientUrl,
  parseRequestPath,
  readRequestBody,
} from "./proxyUtils";

const CANNOT_PROCESS_MESSAGE = "Cannot process request";

function sendCannotProcess(res: ServerResponse): void {
  res.writeHead(
    502,
    withCorsHeaders({ "Content-Type": "text/plain; charset=utf-8" }),
  );
  res.end(CANNOT_PROCESS_MESSAGE);
}

function requestUpstream(
  targetUrl: string,
  method: string,
  headers: Record<string, string | string[]>,
  body: Buffer,
): Promise<IncomingMessage> {
  return new Promise((resolve, reject) => {
    const url = new URL(targetUrl);
    const client = url.protocol === "https:" ? https : http;

    const req = client.request(
      url,
      {
        method,
        headers: {
          ...headers,
          ...(body.length > 0 ? { "content-length": String(body.length) } : {}),
        },
      },
      (res) => resolve(res),
    );

    req.on("error", reject);
    req.end(body.length > 0 ? body : undefined);
  });
}

function pipeUpstreamResponse(
  upstream: IncomingMessage,
  res: ServerResponse,
): void {
  res.writeHead(
    upstream.statusCode ?? 502,
    withCorsHeaders(upstream.headers),
  );
  upstream.pipe(res);
}

export async function proxyRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const requestUrl = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const { recipientName, remainingPath } = parseRequestPath(requestUrl.pathname);
  const recipientUrl = getRecipientUrl(recipientName);

  if (
    !recipientName ||
    !ALLOWED_RECIPIENTS.has(recipientName) ||
    !recipientUrl
  ) {
    sendCannotProcess(res);
    return;
  }

  const targetUrl = buildTargetUrl(
    recipientUrl,
    remainingPath,
    requestUrl.search,
  );
  const body = await readRequestBody(req);
  const headers = filterRequestHeaders(req.headers);

  try {
    const upstream = await requestUpstream(
      targetUrl,
      req.method ?? "GET",
      headers,
      body,
    );

    pipeUpstreamResponse(upstream, res);
  } catch (error) {
    console.error(`Failed to proxy request to ${targetUrl}`, error);
    sendCannotProcess(res);
  }
}
