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
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(16px)',
      padding: '20px'
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '440px',
        background: '#0d111a',
        border: '1px solid rgba(0, 240, 255, 0.4)',
        borderRadius: '24px',
        boxShadow: '0 0 50px rgba(0, 240, 255, 0.2)',
        overflow: 'hidden',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: '#070a12' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '12px', background: 'linear-gradient(135deg, #00f0ff 0%, #3b82f6 100%)', color: '#070a12', display: 'flex' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#00f0ff' }}>
                {tab === "login" && "Sign In to BRO AI"}
                {tab === "register" && "Create Account"}
                {tab === "verify" && "Real OTP Verification"}
                {tab === "forgot" && "Forgot Password"}
                {tab === "forgot_reset" && "Reset Password"}
              </h2>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8' }}>30-Day Free Trial • Real Mobile & Email OTP</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        {(tab === "login" || tab === "register") && (
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(7,10,18,0.4)' }}>
            <button
              onClick={() => { setTab("login"); setError(""); setSuccessMsg(""); }}
              style={{ flex: 1, padding: '12px', background: tab === "login" ? '#0d111a' : 'transparent', border: 'none', borderBottom: tab === "login" ? '2px solid #00f0ff' : '2px solid transparent', color: tab === "login" ? '#00f0ff' : '#94a3b8', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
            >
              Sign In
            </button>
            <button
              onClick={() => { setTab("register"); setError(""); setSuccessMsg(""); }}
              style={{ flex: 1, padding: '12px', background: tab === "register" ? '#0d111a' : 'transparent', border: 'none', borderBottom: tab === "register" ? '2px solid #00f0ff' : '2px solid transparent', color: tab === "register" ? '#00f0ff' : '#94a3b8', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
            >
              Register (30 Days Free)
            </button>
          </div>
        )}

        {/* Form Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {error && (
            <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(153, 27, 27, 0.4)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={14} color="#f87171" style={{ shrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(6, 78, 59, 0.4)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#6ee7b7', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={14} color="#34d399" style={{ shrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* LOGIN */}
          {tab === "login" && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Email / Mobile Number</label>
                <input
                  type="text"
                  name="email"
                  required
                  placeholder="name@gmail.com or +91 9876543210"
                  value={formData.email}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px 12px', background: '#070a12', border: '1px solid #1e293b', borderRadius: '10px', color: '#fff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Password</label>
                  <button
                    type="button"
                    onClick={() => { setTab("forgot"); setError(""); setSuccessMsg(""); }}
                    style={{ background: 'none', border: 'none', color: '#00f0ff', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
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
                  style={{ width: '100%', padding: '10px 12px', background: '#070a12', border: '1px solid #1e293b', borderRadius: '10px', color: '#fff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '12px', background: 'linear-gradient(90deg, #00f0ff 0%, #3b82f6 100%)', border: 'none', borderRadius: '10px', color: '#070a12', fontSize: '0.88rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '6px' }}
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
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px' }}>Full Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Karthik User"
                  value={formData.name}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '8px 12px', background: '#070a12', border: '1px solid #1e293b', borderRadius: '10px', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px' }}>Valid Email (Gmail / Domain)</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="user@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '8px 12px', background: '#070a12', border: '1px solid #1e293b', borderRadius: '10px', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px' }}>Valid Mobile Number (10 Digits)</label>
                <input
                  type="tel"
                  name="mobile"
                  required
                  placeholder="+91 9876543210"
                  value={formData.mobile}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '8px 12px', background: '#070a12', border: '1px solid #1e293b', borderRadius: '10px', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px' }}>Password</label>
                  <input
                    type="password"
                    name="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px 12px', background: '#070a12', border: '1px solid #1e293b', borderRadius: '10px', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px' }}>Confirm</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '8px 12px', background: '#070a12', border: '1px solid #1e293b', borderRadius: '10px', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '12px', background: 'linear-gradient(90deg, #00f0ff 0%, #3b82f6 100%)', border: 'none', borderRadius: '10px', color: '#070a12', fontSize: '0.88rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '4px' }}
              >
                {loading ? "Sending OTP to Mobile & Gmail..." : "Register & Send Real OTP"}
                <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* VERIFY */}
          {tab === "verify" && (
            <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(0, 240, 255, 0.08)', border: '1px solid rgba(0, 240, 255, 0.25)', fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                <p style={{ margin: '0 0 4px 0', fontWeight: 700, color: '#00f0ff' }}>📧 OTP Sent to Your Inbox</p>
                Gmail: <strong style={{ color: '#fff' }}>{pendingEmail || formData.email}</strong><br />
                Mobile: <strong style={{ color: '#fff' }}>{pendingMobile || formData.mobile}</strong><br />
                <span style={{ color: '#f59e0b', fontSize: '0.72rem', marginTop: '2px', display: 'inline-block' }}>Open your Gmail or SMS app to view your 6-digit code.</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Enter 6-Digit OTP</label>
                <input
                  type="text"
                  name="otp"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={formData.otp}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px', background: '#070a12', border: '1px solid rgba(0,240,255,0.5)', borderRadius: '10px', color: '#00f0ff', fontSize: '1.2rem', letterSpacing: '6px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
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
                    background: resendCooldown > 0 ? '#1e293b' : 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '10px',
                    color: resendCooldown > 0 ? '#64748b' : '#38bdf8',
                    fontSize: '0.75rem',
                    fontWeight: 700,
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
                  style={{ flex: 2, padding: '12px', background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.88rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
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
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>
                Enter your registered Email or Mobile number below to receive a password reset OTP.
              </p>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Registered Email / Mobile</label>
                <input
                  type="text"
                  name="email"
                  required
                  placeholder="user@gmail.com or +91 9876543210"
                  value={formData.email}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px 12px', background: '#070a12', border: '1px solid #1e293b', borderRadius: '10px', color: '#fff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '12px', background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.88rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', background: 'rgba(0, 240, 255, 0.15)', border: '1px solid rgba(0, 240, 255, 0.4)' }}>
                  <span style={{ fontSize: '0.75rem', color: '#00f0ff', fontWeight: 600 }}>Active Reset Code: <strong>{activeOtpCode}</strong></span>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, otp: activeOtpCode }))}
                    style={{ background: '#00f0ff', border: 'none', borderRadius: '6px', color: '#000', fontSize: '0.7rem', fontWeight: 800, padding: '3px 8px', cursor: 'pointer' }}
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px' }}>6-Digit Reset OTP</label>
                <input
                  type="text"
                  name="otp"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={formData.otp}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '8px 12px', background: '#070a12', border: '1px solid rgba(245, 158, 11, 0.5)', borderRadius: '10px', color: '#fbbf24', fontSize: '1rem', letterSpacing: '4px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px' }}>New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  required
                  placeholder="At least 6 characters"
                  value={formData.newPassword}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '8px 12px', background: '#070a12', border: '1px solid #1e293b', borderRadius: '10px', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '12px', background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.88rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
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

