// Shared CORS allowlist parsing, used by both the Fastify HTTP server
// (fastify-registerations.ts) and the Socket.IO server (socket/socket-io.ts) so the
// two never drift out of sync.
export const getAllowedOrigins = (): string[] =>
    (
        process.env.CORS_ORIGINS ||
        process.env.FRONTEND_URL ||
        'http://localhost:3000'
    )
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);
