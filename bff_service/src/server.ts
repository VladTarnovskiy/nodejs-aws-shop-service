import "dotenv/config";
import http from "http";
import { CORS_HEADERS, sendOptionsResponse } from "./cors";
import { proxyRequest } from "./proxyRequest";

const PORT = Number(process.env.PORT) || 3000;

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    sendOptionsResponse(res);
    return;
  }

  proxyRequest(req, res).catch((error) => {
    console.error("Unhandled proxy error", error);

    if (!res.headersSent) {
      res.writeHead(500, {
        "Content-Type": "text/plain; charset=utf-8",
        ...CORS_HEADERS,
      });
      res.end("Internal Server Error");
    }
  });
});

server.listen(PORT, () => {
  console.log(`BFF service is listening on port ${PORT}`);
});
