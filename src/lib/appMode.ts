export type AppMode = "production" | "debug";

function normalizeMode(value: string | undefined): AppMode {
  return value === "debug" ? "debug" : "production";
}

/** Client + server: which deployment flavor this build is. */
export function getAppMode(): AppMode {
  return normalizeMode(process.env.NEXT_PUBLIC_APP_MODE);
}

export function isDebugMode(): boolean {
  return getAppMode() === "debug";
}

export function isProductionMode(): boolean {
  return getAppMode() === "production";
}

function readPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Server-only rate limit knobs (for upcoming Upstash / auth work).
 * Set differently per Vercel project.
 */
export function getRateLimitConfig() {
  const debug = isDebugMode();

  return {
    anonSearchesPerHour: readPositiveInt(
      process.env.RATE_LIMIT_ANON_PER_HOUR,
      debug ? 120 : 30
    ),
    signedInSearchesPerHour: readPositiveInt(
      process.env.RATE_LIMIT_SIGNED_IN_PER_HOUR,
      debug ? 300 : 60
    ),
    aiSearchesPerHour: readPositiveInt(
      process.env.RATE_LIMIT_AI_PER_HOUR,
      debug ? 100 : 20
    ),
  };
}
