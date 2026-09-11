import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(process.cwd(), "server", ".env") });
dotenv.config();

import express from "express";
import cors from "cors";
import { appFirewall } from "./security/appFirewall.js";
import { authMiddleware } from "./security/authMiddleware.js";
import chatRoutes from "./routes/chat.js";
import systemRoutes from "./routes/system.js";
import telemetryRoutes from "./routes/telemetry.js";
import memoryRoutes from "./routes/memory.js";
import authRoutes from "./routes/auth.js";
import authManagerRoutes from "./routes/authManagerRoutes.js";
import filesRoutes from "./routes/files.js";
import teamRoutes from "./routes/team.js";

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Enterprise In-App Web Application Firewall (WAF) Shield
app.use(appFirewall.middleware());

// Public Root Landing & Status Endpoint
app.get("/", (req, res) => {
  if (req.headers.accept && req.headers.accept.includes("application/json")) {
    return res.json({
      status: "online",
      service: "BRO AI (W.E.D.N.E.S.D.A.Y. Pro) Backend API",
      version: "2.0.0",
      frontend: "http://localhost:3000",
      healthCheck: "/api/health"
    });
  }

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BRO AI Backend Server • W.E.D.N.E.S.D.A.Y. Pro</title>
  <style>
    :root {
      --bg: #070a12;
      --card-bg: rgba(13, 20, 36, 0.85);
      --accent: #00f0ff;
      --accent-purple: #7000ff;
      --accent-green: #10b981;
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --border: rgba(0, 240, 255, 0.25);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: radial-gradient(circle at 50% 20%, rgba(112, 0, 255, 0.15), transparent 70%),
                  radial-gradient(circle at 80% 80%, rgba(0, 240, 255, 0.1), transparent 60%),
                  var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: var(--card-bg);
      backdrop-filter: blur(16px);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 40px;
      max-width: 580px;
      width: 100%;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 240, 255, 0.15);
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; height: 3px;
      background: linear-gradient(90deg, #00f0ff, #7000ff, #10b981);
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: var(--accent-green);
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-bottom: 20px;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--accent-green);
      box-shadow: 0 0 10px var(--accent-green);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(1.3); }
      100% { opacity: 1; transform: scale(1); }
    }
    h1 {
      font-size: 26px;
      font-weight: 800;
      margin-bottom: 8px;
      background: linear-gradient(135deg, #ffffff 40%, #00f0ff 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p.subtitle {
      color: var(--text-muted);
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 28px;
    }
    .btn-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 28px;
    }
    .btn-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      background: linear-gradient(135deg, #00f0ff 0%, #7000ff 100%);
      color: #fff;
      text-decoration: none;
      font-weight: 700;
      font-size: 15px;
      padding: 14px 24px;
      border-radius: 12px;
      transition: all 0.2s ease;
      box-shadow: 0 0 20px rgba(0, 240, 255, 0.35);
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 0 30px rgba(0, 240, 255, 0.5);
    }
    .btn-secondary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: var(--text);
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      padding: 12px 20px;
      border-radius: 12px;
      transition: all 0.2s ease;
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: var(--accent);
      color: var(--accent);
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      text-align: left;
      background: rgba(0, 0, 0, 0.25);
      padding: 16px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }
    .info-item {
      font-size: 12px;
    }
    .info-label {
      color: var(--text-muted);
      margin-bottom: 2px;
    }
    .info-value {
      font-weight: 600;
      color: #e2e8f0;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="status-badge">
      <span class="status-dot"></span>
      BACKEND API SERVER ACTIVE
    </div>
    <h1>BRO AI • W.E.D.N.E.S.D.A.Y. Pro</h1>
    <p class="subtitle">
      You are viewing the Express API backend service on port 5001.<br>
      To open the user interface, click below to visit the frontend application on port 3000.
    </p>
    <div class="btn-group">
      <a href="http://localhost:3000" class="btn-primary">
        🚀 Launch Web App (localhost:3000)
      </a>
      <a href="/api/health" class="btn-secondary">
        🩺 Inspect API Health (/api/health)
      </a>
    </div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Service Port</div>
        <div class="info-value">127.0.0.1:5001</div>
      </div>
      <div class="info-item">
        <div class="info-label">Environment</div>
        <div class="info-value">Development v2.0.0</div>
      </div>
      <div class="info-item">
        <div class="info-label">API Status</div>
        <div class="info-value" style="color: #10b981;">Online & Ready</div>
      </div>
      <div class="info-item">
        <div class="info-label">Frontend Client</div>
        <div class="info-value"><a href="http://localhost:3000" style="color:#00f0ff;text-decoration:none;">http://localhost:3000</a></div>
      </div>
    </div>
  </div>
</body>
</html>`);
});

// Public Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    service: "SAGW AI (W.E.D.N.E.S.D.A.Y. Pro) Backend BFF",
    version: "2.0.0",
    timestamp: new Date().toISOString()
  });
});

// Public Application Firewall Status & Threat Telemetry Endpoint
app.get("/api/firewall/status", (req, res) => {
  res.json(appFirewall.getMetrics());
});

// Hardened local auth handshake for protected API routes
app.use("/api", authMiddleware);

// Route Handlers
app.use("/api/auth", authRoutes);
app.use("/api/auth-manager", authManagerRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/telemetry", telemetryRoutes);
app.use("/api/memory", memoryRoutes);
app.use("/api/files", filesRoutes);
app.use("/api/team", teamRoutes);

// Start local Express server when not running on Vercel
if (!process.env.VERCEL) {
  app.listen(PORT, "127.0.0.1", () => {
    console.log(`=======================================================`);
    console.log(` SAGW AI Backend Server running at http://127.0.0.1:${PORT}`);
    console.log(` In-App Firewall (WAF): ACTIVE (Shield/2.0-Active)`);
    console.log(` Handshake Token: ${process.env.AUTH_TOKEN || "wednesday-secret-local-handshake-token-2026"}`);
    console.log(`=======================================================`);
  });
}

export default app;
