import { handlers } from "@/auth";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limiter";
import { NextRequest } from "next/server";

export const { GET } = handlers;

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);
  const rlKey = `auth-login:${clientIp}`;
  const rlResult = checkRateLimit(rlKey, { limit: 10, windowMs: 60 * 1000 });
  if (!rlResult.success) {
    return rateLimitResponse(rlResult);
  }
  return handlers.POST(req);
}
