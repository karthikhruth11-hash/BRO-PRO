import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import { db } from "../data/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TMP_DB_FILE = path.join("/tmp", "auth_store.json");

const getDbFilePath = () => {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return TMP_DB_FILE;
  }
  return path.join(__dirname, "..", "data", "auth_store.json");
};

const getAuthorizedAdminEmails = () => {
  const envAdmins = process.env.AUTHORIZED_ADMIN_EMAILS || process.env.ADMIN_EMAIL || "karthikhruth@gmail.com";
  return envAdmins.split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
};

export const isAuthorizedAdminEmail = (email) => {
  if (!email) return false;
  const authorized = getAuthorizedAdminEmails();
  return authorized.includes(email.toLowerCase().trim());
};

const OTP_LENGTH = parseInt(process.env.OTP_LENGTH || "6", 10);
const OTP_EXPIRATION_MINUTES = parseInt(process.env.OTP_EXPIRATION_MINUTES || "5", 10);
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || "5", 10);
const OTP_REQUEST_LIMIT = parseInt(process.env.OTP_REQUEST_LIMIT || "3", 10);

const INITIAL_AUTH_DATA = {
  users: [],
  otps: [],
  sessions: [],
  payments: [],
  audit_logs: [],
  activity_logs: [],
  security_events: [],
  settings: {
    adminEmails: ["karthikhruth@gmail.com"],
    sessionTimeoutMinutes: 43200,
    enableAuditLogging: true,
    allowExports: true
  }
};

let globalAuthCache = null;

export class AuthManager {
  constructor() {
    this.ensureDb();
  }

  ensureDb() {
    const dbPath = getDbFilePath();
    const dir = path.dirname(dbPath);
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (!fs.existsSync(dbPath)) {
        const seedPath = path.join(__dirname, "..", "data", "auth_store.json");
        let initial = INITIAL_AUTH_DATA;
        if (fs.existsSync(seedPath)) {
          try { initial = JSON.parse(fs.readFileSync(seedPath, "utf8")); } catch (e) {}
        }
        fs.writeFileSync(dbPath, JSON.stringify(initial, null, 2));
      }
    } catch (err) {
      console.warn("Storage warning in ensureDb:", err.message);
    }
  }

  read() {
    try {
      this.ensureDb();
      const dbPath = getDbFilePath();
      if (fs.existsSync(dbPath)) {
        const content = fs.readFileSync(dbPath, "utf8");
        const data = JSON.parse(content);
        if (!data.users) data.users = [];
        if (!data.audit_logs) data.audit_logs = [];
        if (!data.activity_logs) data.activity_logs = [];
        if (!data.security_events) data.security_events = [];
        if (!data.otps) data.otps = [];
        if (!data.sessions) data.sessions = [];
        if (!data.settings) data.settings = INITIAL_AUTH_DATA.settings;

        // Auto seed master admin if missing or update if present
        let adminUser = data.users.find(u => u && u.email && u.email.toLowerCase().trim() === "karthikhruth@gmail.com");
        if (!adminUser) {
          adminUser = {
            id: "usr_admin_karthik",
            name: "Karthik Admin",
            email: "karthikhruth@gmail.com",
            mobile: "+919177164536",
            passwordHash: this.hashPassword("AdminPassword123!"),
            role: "ADMIN",
            isAdmin: true,
            isVerified: true,
            accountStatus: "active",
            created_at: new Date().toISOString(),
            access_start: new Date().toISOString(),
            access_expires_at: null,
            last_login_at: new Date().toISOString(),
            last_active_at: new Date().toISOString(),
            email_verified: true
          };
          data.users.push(adminUser);
          this.write(data);
        } else {
          let updated = false;
          if (adminUser.role !== "ADMIN") { adminUser.role = "ADMIN"; updated = true; }
          if (!adminUser.isAdmin) { adminUser.isAdmin = true; updated = true; }
          if (!adminUser.isVerified) { adminUser.isVerified = true; updated = true; }
          if (adminUser.access_expires_at !== null) { adminUser.access_expires_at = null; updated = true; }
          if (updated) this.write(data);
        }

        globalAuthCache = data;
        return data;
      }
    } catch (e) {
      console.warn("Error reading auth database, using cache:", e.message);
    }
    if (!globalAuthCache) {
      globalAuthCache = { ...INITIAL_AUTH_DATA };
    }
    return globalAuthCache;
  }

  write(data) {
    globalAuthCache = data;
    try {
      const dbPath = getDbFilePath();
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error("Error writing auth database:", e.message);
    }
  }

  hashPassword(password) {
    return crypto.createHash("sha256").update(password + "wednesday-salt-2026").digest("hex");
  }

  hashOTP(otp) {
    return crypto.createHash("sha256").update(otp.trim() + "wednesday-otp-salt-2026").digest("hex");
  }

  generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }

  logAudit({ actorUserId = "system", action, targetUserId = null, ipAddress = "127.0.0.1", metadata = {} }) {
    try {
      const data = this.read();
      data.audit_logs.push({
        id: "audit_" + Date.now() + "_" + crypto.randomBytes(4).toString("hex"),
        actorUserId,
        action,
        targetUserId,
        timestamp: new Date().toISOString(),
        ipAddress,
        metadata
      });
      this.write(data);
    } catch (e) {
      console.error("Audit log writing error:", e);
    }
  }

  logActivity({ type, userId = null, email = null, name = null, status = "success", ipAddress = "127.0.0.1", details = "" }) {
    try {
      const data = this.read();
      data.activity_logs.push({
        id: "act_" + Date.now() + "_" + crypto.randomBytes(4).toString("hex"),
        type,
        userId,
        email,
        name,
        status,
        timestamp: new Date().toISOString(),
        ipAddress,
        details
      });
      // Cap logs at 2000 items
      if (data.activity_logs.length > 2000) {
        data.activity_logs = data.activity_logs.slice(-1500);
      }
      this.write(data);
    } catch (e) {
      console.error("Activity log writing error:", e);
    }
  }

  logSecurityEvent({ type, userId = null, email = null, ipAddress = "127.0.0.1", severity = "medium", description = "" }) {
    try {
      const data = this.read();
      data.security_events.push({
        id: "sec_" + Date.now() + "_" + crypto.randomBytes(4).toString("hex"),
        type,
        userId,
        email,
        ipAddress,
        severity,
        description,
        timestamp: new Date().toISOString()
      });
      if (data.security_events.length > 1000) {
        data.security_events = data.security_events.slice(-800);
      }
      this.write(data);
    } catch (e) {
      console.error("Security event writing error:", e);
    }
  }

  recordHeartbeat(token, ipAddress = "127.0.0.1") {
    if (!token) return null;
    const data = this.read();
    const session = data.sessions.find(s => s.token === token);
    if (!session) return null;

    const nowIso = new Date().toISOString();
    session.last_active_at = nowIso;
    const user = data.users.find(u => u.id === session.userId);
    if (user) {
      user.last_active_at = nowIso;
    }
    this.write(data);
    return user ? this.sanitizeUser(user) : null;
  }

  validateEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email.trim())) {
      throw new Error("Invalid Email address format. Please enter a valid working Email (e.g., name@gmail.com).");
    }
    return email.toLowerCase().trim();
  }

  validateMobile(mobile) {
    if (!mobile) throw new Error("Mobile number is required.");
    const clean = mobile.replace(/[\s\-\(\)]/g, "");
    const mobileRegex = /^\+?[0-9]{10,13}$/;
    if (!mobileRegex.test(clean) || clean.includes("0000000000") || clean.includes("1234567890")) {
      throw new Error("Invalid Mobile number. Please enter a valid working 10-digit phone number.");
    }
    return clean;
  }

  checkOtpRateLimit(email, data) {
    const windowMs = 15 * 60 * 1000;
    const now = Date.now();
    const recentRequests = data.otps.filter(o => 
      (o.target === email || o.email === email) && 
      (now - new Date(o.createdAt).getTime()) < windowMs
    );

    if (recentRequests.length >= OTP_REQUEST_LIMIT) {
      throw new Error(`Too many OTP requests. Maximum ${OTP_REQUEST_LIMIT} requests allowed per 15 minutes. Please wait before requesting again.`);
    }
  }

  async sendOTP({ target, otp, channel = "email" }) {
    console.log(`[REAL OTP DISPATCH] Channel: ${channel.toUpperCase()} | Target: ${target}`);
    let inboxUrl = null;

    if (channel === "email") {
      try {
        let transporter;
        let fromAddr;

        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
          try {
            transporter = nodemailer.createTransport({
              service: "gmail",
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
              }
            });
            fromAddr = `"BRO AI Security" <${process.env.SMTP_USER}>`;
            await transporter.sendMail({
              from: fromAddr,
              to: target,
              subject: "BRO AI — Login Verification",
              text: `Your verification code is: ${otp}\n\nThis OTP will expire in ${OTP_EXPIRATION_MINUTES} minutes.\n\n— BRO AI Security`,
              html: `<div style="font-family: Arial, sans-serif; padding: 24px; background: #070a12; color: #fff; border-radius: 16px; border: 1px solid rgba(0,240,255,0.3);">
                <h2 style="color: #00f0ff; margin-top: 0;">BRO AI — Login Verification</h2>
                <p style="font-size: 14px; color: #94a3b8;">Your verification code is:</p>
                <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #00f0ff; background: #0d1424; padding: 18px; border-radius: 12px; text-align: center; margin: 20px 0; border: 1px solid rgba(0,240,255,0.4);">${otp}</div>
                <p style="color: #f59e0b; font-size: 13px; font-weight: 600;">This OTP will expire in ${OTP_EXPIRATION_MINUTES} minutes.</p>
                <p style="color: #64748b; font-size: 12px; margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;">If you did not request this code, please ignore this email.<br />— BRO AI Security</p>
              </div>`
            });
            return { success: true, inboxUrl: null };
          } catch (smtpErr) {
            console.warn(`[SMTP FAIL, FALLING BACK TO ETHEREAL]: ${smtpErr.message}`);
          }
        }

        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: testAccount.smtp.host,
          port: testAccount.smtp.port,
          secure: testAccount.smtp.secure,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        fromAddr = `"BRO AI Security" <${testAccount.user}>`;

        const info = await transporter.sendMail({
          from: fromAddr,
          to: target,
          subject: "BRO AI — Login Verification",
          text: `Your verification code is: ${otp}\n\nThis OTP will expire in ${OTP_EXPIRATION_MINUTES} minutes.\n\n— BRO AI Security`,
          html: `<div style="font-family: Arial, sans-serif; padding: 24px; background: #070a12; color: #fff; border-radius: 16px; border: 1px solid rgba(0,240,255,0.3);">
            <h2 style="color: #00f0ff; margin-top: 0;">BRO AI — Login Verification</h2>
            <p style="font-size: 14px; color: #94a3b8;">Your verification code is:</p>
            <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #00f0ff; background: #0d1424; padding: 18px; border-radius: 12px; text-align: center; margin: 20px 0; border: 1px solid rgba(0,240,255,0.4);">${otp}</div>
            <p style="color: #f59e0b; font-size: 13px; font-weight: 600;">This OTP will expire in ${OTP_EXPIRATION_MINUTES} minutes.</p>
            <p style="color: #64748b; font-size: 12px; margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;">If you did not request this code, please ignore this email.<br />— BRO AI Security</p>
          </div>`
        });

        inboxUrl = nodemailer.getTestMessageUrl(info);
      } catch (err) {
        console.warn(`[DISPATCH WARN] Could not dispatch email to ${target}: ${err.message}`);
      }
    }

    if (channel === "sms" && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      try {
        const twilio = (await import("twilio")).default;
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.messages.create({
          body: `BRO AI — Verification Code: ${otp}. Expires in ${OTP_EXPIRATION_MINUTES} minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: target
        });
      } catch (err) {
        console.warn(`[TWILIO WARN] Could not send SMS via Twilio to ${target}: ${err.message}`);
      }
    }

    return { success: true, inboxUrl };
  }

  async registerUser({ name, email, mobile, password, ipAddress = "127.0.0.1" }) {
    const cleanEmail = this.validateEmail(email);
    const cleanMobile = this.validateMobile(mobile);

    if (!name || name.trim().length < 2) {
      throw new Error("Full Name is required (minimum 2 characters).");
    }

    if (!password || password.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }

    const data = this.read();
    this.checkOtpRateLimit(cleanEmail, data);

    const existing = data.users.find(u => u.email === cleanEmail || u.mobile === cleanMobile);
    if (existing && existing.isVerified) {
      this.logActivity({ type: "REGISTRATION_ATTEMPT", email: cleanEmail, name, status: "failed", ipAddress, details: "Email/Mobile already registered" });
      throw new Error("An account with this Email or Mobile number already exists. Please Sign In.");
    }

    const otpCode = this.generateOTP();
    const otpHash = this.hashOTP(otpCode);
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000).toISOString();

    const isOwner = isAuthorizedAdminEmail(cleanEmail);
    const role = isOwner ? "ADMIN" : "USER";

    let user = data.users.find(u => u.email === cleanEmail);
    if (!user) {
      const now = new Date();
      const expirationDate = isOwner ? null : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

      user = {
        id: "usr_" + Date.now(),
        name: name.trim(),
        email: cleanEmail,
        mobile: cleanMobile,
        passwordHash: this.hashPassword(password),
        role,
        isVerified: false,
        accountStatus: "active",
        created_at: now.toISOString(),
        access_start: now.toISOString(),
        access_expires_at: expirationDate,
        last_login_at: null,
        last_active_at: null,
        email_verified: false
      };
      data.users.push(user);
    } else {
      user.name = name.trim();
      user.mobile = cleanMobile;
      user.passwordHash = this.hashPassword(password);
      user.role = role;
    }

    const otpRequestId = "otpreq_" + Date.now() + "_" + crypto.randomBytes(8).toString("hex");

    data.otps = data.otps.filter(o => o.target !== cleanEmail && o.email !== cleanEmail && o.mobile !== cleanMobile);
    data.otps.push({
      id: otpRequestId,
      otp_request_id: otpRequestId,
      userId: user.id,
      email: cleanEmail,
      target: cleanEmail,
      mobile: cleanMobile,
      otp: otpCode,
      otpHash,
      createdAt,
      expiresAt,
      attemptCount: 0,
      used: false,
      intent: "registration",
      requestIp: ipAddress
    });

    this.write(data);

    const emailRes = await this.sendOTP({ target: cleanEmail, otp: otpCode, channel: "email" });
    await this.sendOTP({ target: cleanMobile, otp: otpCode, channel: "sms" });

    this.logAudit({ actorUserId: user.id, action: "REGISTER_REQUEST_OTP", targetUserId: user.id, ipAddress, metadata: { email: cleanEmail, otp_request_id: otpRequestId } });
    this.logActivity({ type: "REGISTRATION_ATTEMPT", userId: user.id, email: cleanEmail, name: user.name, status: "pending_otp", ipAddress, details: "OTP code dispatched" });

    return {
      message: `A 6-digit verification code has been dispatched to ${cleanEmail}. Valid for ${OTP_EXPIRATION_MINUTES} minutes.`,
      otp_request_id: otpRequestId,
      expires_in: OTP_EXPIRATION_MINUTES * 60,
      email: cleanEmail,
      mobile: cleanMobile,
      inboxUrl: emailRes.inboxUrl || null,
      dispatchNotice: `OTP sent directly to Gmail (${cleanEmail}) & Phone (${cleanMobile})`
    };
  }

  async resendOTP({ emailOrMobile, ipAddress = "127.0.0.1" }) {
    if (!emailOrMobile) throw new Error("Email or Mobile number is required.");
    const input = emailOrMobile.toLowerCase().trim();
    const data = this.read();

    const user = data.users.find(u => u.email === input || u.mobile === input);
    const targetEmail = user ? user.email : (input.includes("@") ? input : "");
    const targetMobile = user ? user.mobile : (!input.includes("@") ? input : "");

    if (!targetEmail) throw new Error("Please enter a valid registered Email address.");

    this.checkOtpRateLimit(targetEmail, data);

    const otpCode = this.generateOTP();
    const otpHash = this.hashOTP(otpCode);
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000).toISOString();

    const otpRequestId = "otpreq_" + Date.now() + "_" + crypto.randomBytes(8).toString("hex");

    data.otps = data.otps.filter(o => o.target !== targetEmail && o.email !== targetEmail);
    data.otps.push({
      id: otpRequestId,
      otp_request_id: otpRequestId,
      userId: user ? user.id : null,
      email: targetEmail,
      target: targetEmail,
      mobile: targetMobile || targetEmail,
      otp: otpCode,
      otpHash,
      createdAt,
      expiresAt,
      attemptCount: 0,
      used: false,
      intent: "verification",
      requestIp: ipAddress
    });

    this.write(data);

    let emailRes = { inboxUrl: null };
    if (targetEmail) emailRes = await this.sendOTP({ target: targetEmail, otp: otpCode, channel: "email" });
    if (targetMobile) await this.sendOTP({ target: targetMobile, otp: otpCode, channel: "sms" });

    this.logAudit({ actorUserId: user ? user.id : "guest", action: "RESEND_OTP", targetUserId: user ? user.id : null, ipAddress, metadata: { email: targetEmail, otp_request_id: otpRequestId } });
    this.logActivity({ type: "RESEND_OTP", userId: user ? user.id : null, email: targetEmail, status: "success", ipAddress });

    return {
      message: `Fresh OTP code dispatched to ${targetEmail}! Valid for ${OTP_EXPIRATION_MINUTES} minutes.`,
      otp_request_id: otpRequestId,
      expires_in: OTP_EXPIRATION_MINUTES * 60,
      inboxUrl: emailRes.inboxUrl || null,
      dispatchNotice: `New OTP sent to Gmail/Mobile inbox.`
    };
  }

  async requestForgotPasswordOTP({ emailOrMobile, ipAddress = "127.0.0.1" }) {
    if (!emailOrMobile) throw new Error("Please enter your registered Email or Mobile number.");
    const input = emailOrMobile.toLowerCase().trim();
    const data = this.read();

    const user = data.users.find(u => u.email === input || u.mobile === input);
    if (!user) {
      this.logActivity({ type: "FORGOT_PASSWORD_REQUEST", email: input, status: "failed", ipAddress, details: "User not found" });
      throw new Error("No account found matching this Email or Mobile number.");
    }

    this.checkOtpRateLimit(user.email, data);

    const otpCode = this.generateOTP();
    const otpHash = this.hashOTP(otpCode);
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000).toISOString();
    const otpRequestId = "otpreq_" + Date.now() + "_" + crypto.randomBytes(8).toString("hex");

    data.otps = data.otps.filter(o => o.target !== user.email && o.email !== user.email);
    data.otps.push({
      id: otpRequestId,
      otp_request_id: otpRequestId,
      userId: user.id,
      email: user.email,
      target: user.email,
      mobile: user.mobile,
      otp: otpCode,
      otpHash,
      createdAt,
      expiresAt,
      attemptCount: 0,
      used: false,
      intent: "forgot_password",
      requestIp: ipAddress
    });

    this.write(data);

    const emailRes = await this.sendOTP({ target: user.email, otp: otpCode, channel: "email" });
    await this.sendOTP({ target: user.mobile, otp: otpCode, channel: "sms" });

    this.logAudit({ actorUserId: user.id, action: "FORGOT_PASSWORD_REQUEST_OTP", targetUserId: user.id, ipAddress, metadata: { email: user.email, otp_request_id: otpRequestId } });
    this.logActivity({ type: "FORGOT_PASSWORD_REQUEST", userId: user.id, email: user.email, status: "success", ipAddress });

    return {
      message: `Password reset OTP dispatched to your registered Gmail (${user.email}). Valid for ${OTP_EXPIRATION_MINUTES} minutes.`,
      otp_request_id: otpRequestId,
      expires_in: OTP_EXPIRATION_MINUTES * 60,
      email: user.email,
      mobile: user.mobile,
      inboxUrl: emailRes.inboxUrl || null,
      dispatchNotice: `Reset OTP sent to Gmail & Mobile inbox`
    };
  }

  async resetPassword({ emailOrMobile, otp_request_id, otp, newPassword, ipAddress = "127.0.0.1" }) {
    if ((!emailOrMobile && !otp_request_id) || !otp || !newPassword) {
      throw new Error("Email/Mobile or OTP Request ID, OTP code, and new Password are required.");
    }
    if (newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters long.");
    }

    const input = emailOrMobile ? emailOrMobile.toLowerCase().trim() : "";
    const data = this.read();

    let record = null;
    if (otp_request_id) {
      record = data.otps.find(o => (o.id === otp_request_id || o.otp_request_id === otp_request_id) && !o.used);
    }
    if (!record && input) {
      const matching = data.otps.filter(o => (o.target === input || o.email === input || o.mobile === input) && !o.used);
      if (matching && matching.length > 0) {
        record = matching[matching.length - 1];
      }
    }

    if (!record) {
      this.logSecurityEvent({ type: "FAILED_RESET_PASSWORD", email: input, ipAddress, severity: "low", description: "No active OTP request" });
      throw new Error("OTP_REQUEST_NOT_FOUND: No active OTP request found for this account. Please request a new OTP.");
    }

    if (new Date() > new Date(record.expiresAt)) {
      throw new Error("OTP_EXPIRED: This verification code has expired (5 min limit). Please request a new OTP.");
    }

    if (record.attemptCount >= OTP_MAX_ATTEMPTS) {
      throw new Error("Maximum OTP verification attempts exceeded (5 attempts max). Please request a new OTP.");
    }

    record.attemptCount += 1;

    const inputHash = this.hashOTP(otp);
    const isDirectMatch = record.otp === otp.trim() || record.code === otp.trim();
    const isHashMatch = record.otpHash === inputHash;

    if (!isDirectMatch && !isHashMatch) {
      this.write(data);
      this.logSecurityEvent({ type: "FAILED_OTP_ATTEMPT", email: record.email, ipAddress, severity: "medium", description: "Invalid OTP code during password reset" });
      throw new Error(`INVALID_OTP: Invalid verification code. ${OTP_MAX_ATTEMPTS - record.attemptCount} attempts remaining.`);
    }

    const user = data.users.find(u => u.id === record.userId || u.email === input || u.mobile === input);
    if (!user) throw new Error("User account record not found.");

    user.passwordHash = this.hashPassword(newPassword);
    record.used = true;
    record.verifiedAt = new Date().toISOString();

    this.write(data);

    this.logAudit({ actorUserId: user.id, action: "RESET_PASSWORD_SUCCESS", targetUserId: user.id, ipAddress });
    this.logActivity({ type: "RESET_PASSWORD", userId: user.id, email: user.email, status: "success", ipAddress });

    return {
      message: "Password reset successful! You can now sign in with your new password.",
      user: this.sanitizeUser(user)
    };
  }

  async verifyRegistrationOTP({ email, otp_request_id, otp, ipAddress = "127.0.0.1" }) {
    const input = email ? email.toLowerCase().trim() : "";
    const data = this.read();

    let record = null;
    if (otp_request_id) {
      record = data.otps.find(o => (o.id === otp_request_id || o.otp_request_id === otp_request_id));
    }
    if (!record && input) {
      const matchingOtps = data.otps.filter(o => (o.target === input || o.email === input || o.mobile === input));
      if (matchingOtps && matchingOtps.length > 0) {
        record = matchingOtps[matchingOtps.length - 1];
      }
    }

    if (!record || record.used) {
      this.logActivity({ type: "OTP_VERIFICATION", email: input, status: "failed", ipAddress, details: "No active OTP request" });
      throw new Error("OTP_REQUEST_NOT_FOUND: No active OTP request found for this account. Please request a new OTP.");
    }

    if (new Date() > new Date(record.expiresAt)) {
      throw new Error(`OTP_EXPIRED: This verification code has expired (5 min limit). Please request a new OTP.`);
    }

    if (record.attemptCount >= OTP_MAX_ATTEMPTS) {
      throw new Error("Maximum OTP verification attempts exceeded (5 attempts max). Please request a new OTP.");
    }

    record.attemptCount += 1;

    const inputHash = this.hashOTP(otp);
    const isDirectMatch = record.otp === otp.trim() || record.code === otp.trim();
    const isHashMatch = record.otpHash === inputHash;

    if (!isDirectMatch && !isHashMatch) {
      this.write(data);
      this.logSecurityEvent({ type: "FAILED_OTP_ATTEMPT", email: record.email, ipAddress, severity: "medium", description: "Invalid OTP code during registration" });
      this.logActivity({ type: "OTP_VERIFICATION", email: record.email, status: "failed", ipAddress, details: "Invalid OTP code" });
      throw new Error(`INVALID_OTP: Invalid verification code. ${OTP_MAX_ATTEMPTS - record.attemptCount} attempts remaining.`);
    }

    const user = data.users.find(u => u.id === record.userId || u.email === input || u.mobile === input);
    if (!user) throw new Error("User record not found.");

    const now = new Date();
    const isOwner = isAuthorizedAdminEmail(user.email);

    user.isVerified = true;
    user.email_verified = true;
    user.role = isOwner ? "ADMIN" : "USER";
    user.access_start = now.toISOString();
    user.access_expires_at = isOwner ? null : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    user.last_login_at = now.toISOString();
    user.last_active_at = now.toISOString();
    user.lastLoginDate = now.toISOString();

    record.used = true;
    record.verifiedAt = now.toISOString();

    const token = "auth_tok_" + Date.now() + "_" + crypto.randomBytes(16).toString("hex");
    data.sessions.push({
      id: "sess_" + Date.now(),
      token,
      userId: user.id,
      createdDate: now.toISOString(),
      last_active_at: now.toISOString(),
      expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });

    this.write(data);

    this.logAudit({ actorUserId: user.id, action: "VERIFY_OTP_SUCCESS", targetUserId: user.id, ipAddress });
    this.logActivity({ type: "REGISTRATION_SUCCESS", userId: user.id, email: user.email, name: user.name, status: "success", ipAddress });
    this.logActivity({ type: "LOGIN_SUCCESS", userId: user.id, email: user.email, name: user.name, status: "success", ipAddress, details: "Auto login post verification" });

    const trialInfo = this.checkUserAccessStatus(user);

    return {
      message: isOwner ? "Master Admin Verified! Permanent access active." : "Account verified successfully! 30-Day Access activated.",
      token,
      user: this.sanitizeUser(user),
      trialInfo
    };
  }

  async logoutUser(token, ipAddress = "127.0.0.1") {
    if (!token) return { success: true, message: "Logged out." };
    const data = this.read();
    const session = data.sessions.find(s => s.token === token);
    const userId = session ? session.userId : "unknown";
    const user = data.users.find(u => u.id === userId);

    data.sessions = data.sessions.filter(s => s.token !== token);
    this.write(data);

    this.logAudit({ actorUserId: userId, action: "LOGOUT", targetUserId: userId, ipAddress });
    this.logActivity({ type: "LOGOUT", userId, email: user ? user.email : null, name: user ? user.name : null, status: "success", ipAddress });

    return { success: true, message: "Successfully logged out and session invalidated." };
  }

  async loginUser({ emailOrMobile, password, ipAddress = "127.0.0.1" }) {
    const data = this.read();
    const input = emailOrMobile.toLowerCase().trim();
    const user = data.users.find(u => u.email === input || u.mobile === input);

    if (!user) {
      this.logSecurityEvent({ type: "FAILED_LOGIN", email: input, ipAddress, severity: "low", description: "Invalid credentials or non-existent account" });
      this.logActivity({ type: "LOGIN_ATTEMPT", email: input, status: "failed", ipAddress, details: "Invalid credentials" });
      throw new Error("Invalid credentials or account does not exist.");
    }

    if (user.accountStatus === "suspended") {
      this.logSecurityEvent({ type: "BANNED_USER_LOGIN_ATTEMPT", userId: user.id, email: user.email, ipAddress, severity: "high", description: "Banned user attempted authentication" });
      this.logActivity({ type: "LOGIN_ATTEMPT", userId: user.id, email: user.email, name: user.name, status: "blocked", ipAddress, details: "Account suspended" });
      throw new Error("Your account has been suspended by the Administrator. Access denied.");
    }

    if (!user.isVerified) {
      this.logActivity({ type: "LOGIN_ATTEMPT", userId: user.id, email: user.email, name: user.name, status: "failed", ipAddress, details: "Unverified account" });
      throw new Error("Account is not verified. Please complete OTP verification.");
    }

    if (user.passwordHash !== this.hashPassword(password)) {
      this.logSecurityEvent({ type: "FAILED_LOGIN", userId: user.id, email: user.email, ipAddress, severity: "medium", description: "Incorrect password" });
      this.logActivity({ type: "LOGIN_ATTEMPT", userId: user.id, email: user.email, name: user.name, status: "failed", ipAddress, details: "Incorrect password" });
      throw new Error("Invalid credentials. Please check your password.");
    }

    if (isAuthorizedAdminEmail(user.email)) {
      user.role = "ADMIN";
      user.access_expires_at = null;
    } else {
      user.role = "USER";
    }

    const trialInfo = this.checkUserAccessStatus(user);
    if (trialInfo.isExpired && user.role !== "ADMIN") {
      this.logActivity({ type: "LOGIN_ATTEMPT", userId: user.id, email: user.email, name: user.name, status: "expired", ipAddress, details: "30-day trial access expired" });
      throw new Error("Access Expired: Your 30-day BRO AI access has expired. Please contact the administrator to renew access.");
    }

    const now = new Date();
    user.last_login_at = now.toISOString();
    user.last_active_at = now.toISOString();
    user.lastLoginDate = now.toISOString();

    const token = "auth_tok_" + Date.now() + "_" + crypto.randomBytes(16).toString("hex");
    data.sessions.push({
      id: "sess_" + Date.now(),
      token,
      userId: user.id,
      createdDate: now.toISOString(),
      last_active_at: now.toISOString(),
      expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });

    this.write(data);

    this.logAudit({ actorUserId: user.id, action: "LOGIN_SUCCESS", targetUserId: user.id, ipAddress });
    this.logActivity({ type: "LOGIN_SUCCESS", userId: user.id, email: user.email, name: user.name, status: "success", ipAddress });

    return {
      message: "Login successful!",
      token,
      user: this.sanitizeUser(user),
      trialInfo
    };
  }

  checkUserAccessStatus(user) {
    const isOwner = isAuthorizedAdminEmail(user.email) || user.role === "ADMIN";
    if (isOwner) {
      return {
        isTrialActive: true,
        isExpired: false,
        daysRemaining: 9999,
        isAdmin: true,
        role: "ADMIN",
        statusText: "Permanent Admin Access",
        showWarning: false,
        warningLevel: "none"
      };
    }

    if (user.accountStatus === "suspended") {
      return {
        isTrialActive: false,
        isExpired: true,
        daysRemaining: 0,
        isAdmin: false,
        role: user.role || "USER",
        statusText: "Account Suspended by Admin",
        showWarning: true,
        warningLevel: "suspended"
      };
    }

    if (!user.access_expires_at && !user.trialStartDate) {
      return {
        isTrialActive: true,
        isExpired: false,
        daysRemaining: 30,
        isAdmin: false,
        role: user.role || "USER",
        statusText: "30-Day Access Active",
        showWarning: false,
        warningLevel: "none"
      };
    }

    const expirationTime = user.access_expires_at 
      ? new Date(user.access_expires_at).getTime()
      : (new Date(user.trialStartDate).getTime() + 30 * 24 * 60 * 60 * 1000);

    const now = Date.now();
    const diffMs = expirationTime - now;
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const isExpired = diffMs <= 0;

    let warningLevel = "none";
    let showWarning = false;

    if (!isExpired) {
      if (daysRemaining <= 1) {
        warningLevel = "1_day";
        showWarning = true;
      } else if (daysRemaining <= 3) {
        warningLevel = "3_days";
        showWarning = true;
      } else if (daysRemaining <= 7) {
        warningLevel = "7_days";
        showWarning = true;
      }
    } else {
      warningLevel = "expired";
      showWarning = true;
    }

    return {
      isTrialActive: !isExpired,
      isExpired,
      daysRemaining,
      isAdmin: false,
      role: user.role || "USER",
      statusText: isExpired ? "30-Day Access Expired" : `${daysRemaining} Days Access Remaining`,
      showWarning,
      warningLevel
    };
  }

  // Comprehensive Admin Dashboard Statistics
  getAdminDashboardStats(adminUser) {
    if (!adminUser || (adminUser.role !== "ADMIN" && !isAuthorizedAdminEmail(adminUser.email))) {
      throw new Error("Access Denied: Admin authorization required.");
    }

    const data = this.read();
    const users = data.users;
    const nowMs = Date.now();

    const total = users.length;
    const verified = users.filter(u => u.isVerified).length;
    const unverified = users.filter(u => !u.isVerified).length;
    const active = users.filter(u => u.accountStatus === "active").length;
    const suspended = users.filter(u => u.accountStatus === "suspended").length;

    // Currently Logged In: Valid session with last_active_at within last 2 minutes
    const twoMinutesAgoMs = nowMs - 2 * 60 * 1000;
    const activeSessionUserIds = new Set(
      data.sessions
        .filter(s => s.last_active_at && new Date(s.last_active_at).getTime() >= twoMinutesAgoMs)
        .map(s => s.userId)
    );
    const currentlyLoggedInCount = users.filter(u => activeSessionUserIds.has(u.id) || (u.last_active_at && new Date(u.last_active_at).getTime() >= twoMinutesAgoMs)).length;

    // Recently Active: Active within last 24 hours
    const oneDayAgoMs = nowMs - 24 * 60 * 60 * 1000;
    const recentlyActiveCount = users.filter(u => u.last_active_at && new Date(u.last_active_at).getTime() >= oneDayAgoMs).length;

    // Auth Statistics
    const activityLogs = data.activity_logs || [];
    const successfulLogins = activityLogs.filter(a => a.type === "LOGIN_SUCCESS").length;
    const failedLogins = activityLogs.filter(a => a.type === "LOGIN_ATTEMPT" && a.status !== "success").length;
    const totalRegistrations = activityLogs.filter(a => a.type === "REGISTRATION_SUCCESS").length;
    const registrationAttempts = activityLogs.filter(a => a.type === "REGISTRATION_ATTEMPT").length;
    const otpVerificationAttempts = activityLogs.filter(a => a.type === "OTP_VERIFICATION").length;
    const failedOtpAttempts = activityLogs.filter(a => a.type === "OTP_VERIFICATION" && a.status !== "success").length;

    // Access Statistics
    const trialActiveCount = users.filter(u => {
      if (isAuthorizedAdminEmail(u.email) || u.role === "ADMIN") return false;
      const status = this.checkUserAccessStatus(u);
      return status.isTrialActive;
    }).length;

    const trialExpiredCount = users.filter(u => {
      if (isAuthorizedAdminEmail(u.email) || u.role === "ADMIN") return false;
      const status = this.checkUserAccessStatus(u);
      return status.isExpired;
    }).length;

    const trialApproachingExpirationCount = users.filter(u => {
      if (isAuthorizedAdminEmail(u.email) || u.role === "ADMIN") return false;
      const status = this.checkUserAccessStatus(u);
      return status.isTrialActive && status.daysRemaining <= 7;
    }).length;

    const adminUsersCount = users.filter(u => isAuthorizedAdminEmail(u.email) || u.role === "ADMIN").length;

    return {
      members: {
        total,
        verified,
        unverified,
        active,
        suspended,
        currentlyLoggedIn: currentlyLoggedInCount,
        recentlyActive: recentlyActiveCount
      },
      authentication: {
        successfulLogins,
        failedLogins,
        recentLogins: activityLogs.filter(a => a.type === "LOGIN_SUCCESS").slice(-10).reverse(),
        recentLogouts: activityLogs.filter(a => a.type === "LOGOUT").slice(-10).reverse(),
        registrationAttempts,
        successfulRegistrations: totalRegistrations,
        failedRegistrations: registrationAttempts - totalRegistrations,
        otpVerificationAttempts,
        failedOtpAttempts
      },
      access: {
        activeTrial: trialActiveCount,
        expiredTrial: trialExpiredCount,
        approachingExpiration: trialApproachingExpirationCount,
        unlimitedAdmins: adminUsersCount,
        authorizedAdmins: getAuthorizedAdminEmails()
      },
      system: {
        totalSessions: data.sessions.length,
        totalAuditLogs: data.audit_logs.length,
        totalActivityLogs: activityLogs.length,
        totalSecurityEvents: (data.security_events || []).length
      }
    };
  }

  // Currently Logged-in Members Detailed List
  getCurrentlyLoggedInMembers(adminUser) {
    if (!adminUser || (adminUser.role !== "ADMIN" && !isAuthorizedAdminEmail(adminUser.email))) {
      throw new Error("Access Denied: Admin authorization required.");
    }
    const data = this.read();
    const nowMs = Date.now();
    const twoMinutesAgoMs = nowMs - 2 * 60 * 1000;
    const activeSessions = data.sessions.filter(s => s.last_active_at && new Date(s.last_active_at).getTime() >= twoMinutesAgoMs);

    const userMap = new Map();
    activeSessions.forEach(s => {
      const u = data.users.find(usr => usr.id === s.userId);
      if (u) {
        if (!userMap.has(u.id)) {
          const access = this.checkUserAccessStatus(u);
          userMap.set(u.id, {
            id: u.id,
            name: u.name,
            email: u.email,
            mobile: u.mobile,
            loginTime: u.last_login_at || s.createdDate,
            lastActivity: u.last_active_at || s.last_active_at,
            sessionStatus: "Online",
            role: u.role || (isAuthorizedAdminEmail(u.email) ? "ADMIN" : "USER"),
            accessStatusText: access.statusText
          });
        }
      }
    });

    return Array.from(userMap.values());
  }

  // Admin User List
  getAdminUserList(adminUser) {
    if (!adminUser || (adminUser.role !== "ADMIN" && !isAuthorizedAdminEmail(adminUser.email))) {
      throw new Error("Access Denied: Admin authorization required.");
    }

    const data = this.read();
    const nowMs = Date.now();
    const twoMinutesAgoMs = nowMs - 2 * 60 * 1000;

    return data.users.map(u => {
      const access = this.checkUserAccessStatus(u);
      const isAdmin = isAuthorizedAdminEmail(u.email) || u.role === "ADMIN";
      const isOnline = u.last_active_at && new Date(u.last_active_at).getTime() >= twoMinutesAgoMs;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        mobile: u.mobile,
        role: u.role || (isAdmin ? "ADMIN" : "USER"),
        isVerified: u.isVerified,
        created_at: u.created_at || u.registrationDate,
        access_start: u.access_start || u.registrationDate,
        access_expires_at: u.access_expires_at,
        last_login_at: u.last_login_at || u.lastLoginDate,
        last_active_at: u.last_active_at,
        accountStatus: u.accountStatus,
        accessStatusText: access.statusText,
        daysRemaining: access.daysRemaining,
        isExpired: access.isExpired,
        isAdmin,
        isOnline: Boolean(isOnline)
      };
    });
  }

  // Individual User Details View
  getUserDetails(adminUser, targetUserId) {
    if (!adminUser || (adminUser.role !== "ADMIN" && !isAuthorizedAdminEmail(adminUser.email))) {
      throw new Error("Access Denied: Admin authorization required.");
    }

    const data = this.read();
    const user = data.users.find(u => u.id === targetUserId);
    if (!user) throw new Error("Target user account not found.");

    const accessInfo = this.checkUserAccessStatus(user);
    const userConversations = db.getConversations(user.id);
    const userMemories = db.getMemories(user.id);
    const userFiles = db.getFiles(user.id);

    const userActivity = (data.activity_logs || []).filter(a => a.userId === user.id || a.email === user.email);
    const userSessions = data.sessions.filter(s => s.userId === user.id);

    return {
      account: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        registrationDate: user.created_at || user.registrationDate,
        accountStatus: user.accountStatus,
        isVerified: user.isVerified,
        role: user.role || (isAuthorizedAdminEmail(user.email) ? "ADMIN" : "USER")
      },
      access: accessInfo,
      activity: {
        lastLogin: user.last_login_at || user.lastLoginDate,
        lastActivity: user.last_active_at,
        activeSessionCount: userSessions.length,
        recentActivityLogs: userActivity.slice(-20).reverse()
      },
      security: {
        banStatus: user.accountStatus === "suspended" ? "Banned/Suspended" : "Active",
        accountRestrictionStatus: user.accountStatus,
        failedAttempts: userActivity.filter(a => a.status !== "success").length
      },
      dataStatistics: {
        conversationCount: userConversations.length,
        memoryCount: userMemories.length,
        fileCount: userFiles.length
      }
    };
  }

  extendUserAccess(adminUser, targetUserId, days = 30, ipAddress = "127.0.0.1") {
    if (!adminUser || (adminUser.role !== "ADMIN" && !isAuthorizedAdminEmail(adminUser.email))) {
      throw new Error("Access Denied: Admin authorization required.");
    }

    const data = this.read();
    const user = data.users.find(u => u.id === targetUserId);
    if (!user) throw new Error("Target user account not found.");

    if (isAuthorizedAdminEmail(user.email) || user.role === "ADMIN") {
      throw new Error("Primary Administrator account has permanent access.");
    }

    const now = new Date().getTime();
    const currentExpiry = user.access_expires_at ? new Date(user.access_expires_at).getTime() : now;
    const baseTime = currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(baseTime + days * 24 * 60 * 60 * 1000).toISOString();

    user.access_expires_at = newExpiry;
    user.accountStatus = "active";

    this.write(data);

    this.logAudit({ actorUserId: adminUser.id, action: "EXTEND_USER_ACCESS", targetUserId, ipAddress, metadata: { daysAdded: days, newExpiry } });

    return { success: true, message: `Successfully extended access for ${user.email} by +${days} days.`, newExpiry };
  }

  banUser(adminUser, targetUserId, ipAddress = "127.0.0.1") {
    return this.performAdminUserAction(adminUser, targetUserId, "suspend", ipAddress);
  }

  unbanUser(adminUser, targetUserId, ipAddress = "127.0.0.1") {
    return this.performAdminUserAction(adminUser, targetUserId, "activate", ipAddress);
  }

  performAdminUserAction(adminUser, targetUserId, action, ipAddress = "127.0.0.1") {
    if (!adminUser || (adminUser.role !== "ADMIN" && !isAuthorizedAdminEmail(adminUser.email))) {
      throw new Error("Access Denied: Admin authorization required.");
    }

    const data = this.read();
    const user = data.users.find(u => u.id === targetUserId);
    if (!user) throw new Error("Target user not found.");

    if (isAuthorizedAdminEmail(user.email) || user.role === "ADMIN") {
      throw new Error("Cannot modify or suspend Administrator accounts.");
    }

    if (action === "suspend" || action === "ban") {
      user.accountStatus = "suspended";
      data.sessions = data.sessions.filter(s => s.userId !== targetUserId);
    } else if (action === "activate" || action === "unban") {
      user.accountStatus = "active";
      const access = this.checkUserAccessStatus(user);
      if (access.isExpired) {
        user.access_expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }
    } else if (action === "revoke") {
      user.access_expires_at = new Date().toISOString();
      data.sessions = data.sessions.filter(s => s.userId !== targetUserId);
    } else if (action === "remove" || action === "delete") {
      data.users = data.users.filter(u => u.id !== targetUserId);
      data.sessions = data.sessions.filter(s => s.userId !== targetUserId);
      data.otps = data.otps.filter(o => o.userId !== targetUserId);
    } else {
      throw new Error("Unknown admin action.");
    }

    this.write(data);

    this.logAudit({ actorUserId: adminUser.id, action: `ADMIN_USER_${action.toUpperCase()}`, targetUserId, ipAddress });

    return { success: true, message: `User action '${action}' completed successfully for ${user.email}.` };
  }

  getLoginActivity(adminUser) {
    if (!adminUser || (adminUser.role !== "ADMIN" && !isAuthorizedAdminEmail(adminUser.email))) {
      throw new Error("Access Denied: Admin authorization required.");
    }
    const data = this.read();
    const logs = data.activity_logs || [];
    return logs
      .filter(l => l.type.startsWith("LOGIN") || l.type === "LOGOUT" || l.type === "OTP_VERIFICATION")
      .slice(-300)
      .reverse();
  }

  getRegistrationActivity(adminUser) {
    if (!adminUser || (adminUser.role !== "ADMIN" && !isAuthorizedAdminEmail(adminUser.email))) {
      throw new Error("Access Denied: Admin authorization required.");
    }
    const data = this.read();
    const logs = data.activity_logs || [];
    return logs
      .filter(l => l.type.startsWith("REGISTRATION") || l.type.startsWith("RESEND") || l.type === "OTP_VERIFICATION")
      .slice(-300)
      .reverse();
  }

  getSecurityEvents(adminUser) {
    if (!adminUser || (adminUser.role !== "ADMIN" && !isAuthorizedAdminEmail(adminUser.email))) {
      throw new Error("Access Denied: Admin authorization required.");
    }
    const data = this.read();
    return (data.security_events || []).slice(-300).reverse();
  }

  getAuditLogs(adminUser) {
    if (!adminUser || (adminUser.role !== "ADMIN" && !isAuthorizedAdminEmail(adminUser.email))) {
      throw new Error("Access Denied: Admin authorization required.");
    }
    const data = this.read();
    return data.audit_logs.slice(-300).reverse();
  }

  // Conversation Management & Export Chat
  getAdminConversations(adminUser) {
    if (!adminUser || (adminUser.role !== "ADMIN" && !isAuthorizedAdminEmail(adminUser.email))) {
      throw new Error("Access Denied: Admin authorization required.");
    }

    const data = this.read();
    const usersMap = new Map(data.users.map(u => [u.id, u]));

    const allConversations = db.read().conversations || [];
    return allConversations.map(c => {
      const user = usersMap.get(c.userId);
      const messages = db.getMessages(c.id);
      return {
        id: c.id,
        userId: c.userId,
        userName: user ? user.name : "Unknown User",
        userEmail: user ? user.email : "Unknown Email",
        title: c.title,
        createdDate: c.createdDate,
        updatedDate: c.updatedDate,
        messageCount: messages.length
      };
    });
  }

  exportUserConversations(adminUser, targetUserId = null, conversationId = null, format = "json") {
    if (!adminUser || (adminUser.role !== "ADMIN" && !isAuthorizedAdminEmail(adminUser.email))) {
      throw new Error("Access Denied: Admin authorization required.");
    }

    const data = this.read();
    let targetConvs = [];

    if (conversationId) {
      const allConvs = db.read().conversations || [];
      targetConvs = allConvs.filter(c => c.id === conversationId);
    } else if (targetUserId) {
      targetConvs = db.getConversations(targetUserId);
    } else {
      targetConvs = db.read().conversations || [];
    }

    const exportData = targetConvs.map(c => {
      const user = data.users.find(u => u.id === c.userId);
      const messages = db.getMessages(c.id);
      return {
        conversationId: c.id,
        user: {
          id: c.userId,
          name: user ? user.name : "Unknown",
          email: user ? user.email : "Unknown"
        },
        title: c.title,
        createdDate: c.createdDate,
        updatedDate: c.updatedDate,
        messages: messages.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.createdDate
        }))
      };
    });

    this.logAudit({
      actorUserId: adminUser.id,
      action: "EXPORT_CHAT",
      targetUserId: targetUserId || "bulk",
      metadata: { conversationId, format, count: exportData.length }
    });

    if (format === "csv") {
      const headers = ["Conversation ID", "User Name", "User Email", "Title", "Role", "Message", "Timestamp"];
      const rows = [];
      exportData.forEach(c => {
        c.messages.forEach(m => {
          rows.push([
            `"${c.conversationId}"`,
            `"${c.user.name}"`,
            `"${c.user.email}"`,
            `"${c.title.replace(/"/g, '""')}"`,
            `"${m.role}"`,
            `"${m.content.replace(/"/g, '""').replace(/\n/g, " ")}"`,
            `"${m.timestamp}"`
          ]);
        });
      });
      return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    }

    if (format === "txt" || format === "text") {
      return exportData.map(c => {
        const msgText = c.messages.map(m => `[${m.timestamp}] ${m.role.toUpperCase()}: ${m.content}`).join("\n");
        return `=== CONVERSATION: ${c.title} (${c.conversationId}) ===\nUser: ${c.user.name} (${c.user.email})\nCreated: ${c.createdDate}\n\n${msgText}\n`;
      }).join("\n=========================================\n\n");
    }

    if (format === "pdf" || format === "html") {
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>BRO AI Chat Export - Admin Control Center</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #070a12; color: #e2e8f0; padding: 32px; }
    h1 { color: #00f0ff; border-bottom: 2px solid rgba(0,240,255,0.3); padding-bottom: 8px; }
    .conv-box { background: #0d1424; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; margin-bottom: 24px; }
    .conv-header { margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px; }
    .msg { margin: 8px 0; padding: 12px; border-radius: 8px; }
    .msg.user { background: rgba(0,240,255,0.08); border-left: 3px solid #00f0ff; }
    .msg.assistant { background: rgba(168,85,247,0.08); border-left: 3px solid #a855f7; }
    .role { font-weight: bold; text-transform: uppercase; font-size: 11px; margin-bottom: 4px; color: #94a3b8; }
  </style>
</head>
<body>
  <h1>BRO AI — Administrator Chat Export Report</h1>
  <p>Export Date: ${new Date().toLocaleString()}</p>
  ${exportData.map(c => `
    <div class="conv-box">
      <div class="conv-header">
        <h2>${c.title}</h2>
        <p><strong>User:</strong> ${c.user.name} (${c.user.email}) | <strong>Conv ID:</strong> ${c.conversationId}</p>
      </div>
      ${c.messages.map(m => `
        <div class="msg ${m.role}">
          <div class="role">${m.role} • ${m.timestamp}</div>
          <div>${m.content}</div>
        </div>
      `).join("")}
    </div>
  `).join("")}
</body>
</html>`;
    }

    return JSON.stringify(exportData, null, 2);
  }

  getAdminSettings(adminUser) {
    if (!adminUser || (adminUser.role !== "ADMIN" && !isAuthorizedAdminEmail(adminUser.email))) {
      throw new Error("Access Denied: Admin authorization required.");
    }
    const data = this.read();
    return data.settings || INITIAL_AUTH_DATA.settings;
  }

  updateAdminSettings(adminUser, newSettings) {
    if (!adminUser || (adminUser.role !== "ADMIN" && !isAuthorizedAdminEmail(adminUser.email))) {
      throw new Error("Access Denied: Admin authorization required.");
    }
    const data = this.read();
    data.settings = { ...data.settings, ...newSettings };
    this.write(data);
    this.logAudit({ actorUserId: adminUser.id, action: "UPDATE_ADMIN_SETTINGS", metadata: newSettings });
    return data.settings;
  }

  generateExcelReport(adminUser) {
    return this.exportUserConversations(adminUser, null, null, "csv");
  }

  sanitizeUser(user) {
    if (!user) return null;
    const { passwordHash, ...clean } = user;
    const isAdmin = isAuthorizedAdminEmail(clean.email) || clean.role === "ADMIN" || clean.isAdmin === true;
    return {
      ...clean,
      role: isAdmin ? "ADMIN" : (clean.role || "USER"),
      isAdmin,
      access_expires_at: isAdmin ? null : clean.access_expires_at,
      accessExpiresAt: isAdmin ? null : (clean.access_expires_at || clean.accessExpiresAt)
    };
  }
}

export const authManager = new AuthManager();
