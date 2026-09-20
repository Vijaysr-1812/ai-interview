/**
 * In-memory sliding window rate limiter.
 * Compatible with Vercel serverless/edge environments.
 *
 * Note: In-memory state is per-instance and resets on cold starts.
 * For multi-instance production, upgrade to Redis (e.g., Vercel KV).
 */

interface RateLimitEntry {
    timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;

    lastCleanup = now;
    const cutoff = now - windowMs;

    for (const [key, entry] of rateLimitStore.entries()) {
        entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
        if (entry.timestamps.length === 0) {
            rateLimitStore.delete(key);
        }
    }
}

export interface RateLimitConfig {
    /** Maximum number of requests allowed in the window */
    maxRequests: number;
    /** Time window in milliseconds */
    windowMs: number;
}

export interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetMs: number;
}

/**
 * Check if a request is within rate limits.
 *
 * @param identifier - Unique key (e.g., userId, IP address)
 * @param config - Rate limit configuration
 * @returns Result indicating if the request is allowed
 */
export function rateLimit(
    identifier: string,
    config: RateLimitConfig
): RateLimitResult {
    const now = Date.now();
    const { maxRequests, windowMs } = config;

    cleanup(windowMs);

    const entry = rateLimitStore.get(identifier) || { timestamps: [] };

    // Remove timestamps outside the window
    entry.timestamps = entry.timestamps.filter((t) => t > now - windowMs);

    if (entry.timestamps.length >= maxRequests) {
        const oldestInWindow = entry.timestamps[0];
        const resetMs = oldestInWindow + windowMs - now;

        return {
            success: false,
            remaining: 0,
            resetMs,
        };
    }

    entry.timestamps.push(now);
    rateLimitStore.set(identifier, entry);

    return {
        success: true,
        remaining: maxRequests - entry.timestamps.length,
        resetMs: windowMs,
    };
}

// Pre-configured rate limit configs
export const RATE_LIMITS = {
    /** Interview generation: 10 per user per hour */
    interviewGeneration: {
        maxRequests: 10,
        windowMs: 60 * 60 * 1000,
    } as RateLimitConfig,

    /** Chat messages: 120 per user per hour */
    chatMessages: {
        maxRequests: 120,
        windowMs: 60 * 60 * 1000,
    } as RateLimitConfig,

    /** Auth attempts: 5 per IP per 15 minutes */
    authAttempts: {
        maxRequests: 5,
        windowMs: 15 * 60 * 1000,
    } as RateLimitConfig,
};
