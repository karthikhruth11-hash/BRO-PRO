export function authMiddleware(req, res, next) {
  const clientToken = req.headers["x-wednesday-token"] || req.query.token;
  const expectedToken = process.env.AUTH_TOKEN || "wednesday-secret-local-handshake-token-2026";

  if (!clientToken || clientToken !== expectedToken) {
    return res.status(401).json({
      error: "Unauthorized: Invalid or missing local handshake token."
    });
  }
  next();
}
