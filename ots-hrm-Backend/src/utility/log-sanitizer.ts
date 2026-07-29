// Redaction helpers for the ActivityLog request logger.
// Prevents plaintext credentials / session tokens from being persisted to the DB.

const REDACTED = "[REDACTED]";

// Body fields whose values must never be stored (case-insensitive, matched loosely).
const SENSITIVE_BODY_KEYS = [
    "password",
    "newpassword",
    "currentpassword",
    "oldpassword",
    "confirmpassword",
    "passwordhash",
    "token",
    "accesstoken",
    "refreshtoken",
    "googleaccesstoken",
    "googlerefreshtoken",
    "code",
    "otp",
    "secret",
    "authorization",
];

// Request headers that carry credentials / session material and must be dropped.
const SENSITIVE_HEADERS = ["authorization", "cookie", "set-cookie", "x-access-token", "x-api-key"];

const isSensitiveBodyKey = (key: string): boolean => {
    const k = key.toLowerCase();
    return SENSITIVE_BODY_KEYS.some((s) => k === s || k.includes(s));
};

// Recursively redacts sensitive keys in an object/array without mutating the original.
const redactValue = (value: unknown): unknown => {
    if (Array.isArray(value)) {
        return value.map(redactValue);
    }
    if (value && typeof value === "object") {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
            out[k] = isSensitiveBodyKey(k) ? REDACTED : redactValue(v);
        }
        return out;
    }
    return value;
};

// Returns a JSON string of the body with sensitive fields redacted, or undefined.
export const sanitizeBody = (body: unknown): string | undefined => {
    if (body === undefined || body === null) return undefined;
    try {
        return JSON.stringify(redactValue(body));
    } catch {
        return undefined;
    }
};

// Returns a JSON string of headers with credential-bearing headers removed, or undefined.
export const sanitizeHeaders = (headers: unknown): string | undefined => {
    if (!headers || typeof headers !== "object") return undefined;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(headers as Record<string, unknown>)) {
        if (SENSITIVE_HEADERS.includes(k.toLowerCase())) continue;
        out[k] = v;
    }
    try {
        return JSON.stringify(out);
    } catch {
        return undefined;
    }
};
