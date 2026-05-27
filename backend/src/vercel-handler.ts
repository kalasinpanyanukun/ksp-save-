import type { IncomingMessage, ServerResponse } from "node:http";
import { createApp } from "./app.js";

const app = createApp();

function normalizeApiUrl(url: string | undefined): string {
  if (!url || url === "/") return "/api";
  if (url === "/api" || url.startsWith("/api/") || url.startsWith("/api?")) {
    return url;
  }
  return `/api${url.startsWith("/") ? "" : "/"}${url}`;
}

export default function handleVercelRequest(
  req: IncomingMessage,
  res: ServerResponse,
) {
  req.url = normalizeApiUrl(req.url);
  return app(req, res);
}
