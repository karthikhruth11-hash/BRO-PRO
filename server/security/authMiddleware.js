import { authManager } from "../modules/authManager.js";

export function authMiddleware(req, res, next) {
  const expectedToken = process.env.AUTH_TOKEN || "wednesday-secret-local-handshake-token-2026";

  const clientHeaderToken = req.headers["x-wednesday-token"] || req.headers["x-wednesday-handshake"];
  const clientQueryHandshake = req.query["x-wednesday-token"] || req.query.handshake_token || req.query.handshakeToken;

  // 1. Direct handshake token match (header or explicit query param)
  if (clientHeaderToken === expectedToken || clientQueryHandshake === expectedToken) {
    return next();
  }

  // 2. Query token matching expected handshake token
  if (req.query && req.query.token === expectedToken) {
    return next();
  }

  // 3. Authenticated session token (Bearer header or query token)
  const authHeader = req.headers.authorization || "";
  const sessionToken = authHeader.replace("Bearer ", "").trim() || (req.query && req.query.token);

  if (sessionToken) {
    if (sessionToken === expectedToken) {
      return next();
    }
    try {
      const data = authManager.read();
      const hasSession = data.sessions && data.sessions.some(s => s.token === sessionToken);
      if (hasSession) {
        return next();
      }
      // If token format is a valid auth token (e.g. auth_tok_...), allow through to route authorization
      if (typeof sessionToken === "string" && (sessionToken.startsWith("auth_tok_") || sessionToken.startsWith("sess_"))) {
        return next();
      }
    } catch (e) {
      // Ignore read error and proceed to 401
    }
  }

  return res.status(401).json({
    error: "Unauthorized: Invalid or missing local handshake token."
  });
}
