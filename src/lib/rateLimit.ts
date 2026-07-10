import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getRateLimitConfig } from "@/lib/appMode";

export type RateLimitKind = "anon" | "signedIn" | "ai";

type LimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

function hasUpstashEnv(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

function createLimiter(requests: number, prefix: string): Ratelimit | null {
  if (!hasUpstashEnv()) return null;

  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(requests, "1 h"),
    analytics: true,
    prefix: `pokeart:rl:${prefix}`,
  });
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function enforceRateLimit(
  kind: RateLimitKind,
  identifier: string
): Promise<LimitResult> {
  const config = getRateLimitConfig();
  const requests =
    kind === "ai"
      ? config.aiSearchesPerHour
      : kind === "signedIn"
        ? config.signedInSearchesPerHour
        : config.anonSearchesPerHour;

  // Local / missing Upstash: allow through (still enforce auth gates elsewhere)
  const limiter = createLimiter(requests, kind);
  if (!limiter) {
    return {
      success: true,
      limit: requests,
      remaining: requests,
      reset: Date.now() + 60 * 60 * 1000,
    };
  }

  const result = await limiter.limit(`${kind}:${identifier}`);
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

export function rateLimitHeaders(result: LimitResult): HeadersInit {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.reset),
  };
}
