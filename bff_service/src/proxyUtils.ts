const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
]);

export function parseRequestPath(pathname: string): {
  recipientName: string;
  remainingPath: string;
} {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return { recipientName: "", remainingPath: "" };
  }

  const [recipientName, ...rest] = segments;

  return {
    recipientName,
    remainingPath: rest.length > 0 ? `/${rest.join("/")}` : "",
  };
}

export function buildTargetUrl(
  recipientUrl: string,
  remainingPath: string,
  search: string,
): string {
  const base = recipientUrl.endsWith("/")
    ? recipientUrl.slice(0, -1)
    : recipientUrl;
  const pathSuffix = remainingPath || "";
  const query = search.startsWith("?") ? search : search ? `?${search}` : "";

  return `${base}${pathSuffix}${query}`;
}

export function getRecipientUrl(recipientName: string): string | undefined {
  const value = process.env[recipientName];

  if (!value) {
    return undefined;
  }

  return value;
}

export function filterRequestHeaders(
  headers: Record<string, string | string[] | undefined>,
): Record<string, string | string[]> {
  const filtered: Record<string, string | string[]> = {};

  for (const [name, value] of Object.entries(headers)) {
    if (value === undefined || HOP_BY_HOP_HEADERS.has(name.toLowerCase())) {
      continue;
    }

    filtered[name] = value;
  }

  return filtered;
}

export function readRequestBody(
  req: NodeJS.ReadableStream,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
