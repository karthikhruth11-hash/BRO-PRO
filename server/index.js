import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(process.cwd(), "server", ".env") });
dotenv.config();

import express from "express";
import cors from "cors";
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

// Public Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    service: "BRO AI (W.E.D.N.E.S.D.A.Y. Pro) Backend BFF",
    version: "2.0.0",
    timestamp: new Date().toISOString()
  });
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
    console.log(` BRO AI Backend Server running at http://127.0.0.1:${PORT}`);
    console.log(` Handshake Token: ${process.env.AUTH_TOKEN || "wednesday-secret-local-handshake-token-2026"}`);
    console.log(`=======================================================`);
  });
}

export default app;
