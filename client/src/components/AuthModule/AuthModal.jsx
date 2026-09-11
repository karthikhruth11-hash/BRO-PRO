import React, { useState, useEffect } from "react";
import { X, Lock, Mail, Phone, User, ShieldCheck, KeyRound, ArrowRight, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

export function AuthModal({ isOpen, onClose, onAuthSuccess, initialTab = "login" }) {
  const [tab, setTab] = useState(initialTab); // "login" | "register" | "verify" | "forgot" | "forgot_reset"
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    otp: "",
    newPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingMobile, setPendingMobile] = useState("");
  const [otpRequestId, setOtpRequestId] = useState("");
  const [activeOtpCode, setActiveOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Password and Confirm Password do not match.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth-manager/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wednesday-token": "wednesday-secret-local-handshake-token-2026" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setPendingEmail(data.email || formData.email);
      setPendingMobile(data.mobile || formData.mobile);
      if (data.otp_request_id) setOtpRequestId(data.otp_request_id);
      if (data.otpCode) setActiveOtpCode(data.otpCode);
      setSuccessMsg(data.message || `OTP dispatched to Gmail (${formData.email}) & Mobile (${formData.mobile}).`);
      setResendCooldown(data.expires_in || 300);
      setTab("verify");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth-manager/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wednesday-token": "wednesday-secret-local-handshake-token-2026" },
        body: JSON.stringify({
          email: pendingEmail || formData.email,
          otp_request_id: otpRequestId || undefined,
          otp: formData.otp
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setSuccessMsg(data.message);
      if (data.token) {
        localStorage.setItem("bro_auth_token", data.token);
        onAuthSuccess(data.user, data.token);
      }
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 240) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth-manager/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wednesday-token": "wednesday-secret-local-handshake-token-2026" },
        body: JSON.stringify({
          emailOrMobile: pendingEmail || formData.email || pendingMobile || formData.mobile
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      if (data.otp_request_id) setOtpRequestId(data.otp_request_id);
      if (data.otpCode) setActiveOtpCode(data.otpCode);
      setSuccessMsg(data.message || "Fresh OTP dispatched to Gmail & Mobile.");
      setResendCooldown(data.expires_in || 300);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestForgotOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth-manager/forgot-password/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wednesday-token": "wednesday-secret-local-handshake-token-2026" },
        body: JSON.stringify({
          emailOrMobile: formData.email
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setPendingEmail(data.email || formData.email);
      setPendingMobile(data.mobile || formData.mobile);
      if (data.otp_request_id) setOtpRequestId(data.otp_request_id);
      if (data.otpCode) setActiveOtpCode(data.otpCode);
      setSuccessMsg(data.message || "Reset OTP code dispatched!");
      setResendCooldown(data.expires_in || 300);
      setTab("forgot_reset");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth-manager/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wednesday-token": "wednesday-secret-local-handshake-token-2026" },
        body: JSON.stringify({
          emailOrMobile: pendingEmail || formData.email,
          otp_request_id: otpRequestId || undefined,
          otp: formData.otp,
          newPassword: formData.newPassword
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setSuccessMsg(data.message);
      setTimeout(() => {
        setTab("login");
        setSuccessMsg("Password reset successfully! Please sign in with your new password.");
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth-manager/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wednesday-token": "wednesday-secret-local-handshake-token-2026" },
        body: JSON.stringify({
          emailOrMobile: formData.email,
          password: formData.password
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      localStorage.setItem("bro_auth_token", data.token);
      onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(6px)',
      padding: '20px'
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '440px',
        background: 'var(--bg-card, #131b2e)',
        border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))',
        borderRadius: '16px',
        boxShadow: 'var(--shadow-lg, 0 16px 48px rgba(0, 0, 0, 0.45))',
        overflow: 'hidden',
        color: 'var(--text-main, #f8fafc)',
        fontFamily: 'inherit'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))', background: 'var(--bg-secondary, #0e1526)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src="/sagw-ai-logo.png"
              alt="SAGW AI"
              style={{ width: '34px', height: '34px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(56, 189, 248, 0.25)' }}
            />
            <div>
              <h2 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main, #f8fafc)' }}>
                {tab === "login" && "Sign In to SAGW AI"}
                {tab === "register" && "Create SAGW AI Account"}
                {tab === "verify" && "Real OTP Verification"}
                {tab === "forgot" && "Forgot Password"}
                {tab === "forgot_reset" && "Reset Password"}
              </h2>
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)' }}>From Darkness to Clarity • 30-Day Free Trial</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted, #94a3b8)', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        {(tab === "login" || tab === "register") && (
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.08))', background: 'rgba(0,0,0,0.15)' }}>
            <button
              onClick={() => { setTab("login"); setError(""); setSuccessMsg(""); }}
              style={{ flex: 1, padding: '12px', background: tab === "login" ? 'var(--bg-card, #131b2e)' : 'transparent', border: 'none', borderBottom: tab === "login" ? '2px solid var(--accent-primary, #3b82f6)' : '2px solid transparent', color: tab === "login" ? 'var(--accent-primary, #3b82f6)' : 'var(--text-muted, #94a3b8)', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
            >
              Sign In
            </button>
            <button
              onClick={() => { setTab("register"); setError(""); setSuccessMsg(""); }}
              style={{ flex: 1, padding: '12px', background: tab === "register" ? 'var(--bg-card, #131b2e)' : 'transparent', border: 'none', borderBottom: tab === "register" ? '2px solid var(--accent-primary, #3b82f6)' : '2px solid transparent', color: tab === "register" ? 'var(--accent-primary, #3b82f6)' : 'var(--text-muted, #94a3b8)', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
            >
              Register (30 Days Free)
            </button>
          </div>
        )}

        {/* Form Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {error && (
            <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#fca5a5', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={15} color="#ef4444" style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#6ee7b7', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={15} color="#10b981" style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* LOGIN */}
          {tab === "login" && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '4px' }}>Email / Mobile Number</label>
                <input
                  type="text"
                  name="email"
                  required
                  placeholder="name@gmail.com or +91 9876543210"
                  value={formData.email}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input, rgba(0,0,0,0.3))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))', borderRadius: '8px', color: 'var(--text-main, #f8fafc)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Password</label>
                  <button
                    type="button"
                    onClick={() => { setTab("forgot"); setError(""); setSuccessMsg(""); }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary, #3b82f6)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input, rgba(0,0,0,0.3))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))', borderRadius: '8px', color: 'var(--text-main, #f8fafc)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%', padding: '11px', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '6px', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? "Signing In..." : "Sign In"}
                <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* REGISTER */}
          {tab === "register" && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '3px' }}>Full Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Karthik User"
                  value={formData.name}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-input, rgba(0,0,0,0.3))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))', borderRadius: '8px', color: 'var(--text-main, #f8fafc)', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '3px' }}>Valid Email (Gmail / Domain)</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="user@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-input, rgba(0,0,0,0.3))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))', borderRadius: '8px', color: 'var(--text-main, #f8fafc)', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '3px' }}>Valid Mobile Number (10 Digits)</label>
                <input
                  type="tel"
                  name="mobile"
                  required
                  placeholder="+91 9876543210"
                  value={formData.mobile}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-input, rgba(0,0,0,0.3))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))', borderRadius: '8px', color: 'var(--text-main, #f8fafc)', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '3px' }}>Password</label>
                  <input
                    type="password"
                    name="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-input, rgba(0,0,0,0.3))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))', borderRadius: '8px', color: 'var(--text-main, #f8fafc)', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '3px' }}>Confirm</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-input, rgba(0,0,0,0.3))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))', borderRadius: '8px', color: 'var(--text-main, #f8fafc)', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%', padding: '11px', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '6px', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? "Sending OTP to Mobile & Gmail..." : "Register & Send Real OTP"}
                <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* VERIFY */}
          {tab === "verify" && (
            <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '0.78rem', color: 'var(--text-secondary, #cbd5e1)', lineHeight: 1.5 }}>
                <p style={{ margin: '0 0 4px 0', fontWeight: 600, color: 'var(--accent-primary, #3b82f6)' }}>📧 OTP Sent to Your Inbox</p>
                Gmail: <strong style={{ color: 'var(--text-main, #f8fafc)' }}>{pendingEmail || formData.email}</strong><br />
                Mobile: <strong style={{ color: 'var(--text-main, #f8fafc)' }}>{pendingMobile || formData.mobile}</strong><br />
                <span style={{ color: 'var(--accent-warning, #f59e0b)', fontSize: '0.72rem', marginTop: '4px', display: 'inline-block' }}>Open your Gmail or SMS app to view your 6-digit code.</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '4px' }}>Enter 6-Digit OTP</label>
                <input
                  type="text"
                  name="otp"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={formData.otp}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-input, rgba(0,0,0,0.3))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.18))', borderRadius: '8px', color: 'var(--accent-primary, #3b82f6)', fontSize: '1.2rem', letterSpacing: '6px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  disabled={loading || resendCooldown > 0}
                  onClick={handleResendOTP}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: resendCooldown > 0 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                    borderRadius: '8px',
                    color: resendCooldown > 0 ? 'var(--text-muted, #64748b)' : 'var(--accent-primary, #3b82f6)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <RefreshCw size={13} />
                  {resendCooldown > 0 ? `${resendCooldown}s` : "Resend"}
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{ flex: 2, padding: '11px', borderRadius: '8px', background: 'var(--accent-success, #10b981)', border: 'none', color: '#fff', fontSize: '0.88rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? "Verifying..." : "Verify & Activate"}
                  <CheckCircle2 size={16} />
                </button>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD - REQUEST OTP */}
          {tab === "forgot" && (
            <form onSubmit={handleRequestForgotOTP} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', margin: 0, lineHeight: 1.5 }}>
                Enter your registered Email or Mobile number below to receive a password reset OTP.
              </p>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '4px' }}>Registered Email / Mobile</label>
                <input
                  type="text"
                  name="email"
                  required
                  placeholder="user@gmail.com or +91 9876543210"
                  value={formData.email}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input, rgba(0,0,0,0.3))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))', borderRadius: '8px', color: 'var(--text-main, #f8fafc)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%', padding: '11px', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? "Sending..." : "Send Reset OTP"}
                <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD - RESET */}
          {tab === "forgot_reset" && (
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeOtpCode && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary, #3b82f6)', fontWeight: 600 }}>Active Reset Code: <strong>{activeOtpCode}</strong></span>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, otp: activeOtpCode }))}
                    style={{ background: 'var(--accent-primary, #3b82f6)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.7rem', fontWeight: 600, padding: '3px 8px', cursor: 'pointer' }}
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '3px' }}>6-Digit Reset OTP</label>
                <input
                  type="text"
                  name="otp"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={formData.otp}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-input, rgba(0,0,0,0.3))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.18))', borderRadius: '8px', color: 'var(--accent-warning, #f59e0b)', fontSize: '1rem', letterSpacing: '4px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '3px' }}>New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  required
                  placeholder="At least 6 characters"
                  value={formData.newPassword}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-input, rgba(0,0,0,0.3))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))', borderRadius: '8px', color: 'var(--text-main, #f8fafc)', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%', padding: '11px', borderRadius: '8px', background: 'var(--accent-success, #10b981)', border: 'none', color: '#fff', fontSize: '0.88rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? "Updating..." : "Update Password & Sign In"}
                <CheckCircle2 size={16} />
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}

