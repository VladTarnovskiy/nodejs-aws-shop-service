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

export const ALLOWED_RECIPIENTS = new Set(["product", "products", "cart"]);

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
  const base = recipientUrl.replace(/\/$/, "");
  return `${base}${remainingPath}${search}`;
}

export function pickHeaders(
  headers: Record<string, string | string[] | undefined>,
  options?: { omitHopByHop?: boolean },
): Record<string, string | string[]> {
  const picked: Record<string, string | string[]> = {};

  for (const [name, value] of Object.entries(headers)) {
    if (value === undefined) {
      continue;
    }

    if (options?.omitHopByHop && HOP_BY_HOP_HEADERS.has(name.toLowerCase())) {
      continue;
    }

    picked[name] = value;
  }

  return picked;
}

export function readBody(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}
