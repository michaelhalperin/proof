import * as SecureStore from 'expo-secure-store';
import { logWarn, logError } from './logger';

/**
 * Rate limiter utility to prevent abuse
 * Stores attempts in SecureStore with expiry
 */

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  lockedUntil?: number;
}

const RATE_LIMIT_CONFIG = {
  // Login/Password Reset limits
  AUTH: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    lockoutDurationMs: 30 * 60 * 1000, // 30 minutes lockout after max attempts
  },
  // PIN verification limits
  PIN_VERIFICATION: {
    maxAttempts: 3,
    windowMs: 10 * 60 * 1000, // 10 minutes
    lockoutDurationMs: 15 * 60 * 1000, // 15 minutes lockout
  },
  // Email sending limits
  EMAIL: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    lockoutDurationMs: 60 * 60 * 1000, // 1 hour lockout
  },
};

const STORE_PREFIX = 'rate_limit_';

/**
 * Email addresses that are exempt from rate limiting
 */
const RATE_LIMIT_WHITELIST = [
  'michaelhalperin2@gmail.com',
];

/**
 * Encode a key to be safe for SecureStore
 * Replaces special characters with URL-safe equivalents
 */
function encodeKey(identifier: string): string {
  // Replace special characters that might cause issues in SecureStore keys
  // Use a simple base64-like encoding but with URL-safe characters
  return identifier
    .replace(/@/g, '_at_')
    .replace(/\./g, '_dot_')
    .replace(/\+/g, '_plus_')
    .replace(/\//g, '_slash_')
    .replace(/=/g, '_equals_')
    .replace(/[^a-zA-Z0-9_-]/g, '_');
}

async function getRateLimitEntry(key: string): Promise<RateLimitEntry | null> {
  try {
    const safeKey = encodeKey(key);
    const stored = await SecureStore.getItemAsync(`${STORE_PREFIX}${safeKey}`);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    logError('Failed to get rate limit entry', { key }, error as Error);
    return null;
  }
}

async function setRateLimitEntry(key: string, entry: RateLimitEntry): Promise<void> {
  try {
    const safeKey = encodeKey(key);
    await SecureStore.setItemAsync(
      `${STORE_PREFIX}${safeKey}`,
      JSON.stringify(entry)
    );
  } catch (error) {
    logError('Failed to set rate limit entry', { key }, error as Error);
  }
}

async function clearRateLimitEntry(key: string): Promise<void> {
  try {
    const safeKey = encodeKey(key);
    await SecureStore.deleteItemAsync(`${STORE_PREFIX}${safeKey}`);
  } catch (error) {
    logError('Failed to clear rate limit entry', { key }, error as Error);
  }
}

export async function checkRateLimit(
  identifier: string,
  type: keyof typeof RATE_LIMIT_CONFIG = 'AUTH'
): Promise<{ allowed: boolean; remainingAttempts: number; lockedUntil?: number }> {
  // Check if identifier is whitelisted (case-insensitive)
  const normalizedIdentifier = identifier.toLowerCase().trim();
  if (RATE_LIMIT_WHITELIST.includes(normalizedIdentifier)) {
    // Always allow whitelisted emails
    return {
      allowed: true,
      remainingAttempts: 999, // High number to indicate unlimited
    };
  }

  const config = RATE_LIMIT_CONFIG[type];
  const key = `${type}_${identifier}`;
  const now = Date.now();

  const entry = await getRateLimitEntry(key);

  // No previous attempts
  if (!entry) {
    await setRateLimitEntry(key, {
      attempts: 1,
      firstAttempt: now,
    });
    return {
      allowed: true,
      remainingAttempts: config.maxAttempts - 1,
    };
  }

  // Check if locked out
  if (entry.lockedUntil && now < entry.lockedUntil) {
    return {
      allowed: false,
      remainingAttempts: 0,
      lockedUntil: entry.lockedUntil,
    };
  }

  // Reset if lockout expired
  if (entry.lockedUntil && now >= entry.lockedUntil) {
    await setRateLimitEntry(key, {
      attempts: 1,
      firstAttempt: now,
    });
    return {
      allowed: true,
      remainingAttempts: config.maxAttempts - 1,
    };
  }

  // Check if window has expired
  if (now - entry.firstAttempt > config.windowMs) {
    await setRateLimitEntry(key, {
      attempts: 1,
      firstAttempt: now,
    });
    return {
      allowed: true,
      remainingAttempts: config.maxAttempts - 1,
    };
  }

  // Increment attempts
  const newAttempts = entry.attempts + 1;
  const remainingAttempts = Math.max(0, config.maxAttempts - newAttempts);

  // Check if max attempts reached
  if (newAttempts >= config.maxAttempts) {
    const lockedUntil = now + config.lockoutDurationMs;
    await setRateLimitEntry(key, {
      ...entry,
      attempts: newAttempts,
      lockedUntil,
    });
    logWarn('Rate limit exceeded', {
      identifier,
      type,
      attempts: newAttempts,
      lockedUntil,
    });
    return {
      allowed: false,
      remainingAttempts: 0,
      lockedUntil,
    };
  }

  // Still within limits
  await setRateLimitEntry(key, {
    ...entry,
    attempts: newAttempts,
  });

  return {
    allowed: true,
    remainingAttempts,
  };
}

export async function recordRateLimitAttempt(
  identifier: string,
  type: keyof typeof RATE_LIMIT_CONFIG = 'AUTH'
): Promise<void> {
  // Just call checkRateLimit to record the attempt
  await checkRateLimit(identifier, type);
}

export async function resetRateLimit(
  identifier: string,
  type: keyof typeof RATE_LIMIT_CONFIG = 'AUTH'
): Promise<void> {
  const key = `${type}_${identifier}`;
  await clearRateLimitEntry(key);
}

/**
 * Get user-friendly error message for rate limit
 */
export function getRateLimitErrorMessage(lockedUntil?: number): string {
  if (!lockedUntil) {
    return 'Too many attempts. Please try again later.';
  }
  const minutesRemaining = Math.ceil((lockedUntil - Date.now()) / (60 * 1000));
  return `Too many attempts. Please try again in ${minutesRemaining} minute${
    minutesRemaining !== 1 ? 's' : ''
  }.`;
}

