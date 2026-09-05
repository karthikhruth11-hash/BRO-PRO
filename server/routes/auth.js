import express from "express";
import { db } from "../data/db.js";
import { authManager, isAuthorizedAdminEmail } from "../modules/authManager.js";
import authManagerRoutes from "./authManagerRoutes.js";

const router = express.Router();

// Helper to get client IP
const getClientIp = (req) => {
  return req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.socket.remoteAddress || "127.0.0.1";
};

// 1. Get current user session (LINKED to authManager + fallback to db)
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "").trim() || req.query.token;

    if (token) {
      const data = authManager.read();
      const session = data.sessions.find(s => s.token === token);
      if (session) {
        const user = data.users.find(u => u.id === session.userId);
        if (user) {
          const sanitized = authManager.sanitizeUser(user);
          const trialInfo = authManager.checkUserAccessStatus(user);
          return res.json({
            success: true,
            authenticated: true,
            user: sanitized,
            trialInfo,
            accessInfo: trialInfo
          });
        }
      }
    }

    // Fallback if no token provided
    const users = db.read().users || [];
    const fallbackUser = users[0] || { id: "usr_default", name: "Guest User", email: "guest@broai.local", role: "USER", isAdmin: false };
    res.json({
      success: true,
      authenticated: false,
      user: fallbackUser,
      message: "No active authenticated session"
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Login endpoint (LINKED: delegates to authManager)
router.post("/login", async (req, res) => {
  try {
    const { email, emailOrMobile, password } = req.body;
    const target = emailOrMobile || email;
    if (!target) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // If password provided, use full secure authManager authentication
    if (password) {
      const result = await authManager.loginUser({
        emailOrMobile: target,
        password,
        ipAddress: getClientIp(req)
      });
      return res.json({ success: true, ...result });
    }

    // Passwordless / quick dev login fallback
    const data = authManager.read();
    let user = data.users.find(u => u.email.toLowerCase() === target.toLowerCase());
    if (!user) {
      const isOwner = isAuthorizedAdminEmail(target);
      user = {
        id: "usr_" + Date.now(),
        name: target.split("@")[0],
        email: target.toLowerCase(),
        isVerified: true,
        role: isOwner ? "ADMIN" : "USER",
        isAdmin: isOwner,
        createdDate: new Date().toISOString(),
        registrationDate: new Date().toISOString(),
        accountStatus: "active"
      };
      data.users.push(user);
    }

    const token = "auth_tok_" + Date.now() + "_" + Math.random().toString(36).substring(2);
    data.sessions.push({
      id: "sess_" + Date.now(),
      token,
      userId: user.id,
      createdDate: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });
    authManager.write(data);

    res.json({
      success: true,
      token,
      user: authManager.sanitizeUser(user)
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 3. Register endpoint (LINKED: creates in authManager)
router.post("/register", async (req, res) => {
  try {
    const { name, email, mobile, password, confirmPassword } = req.body;
    if (!email || !name) {
      return res.status(400).json({ success: false, message: "Name and email are required" });
    }

    if (password) {
      const result = await authManager.registerUser({
        name,
        email,
        mobile: mobile || "9999999999",
        password,
        confirmPassword: confirmPassword || password,
        ipAddress: getClientIp(req)
      });
      return res.json({ success: true, ...result });
    }

    const data = authManager.read();
    const existing = data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.json({ success: true, token: "auth_tok_" + Date.now(), user: authManager.sanitizeUser(existing) });
    }

    const isOwner = isAuthorizedAdminEmail(email);
    const newUser = {
      id: "usr_" + Date.now(),
      name,
      email: email.toLowerCase(),
      isVerified: true,
      role: isOwner ? "ADMIN" : "USER",
      isAdmin: isOwner,
      createdDate: new Date().toISOString(),
      registrationDate: new Date().toISOString(),
      accountStatus: "active"
    };
    data.users.push(newUser);
    authManager.write(data);

    res.json({
      success: true,
      token: "auth_tok_" + Date.now(),
      user: authManager.sanitizeUser(newUser)
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 4. Logout endpoint
router.post("/logout", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "").trim() || req.body.token;
    if (token) {
      await authManager.logoutUser(token, getClientIp(req));
    }
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    res.json({ success: true, message: "Logged out" });
  }
});

// 5. Mount all Admin and OTP Sub-routes directly onto /api/auth as well
router.use("/", authManagerRoutes);

export default router;
