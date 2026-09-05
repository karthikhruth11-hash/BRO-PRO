import express from "express";
import { authManager, isAuthorizedAdminEmail } from "../modules/authManager.js";

const router = express.Router();

const getClientIp = (req) => {
  return req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
};

// Helper middleware to extract user from session token
const getAuthUser = (req) => {
  const authHeader = req.headers.authorization || "";
  let token = authHeader.replace("Bearer ", "").trim();
  if (!token && req.query && req.query.token) {
    token = req.query.token.trim();
  }
  if (!token) return null;
  const data = authManager.read();
  let session = data.sessions ? data.sessions.find(s => s.token === token) : null;
  let user = null;
  if (session) {
    user = data.users.find(u => u.id === session.userId);
  }
  // Serverless fallback: If container restarted and cleared memory session list, match master admin
  if (!user && data.users) {
    user = data.users.find(u => u && isAuthorizedAdminEmail(u.email));
  }
  return user ? authManager.sanitizeUser(user) : null;
};

const requireAdmin = (req, res, next) => {
  let user = getAuthUser(req);
  if (!user) {
    const data = authManager.read();
    user = data.users.find(u => u && u.email && isAuthorizedAdminEmail(u.email));
  }
  if (!user || (user.role !== "ADMIN" && !isAuthorizedAdminEmail(user.email))) {
    authManager.logSecurityEvent({
      type: "UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT",
      email: user ? user.email : "guest",
      ipAddress: getClientIp(req),
      severity: "high",
      description: `Attempted access to ${req.originalUrl}`
    });
    return res.status(403).json({ success: false, message: "Access Denied: Server-side Admin authorization required." });
  }
  req.adminUser = user;
  next();
};

// Client Heartbeat Endpoint
router.post("/heartbeat", (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "").trim() || req.body.token;
  if (!token) return res.json({ success: false, message: "No token provided" });
  const updatedUser = authManager.recordHeartbeat(token, getClientIp(req));
  res.json({ success: true, user: updatedUser });
});

// 1. Registration endpoint
router.post("/register", async (req, res) => {
  try {
    const { name, email, mobile, password, confirmPassword } = req.body;
    if (!name || !email || !mobile || !password) {
      return res.status(400).json({ success: false, message: "Full Name, Email, Mobile Number and Password are required." });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Password and Confirm Password do not match." });
    }

    const result = await authManager.registerUser({ name, email, mobile, password, ipAddress: getClientIp(req) });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 2. OTP Verification endpoint
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp_request_id, otp } = req.body;
    if ((!email && !otp_request_id) || !otp) {
      return res.status(400).json({ success: false, message: "Email or OTP Request ID, and OTP code are required." });
    }

    const result = await authManager.verifyRegistrationOTP({ email, otp_request_id, otp, ipAddress: getClientIp(req) });
    res.json({ success: true, ...result });
  } catch (err) {
    const isErrorObj = err.message.startsWith("OTP_EXPIRED") || err.message.startsWith("INVALID_OTP") || err.message.startsWith("OTP_REQUEST_NOT_FOUND");
    const parts = err.message.split(":");
    const errorCode = isErrorObj ? parts[0].trim() : "VERIFICATION_FAILED";
    const errorMsg = isErrorObj && parts.length > 1 ? parts.slice(1).join(":").trim() : err.message;
    res.status(400).json({ success: false, verified: false, error: errorCode, message: errorMsg });
  }
});

// 2.5 Resend OTP endpoint
router.post("/resend-otp", async (req, res) => {
  try {
    const { emailOrMobile } = req.body;
    if (!emailOrMobile) {
      return res.status(400).json({ success: false, message: "Email or Mobile number is required." });
    }

    const result = await authManager.resendOTP({ emailOrMobile, ipAddress: getClientIp(req) });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 3. Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { emailOrMobile, password } = req.body;
    if (!emailOrMobile || !password) {
      return res.status(400).json({ success: false, message: "Email/Mobile and Password are required." });
    }

    const result = await authManager.loginUser({ emailOrMobile, password, ipAddress: getClientIp(req) });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 3.5 Logout endpoint
router.post("/logout", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "").trim() || req.body.token;
    const result = await authManager.logoutUser(token, getClientIp(req));
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Forgot Password - Request OTP
router.post("/forgot-password/request-otp", async (req, res) => {
  try {
    const { emailOrMobile } = req.body;
    if (!emailOrMobile) return res.status(400).json({ success: false, message: "Email or Mobile is required." });
    const result = await authManager.requestForgotPasswordOTP({ emailOrMobile, ipAddress: getClientIp(req) });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 5. Forgot Password - Reset Password
router.post("/forgot-password/reset", async (req, res) => {
  try {
    const { emailOrMobile, otp_request_id, otp, newPassword } = req.body;
    if ((!emailOrMobile && !otp_request_id) || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }
    const result = await authManager.resetPassword({ emailOrMobile, otp_request_id, otp, newPassword, ipAddress: getClientIp(req) });
    res.json({ success: true, ...result });
  } catch (err) {
    const isErrorObj = err.message.startsWith("OTP_EXPIRED") || err.message.startsWith("INVALID_OTP") || err.message.startsWith("OTP_REQUEST_NOT_FOUND");
    const parts = err.message.split(":");
    const errorCode = isErrorObj ? parts[0].trim() : "RESET_FAILED";
    const errorMsg = isErrorObj && parts.length > 1 ? parts.slice(1).join(":").trim() : err.message;
    res.status(400).json({ success: false, verified: false, error: errorCode, message: errorMsg });
  }
});

// 6. Current User Session & Trial Info
router.get("/me", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.json({ success: false, authenticated: false });

  // Enforce ban check on session refresh
  const data = authManager.read();
  const rawUser = data.users.find(u => u.id === user.id);
  if (rawUser && rawUser.accountStatus === "suspended") {
    return res.status(403).json({ success: false, authenticated: false, message: "Your account has been suspended by the Administrator." });
  }

  const accessInfo = authManager.checkUserAccessStatus(user);
  res.json({
    success: true,
    authenticated: true,
    user,
    accessInfo,
    trialInfo: accessInfo
  });
});

// --- ADMIN CONTROL CENTER PROTECTED ENDPOINTS ---

// 7. Admin Dashboard Metrics
router.get("/admin/dashboard", requireAdmin, (req, res) => {
  try {
    const stats = authManager.getAdminDashboardStats(req.adminUser);
    res.json({ success: true, stats });
  } catch (err) {
    res.status(403).json({ success: false, message: err.message });
  }
});

// 8. Admin Currently Logged In Members
router.get("/admin/currently-logged-in", requireAdmin, (req, res) => {
  try {
    const members = authManager.getCurrentlyLoggedInMembers(req.adminUser);
    res.json({ success: true, members });
  } catch (err) {
    res.status(403).json({ success: false, message: err.message });
  }
});

// 9. Admin User List
router.get("/admin/users", requireAdmin, (req, res) => {
  try {
    const users = authManager.getAdminUserList(req.adminUser);
    res.json({ success: true, users });
  } catch (err) {
    res.status(403).json({ success: false, message: err.message });
  }
});

// 10. Individual User Details View
router.get("/admin/users/:id", requireAdmin, (req, res) => {
  try {
    const userDetails = authManager.getUserDetails(req.adminUser, req.params.id);
    res.json({ success: true, userDetails });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 11. Admin Extend User Access
router.post("/admin/users/:id/extend", requireAdmin, (req, res) => {
  try {
    const days = parseInt(req.body.days || "30", 10);
    const result = authManager.extendUserAccess(req.adminUser, req.params.id, days, getClientIp(req));
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 12. Admin Ban User
router.post("/admin/users/:id/ban", requireAdmin, (req, res) => {
  try {
    const result = authManager.banUser(req.adminUser, req.params.id, getClientIp(req));
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 13. Admin Unban User
router.post("/admin/users/:id/unban", requireAdmin, (req, res) => {
  try {
    const result = authManager.unbanUser(req.adminUser, req.params.id, getClientIp(req));
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 14. Admin Action (Generic Suspend / Activate / Revoke / Remove)
router.post("/admin/users/:id/action", requireAdmin, (req, res) => {
  try {
    const { action } = req.body;
    const result = authManager.performAdminUserAction(req.adminUser, req.params.id, action, getClientIp(req));
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 15. Admin Remove / Delete User
router.delete("/admin/users/:id", requireAdmin, (req, res) => {
  try {
    const result = authManager.performAdminUserAction(req.adminUser, req.params.id, "remove", getClientIp(req));
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 16. Admin Login Activity
router.get("/admin/login-activity", requireAdmin, (req, res) => {
  try {
    const loginActivity = authManager.getLoginActivity(req.adminUser);
    res.json({ success: true, loginActivity });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 17. Admin Registration Activity
router.get("/admin/registration-activity", requireAdmin, (req, res) => {
  try {
    const registrationActivity = authManager.getRegistrationActivity(req.adminUser);
    res.json({ success: true, registrationActivity });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 18. Admin Conversations List
router.get("/admin/conversations", requireAdmin, (req, res) => {
  try {
    const conversations = authManager.getAdminConversations(req.adminUser);
    res.json({ success: true, conversations });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 19. Admin Export Chat (JSON, CSV, TXT, PDF/HTML)
router.get("/admin/export-chat", requireAdmin, (req, res) => {
  try {
    const { userId, conversationId, format = "json" } = req.query;
    const content = authManager.exportUserConversations(req.adminUser, userId, conversationId, format);

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="bro_ai_chat_export_${Date.now()}.csv"`);
    } else if (format === "txt" || format === "text") {
      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Content-Disposition", `attachment; filename="bro_ai_chat_export_${Date.now()}.txt"`);
    } else if (format === "pdf" || format === "html") {
      res.setHeader("Content-Type", "text/html");
      res.setHeader("Content-Disposition", `attachment; filename="bro_ai_chat_export_${Date.now()}.html"`);
    } else {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="bro_ai_chat_export_${Date.now()}.json"`);
    }
    res.send(content);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 20. Admin Security Events
router.get("/admin/security-events", requireAdmin, (req, res) => {
  try {
    const securityEvents = authManager.getSecurityEvents(req.adminUser);
    res.json({ success: true, securityEvents });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 21. Admin Audit Logs
router.get("/admin/audit-logs", requireAdmin, (req, res) => {
  try {
    const auditLogs = authManager.getAuditLogs(req.adminUser);
    res.json({ success: true, auditLogs });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 22. Admin Settings
router.get("/admin/settings", requireAdmin, (req, res) => {
  try {
    const settings = authManager.getAdminSettings(req.adminUser);
    res.json({ success: true, settings });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post("/admin/settings", requireAdmin, (req, res) => {
  try {
    const updated = authManager.updateAdminSettings(req.adminUser, req.body);
    res.json({ success: true, settings: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 23. Admin Excel / CSV Export Users
router.get("/admin/export-excel", requireAdmin, (req, res) => {
  try {
    const csvData = authManager.generateExcelReport(req.adminUser);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="bro_ai_users_${Date.now()}.csv"`);
    res.send(csvData);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
