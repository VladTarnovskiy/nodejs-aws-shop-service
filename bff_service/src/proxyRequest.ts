import http from "http";
import https from "https";
import { IncomingMessage, ServerResponse } from "http";
import { withCorsHeaders } from "./cors";
import {
  getCachedProductsList,
  isProductsListRequest,
  setCachedProductsList,
} from "./productsListCache";
import {
  ALLOWED_RECIPIENTS,
  buildTargetUrl,
  parseRequestPath,
  pickHeaders,
  readBody,
} from "./proxyUtils";

const CANNOT_PROCESS_MESSAGE = "Cannot process request";

function sendResponse(
  res: ServerResponse,
  statusCode: number,
  headers: Record<string, string | string[] | undefined>,
  body: Buffer | string,
): void {
  res.writeHead(statusCode, withCorsHeaders(headers));
  res.end(body);
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
      resolve,
    );

    req.on("error", reject);
    req.end(body.length > 0 ? body : undefined);
  });
}

export async function proxyRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const requestUrl = new URL(
    req.url ?? "/",
    `http://${req.headers.host ?? "localhost"}`,
  );
  const { recipientName, remainingPath } = parseRequestPath(
    requestUrl.pathname,
  );
  const recipientUrl = process.env[recipientName];
  const method = req.method ?? "GET";

  if (
    !recipientName ||
    !ALLOWED_RECIPIENTS.has(recipientName) ||
    !recipientUrl
  ) {
    sendResponse(res, 502, { "Content-Type": "text/plain; charset=utf-8" }, CANNOT_PROCESS_MESSAGE);
    return;
  }

  const targetUrl = buildTargetUrl(
    recipientUrl,
    remainingPath,
    requestUrl.search,
  );
  const cacheProductsList = isProductsListRequest(
    method,
    recipientName,
    remainingPath,
  );

  if (cacheProductsList) {
    const cached = getCachedProductsList(targetUrl);

    if (cached) {
      sendResponse(res, cached.statusCode, cached.headers, cached.body);
      return;
    }
  }

  const body = await readBody(req);
  const headers = pickHeaders(req.headers, { omitHopByHop: true });

  try {
    const upstream = await requestUpstream(targetUrl, method, headers, body);
    const responseBody = await readBody(upstream);
    const responseHeaders = pickHeaders(upstream.headers);
    const statusCode = upstream.statusCode ?? 502;

    if (cacheProductsList && statusCode === 200) {
      setCachedProductsList(targetUrl, {
        statusCode,
        headers: responseHeaders,
        body: responseBody,
      });
    }

    sendResponse(res, statusCode, responseHeaders, responseBody);
  } catch (error) {
    console.error(`Failed to proxy request to ${targetUrl}`, error);
    sendResponse(res, 502, { "Content-Type": "text/plain; charset=utf-8" }, CANNOT_PROCESS_MESSAGE);
  }
}
