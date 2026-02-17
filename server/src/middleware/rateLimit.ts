import rateLimit from "express-rate-limit";
import { Request } from "express";
import jwt from "jsonwebtoken";
import { getSecret } from "./auth";

const RATE_LIMIT_WHITELIST_EMAIL = "michaelhalperin2@gmail.com";

function isWhitelistedEmail(req: Request): boolean {
  const email = req.body?.email;
  if (email && String(email).toLowerCase().trim() === RATE_LIMIT_WHITELIST_EMAIL) {
    return true;
  }
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const decoded = jwt.verify(authHeader.slice(7), getSecret()) as { email?: string };
      if (decoded.email?.toLowerCase() === RATE_LIMIT_WHITELIST_EMAIL) {
        return true;
      }
    } catch {
      // ignore invalid/expired token
    }
  }
  return false;
}

/**
 * Rate limit for auth routes: 10 requests per 15 minutes per IP.
 * Whitelisted user (michaelhalperin2@gmail.com) is exempt.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isWhitelistedEmail(req),
});
