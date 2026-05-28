import handleVercelRequest from "../../backend/src/vercel-handler.js";

export default function handler(req: unknown, res: unknown) {
  return handleVercelRequest(req as never, res as never);
}
