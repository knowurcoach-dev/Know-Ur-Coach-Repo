let fs: any = null;
let path: any = null;
let nodeCrypto: any = null;
if (typeof window === 'undefined') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    fs = eval('require')('fs');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    path = eval('require')('path');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    nodeCrypto = eval('require')('crypto');
  } catch {
    fs = null;
    path = null;
    nodeCrypto = null;
  }
}

interface StoredOtp {
  otp: string;
  role: string;
  expiresAt: number;
  lastRequestedAt: number;
  requestCount: number;
  failedAttempts: number;
}

// File persistence helper to survive worker thread / server restarts
function getCacheFilePath(): string | null {
  try {
    const cacheDir = path.join(process.cwd(), 'node_modules', '.cache');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    return path.join(cacheDir, 'knowurcoach-otps.json');
  } catch {
    try {
      const fallbackDir = path.join(process.cwd(), '.data');
      if (!fs.existsSync(fallbackDir)) {
        fs.mkdirSync(fallbackDir, { recursive: true });
      }
      return path.join(fallbackDir, 'otps.json');
    } catch {
      return null;
    }
  }
}

function loadDiskCache(): Map<string, StoredOtp> {
  const filePath = getCacheFilePath();
  if (!filePath || !fs.existsSync(filePath)) {
    return new Map();
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    const map = new Map<string, StoredOtp>();
    const now = Date.now();
    for (const [key, val] of Object.entries(data)) {
      if ((val as StoredOtp).expiresAt > now) {
        map.set(key, val as StoredOtp);
      }
    }
    return map;
  } catch {
    return new Map();
  }
}

function saveDiskCache(store: Map<string, StoredOtp>): void {
  const filePath = getCacheFilePath();
  if (!filePath) return;
  try {
    const obj: Record<string, StoredOtp> = {};
    const now = Date.now();
    for (const [key, val] of store.entries()) {
      if (val.expiresAt > now) {
        obj[key] = val;
      }
    }
    fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[OTP] Could not persist to disk cache:', err);
  }
}

// Global cache for OTPs (survives hot reloads in development and process re-evaluations)
declare global {
  // eslint-disable-next-line no-var
  var __knowurcoach_otp_cache: Map<string, StoredOtp> | undefined;
}

const g = globalThis as any;
if (!g.__knowurcoach_otp_cache) {
  g.__knowurcoach_otp_cache = loadDiskCache();
}

const otpStore: Map<string, StoredOtp> = g.__knowurcoach_otp_cache;

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MIN_INTERVAL_MS = 30 * 1000; // 30 seconds between requests
const MAX_REQUESTS = 5;

/**
 * Normalizes email address for consistent dictionary lookup
 */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Checks whether an email is currently rate-limited from requesting more OTPs
 */
export function checkOtpRateLimit(email: string): { allowed: boolean; error?: string } {
  const cleanEmail = normalizeEmail(email);
  let existing = otpStore.get(cleanEmail);

  if (!existing) {
    const diskStore = loadDiskCache();
    existing = diskStore.get(cleanEmail);
    if (existing) {
      otpStore.set(cleanEmail, existing);
    }
  }

  if (!existing) return { allowed: true };

  const now = Date.now();

  // Cooldown check (30 seconds)
  if (now - existing.lastRequestedAt < MIN_INTERVAL_MS) {
    const secondsRemaining = Math.ceil((MIN_INTERVAL_MS - (now - existing.lastRequestedAt)) / 1000);
    return {
      allowed: false,
      error: `Please wait ${secondsRemaining}s before requesting a new verification code.`,
    };
  }

  // Quota check (max 5 requests per 10-minute window)
  if (existing.requestCount >= MAX_REQUESTS && now < existing.expiresAt) {
    const minutesRemaining = Math.ceil((existing.expiresAt - now) / 60000);
    return {
      allowed: false,
      error: `Too many attempts. Please wait ${minutesRemaining} minutes before requesting another code.`,
    };
  }

  return { allowed: true };
}

// IP-based Rate Limiter (Max 20 requests per IP per hour)
interface IpRateLimitEntry {
  count: number;
  resetAt: number;
}

const ipRateStore = new Map<string, IpRateLimitEntry>();
const IP_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_IP_REQUESTS = 20;

export function checkIpRateLimit(ip: string): { allowed: boolean; error?: string } {
  if (!ip || ip === '127.0.0.1' || ip === '::1') return { allowed: true };
  const now = Date.now();
  const entry = ipRateStore.get(ip);

  if (!entry || now > entry.resetAt) {
    ipRateStore.set(ip, { count: 1, resetAt: now + IP_WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= MAX_IP_REQUESTS) {
    const minutesRemaining = Math.ceil((entry.resetAt - now) / 60000);
    return {
      allowed: false,
      error: `Too many verification requests from this network. Please try again in ${minutesRemaining} minutes.`,
    };
  }

  entry.count++;
  return { allowed: true };
}

/**
 * Generates a random 6-digit verification code and stores it with an expiry timestamp
 */
export function generateAndStoreOtp(email: string, role: string = 'PARENT'): string {
  const cleanEmail = normalizeEmail(email);
  let existing = otpStore.get(cleanEmail);

  if (!existing) {
    const disk = loadDiskCache();
    existing = disk.get(cleanEmail);
  }

  const now = Date.now();

  // Cryptographically secure 6-digit numeric OTP (100000 - 999999)
  const code = nodeCrypto?.randomInt
    ? nodeCrypto.randomInt(100000, 1000000).toString()
    : Math.floor(100000 + Math.random() * 900000).toString();
  const requestCount = (existing && now < existing.expiresAt) ? existing.requestCount + 1 : 1;

  const record: StoredOtp = {
    otp: code,
    role,
    expiresAt: now + OTP_TTL_MS,
    lastRequestedAt: now,
    requestCount,
    failedAttempts: 0,
  };

  otpStore.set(cleanEmail, record);
  saveDiskCache(otpStore);

  console.log(`[OTP] Generated 6-digit code for ${cleanEmail} (role: ${role})`);

  return code;
}

/**
 * Validates the entered OTP against the stored code for the given email
 */
export function verifyOtp(
  email: string,
  enteredOtp: string
): { valid: boolean; role?: string; error?: string } {
  const cleanEmail = normalizeEmail(email);
  const cleanCode = (enteredOtp || '').trim();

  let record = otpStore.get(cleanEmail);

  // If not found in memory, try loading from disk cache
  if (!record) {
    const disk = loadDiskCache();
    record = disk.get(cleanEmail);
    if (record) {
      otpStore.set(cleanEmail, record);
    }
  }

  // Development bypass helper for testing when in non-production environment
  if (!record && cleanCode === '123456' && process.env.NODE_ENV !== 'production') {
    console.log(`[OTP] Dev test code 123456 accepted for ${cleanEmail}`);
    return {
      valid: true,
      role: 'COACH',
    };
  }

  if (!record) {
    return {
      valid: false,
      error: 'No active OTP found. Please request a new verification code.',
    };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(cleanEmail);
    saveDiskCache(otpStore);
    return {
      valid: false,
      error: 'This verification code has expired (valid for 10 minutes). Please request a fresh one.',
    };
  }

  if (record.otp !== cleanCode && (cleanCode !== '123456' || process.env.NODE_ENV === 'production')) {
    record.failedAttempts = (record.failedAttempts || 0) + 1;
    if (record.failedAttempts >= 5) {
      otpStore.delete(cleanEmail);
      saveDiskCache(otpStore);
      return {
        valid: false,
        error: 'Too many incorrect attempts. This verification code has been invalidated for security. Please request a new code.',
      };
    }
    saveDiskCache(otpStore);
    const remaining = 5 - record.failedAttempts;
    return {
      valid: false,
      error: `Incorrect verification code. (${remaining} attempt${remaining > 1 ? 's' : ''} remaining)`,
    };
  }

  // OTP verified successfully; clear it to prevent replay attacks
  const matchedRole = record.role;
  otpStore.delete(cleanEmail);
  saveDiskCache(otpStore);

  console.log(`[OTP] Successfully verified code for ${cleanEmail}`);

  return {
    valid: true,
    role: matchedRole,
  };
}

/**
 * Clears any pending OTP for an email
 */
export function clearOtp(email: string): void {
  const clean = normalizeEmail(email);
  otpStore.delete(clean);
  saveDiskCache(otpStore);
}
