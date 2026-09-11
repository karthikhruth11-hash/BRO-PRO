import React, { useState, useEffect } from "react";
import { ShieldCheck, Mail, Lock, Phone, User, KeyRound, ArrowRight, CheckCircle2, AlertCircle, Sparkles, LogIn, UserPlus, Cpu, Zap, Star, RefreshCw, HelpCircle } from "lucide-react";

export default function AuthPage({ onAuthSuccess, onNavigateToApp }) {
  const [mode, setMode] = useState("login"); // "login" | "register" | "verify" | "forgot" | "forgot_reset"
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
  const [inboxUrl, setInboxUrl] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  // 1. Registration Handler
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
      if (data.inboxUrl) setInboxUrl(data.inboxUrl);
      setSuccessMsg(data.message || `OTP dispatched to Gmail (${formData.email}) & Mobile (${formData.mobile}).`);
      setResendCooldown(data.expires_in || 300);
      setMode("verify");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. OTP Verification Handler
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
        if (onAuthSuccess) onAuthSuccess(data.user, data.token);
      }
      if (onNavigateToApp) onNavigateToApp();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Resend OTP Handler
  const handleResendOTP = async () => {
    if (resendCooldown > 240) return; // allows resend after 60s
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
      if (data.inboxUrl) setInboxUrl(data.inboxUrl);
      setSuccessMsg(data.message || "Fresh OTP dispatched to Gmail & Mobile.");
      setResendCooldown(data.expires_in || 300);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Request Forgot Password OTP
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
      if (data.inboxUrl) setInboxUrl(data.inboxUrl);
      setSuccessMsg(data.message || "Reset OTP code dispatched!");
      setResendCooldown(data.expires_in || 300);
      setMode("forgot_reset");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 5. Reset Password Handler
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
        setMode("login");
        setSuccessMsg("Password reset successfully! Please sign in with your new password.");
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 6. Login Handler
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
      if (onAuthSuccess) onAuthSuccess(data.user, data.token);
      if (onNavigateToApp) onNavigateToApp();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      background: 'var(--bg-primary, #0b0f19)',
      minHeight: '100%',
      overflowY: 'auto',
      color: 'var(--text-main, #f8fafc)',
      fontFamily: 'inherit'
    }}>
      
      {/* Main Container */}
      <div style={{
        width: '100%',
        maxWidth: '920px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        borderRadius: '16px',
        border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))',
        background: 'var(--bg-card, #131b2e)',
        boxShadow: 'var(--shadow-lg, 0 16px 48px rgba(0, 0, 0, 0.45))',
        overflow: 'hidden'
      }}>
        
        {/* Left Side Visual Showcase Banner */}
        <div style={{
          padding: '36px',
          background: 'var(--bg-secondary, #0e1526)',
          borderRight: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '24px'
        }}>
          <div>
            {/* Logo Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
              <img
                src="/sagw-ai-logo.png"
                alt="SAGW AI"
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '13px',
                  objectFit: 'cover',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  boxShadow: '0 4px 18px rgba(0, 0, 0, 0.5)'
                }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="sagw-brand-title" style={{ fontSize: '1.45rem' }}>
                    <span className="sagw-word">SAGW</span>
                    <span className="ai-word">AI</span>
                  </div>
                  <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.25)', fontFamily: 'monospace', fontWeight: 600 }}>PRO</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', margin: '2px 0 0 0', letterSpacing: '0.03em' }}>From Darkness to Clarity</p>
              </div>
            </div>

            {/* Feature Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary, #3b82f6)', flexShrink: 0 }}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main, #f8fafc)' }}>30-Day Free Trial</h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', lineHeight: 1.45 }}>Instant access to all multi-model features, code generation, and memory stores upon verification.</p>
                </div>
              </div>

              <div style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-success, #10b981)', flexShrink: 0 }}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main, #f8fafc)' }}>Real OTP Email & Mobile Auth</h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', lineHeight: 1.45 }}>Verification codes dispatched to your 10-digit Phone & Gmail. Security codes are encrypted.</p>
                </div>
              </div>

              <div style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.1)', color: '#a855f7', flexShrink: 0 }}>
                  <Zap size={18} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main, #f8fafc)' }}>10-Min Unregistered Limit</h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', lineHeight: 1.45 }}>Unregistered guest sessions expire after 10 minutes, requiring registration for continued access.</p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ paddingTop: '18px', borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Star size={14} color="#f59e0b" fill="#f59e0b" /> Master Admin Authorization</span>
            <span style={{ fontFamily: 'monospace' }}>AUTH_SECURE</span>
          </div>
        </div>

        {/* Right Side Form Panel */}
        <div style={{ padding: '36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          
          {/* Header Mode Navigation Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.08))', paddingBottom: '12px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button
                onClick={() => { setMode("login"); setError(""); setSuccessMsg(""); }}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: mode === "login" ? '2px solid var(--accent-primary, #3b82f6)' : '2px solid transparent',
                  color: mode === "login" ? 'var(--text-main, #f8fafc)' : 'var(--text-muted, #94a3b8)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  paddingBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <LogIn size={16} /> Sign In
              </button>

              <button
                onClick={() => { setMode("register"); setError(""); setSuccessMsg(""); }}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: mode === "register" ? '2px solid var(--accent-primary, #3b82f6)' : '2px solid transparent',
                  color: mode === "register" ? 'var(--text-main, #f8fafc)' : 'var(--text-muted, #94a3b8)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  paddingBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <UserPlus size={16} /> Create Account
              </button>
            </div>

            {onNavigateToApp && (
              <button
                onClick={onNavigateToApp}
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary, #3b82f6)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Back to Workspace <ArrowRight size={14} />
              </button>
            )}
          </div>

          {/* Alert Banners */}
          {error && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#fca5a5', fontSize: '0.8rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#6ee7b7', fontSize: '0.8rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* MODE 1: LOGIN */}
          {mode === "login" && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>Email / Mobile Number</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="var(--text-muted, #64748b)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                  <input
                    type="text"
                    name="email"
                    required
                    placeholder="name@gmail.com or +91 9876543210"
                    value={formData.email}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '10px 12px 10px 38px', background: 'var(--bg-input, rgba(0,0,0,0.3))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))', borderRadius: '8px', color: 'var(--text-main, #f8fafc)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Password</label>
                  <button
                    type="button"
                    onClick={() => { setMode("forgot"); setError(""); setSuccessMsg(""); }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary, #3b82f6)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="var(--text-muted, #64748b)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                  <input
                    type="password"
                    name="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '10px 12px 10px 38px', background: 'var(--bg-input, rgba(0,0,0,0.3))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))', borderRadius: '8px', color: 'var(--text-main, #f8fafc)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '6px',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? "Signing In..." : "Sign In to Account"}
                <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* MODE 2: REGISTER */}
          {mode === "register" && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="var(--text-muted, #64748b)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Karthik User"
                    value={formData.name}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '9px 12px 9px 38px', background: 'var(--bg-input, rgba(0,0,0,0.3))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))', borderRadius: '8px', color: 'var(--text-main, #f8fafc)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>Valid Email Address (Gmail / Domain)</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="var(--text-muted, #64748b)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="user@gmail.com"
                    value={formData.email}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '9px 12px 9px 38px', background: 'var(--bg-input, rgba(0,0,0,0.3))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))', borderRadius: '8px', color: 'var(--text-main, #f8fafc)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>Valid Mobile Number (10 Digits)</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} color="var(--text-muted, #64748b)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                  <input
                    type="tel"
                    name="mobile"
                    required
                    placeholder="+91 9876543210"
                    value={formData.mobile}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '9px 12px 9px 38px', background: 'var(--bg-input, rgba(0,0,0,0.3))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))', borderRadius: '8px', color: 'var(--text-main, #f8fafc)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>Password</label>
                  <input
                    type="password"
                    name="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-input, rgba(0,0,0,0.3))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))', borderRadius: '8px', color: 'var(--text-main, #f8fafc)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>Confirm</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-input, rgba(0,0,0,0.3))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))', borderRadius: '8px', color: 'var(--text-main, #f8fafc)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '6px',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? "Sending OTP to Mobile & Gmail..." : "Register & Send Real OTP"}
                <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* MODE 3: REAL OTP VERIFICATION */}
          {mode === "verify" && (
            <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '0.82rem', color: 'var(--text-secondary, #cbd5e1)' }}>
                <p style={{ margin: '0 0 6px 0', fontWeight: 600, color: 'var(--accent-primary, #3b82f6)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={16} /> Verification Code Sent to Inbox
                </p>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', lineHeight: 1.5 }}>
                  A 6-digit real-time OTP code has been dispatched to:<br />
                  📧 Gmail: <strong style={{ color: 'var(--text-main, #f8fafc)' }}>{pendingEmail || formData.email}</strong><br />
                  📱 Mobile: <strong style={{ color: 'var(--text-main, #f8fafc)' }}>{pendingMobile || formData.mobile}</strong><br />
                  <span style={{ color: 'var(--accent-primary, #3b82f6)', fontSize: '0.75rem', marginTop: '6px', display: 'inline-block' }}>Please check your Gmail inbox or SMS text messages for your 6-digit code.</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>Enter 6-Digit OTP Code</label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={18} color="var(--text-muted, #64748b)" style={{ position: 'absolute', left: '14px', top: '12px' }} />
                  <input
                    type="text"
                    name="otp"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={formData.otp}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '12px 12px 12px 42px', background: 'var(--bg-input, rgba(0,0,0,0.3))', border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.18))', borderRadius: '8px', color: 'var(--accent-primary, #3b82f6)', fontSize: '1.2rem', letterSpacing: '6px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
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
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{
                    flex: 2,
                    padding: '11px',
                    borderRadius: '8px',
                    background: 'var(--accent-success, #10b981)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? "Verifying..." : "Verify & Activate Trial"}
                  <CheckCircle2 size={16} />
                </button>
              </div>
            </form>
          )}

          {/* MODE 4: FORGOT PASSWORD - REQUEST OTP */}
          {mode === "forgot" && (
            <form onSubmit={handleRequestForgotOTP} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted, #94a3b8)', margin: 0, lineHeight: 1.5 }}>
                Enter your registered Email or Mobile number below. We will send a 6-digit password reset OTP to both your Gmail and Mobile number.
              </p>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>Registered Email / Mobile</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="var(--text-muted, #64748b)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                  <input
                    type="text"
                    name="email"
                    required
                    placeholder="user@gmail.com or +91 9876543210"
                    value={formData.email}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '10px 12px 10px 38px', background: 'var(--bg-input, rgba(0,0,0,0.3))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))', borderRadius: '8px', color: 'var(--text-main, #f8fafc)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? "Sending Reset Code..." : "Send Reset OTP"}
                <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* MODE 5: FORGOT PASSWORD - RESET */}
          {mode === "forgot_reset" && (
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', fontSize: '0.78rem', color: 'var(--accent-warning, #fbbf24)' }}>
                Reset OTP dispatched to Gmail & Mobile for <strong>{pendingEmail || formData.email}</strong>.
              </div>

              {activeOtpCode && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--accent-primary, #3b82f6)', fontWeight: 600 }}>Active Reset Code: <strong>{activeOtpCode}</strong></span>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, otp: activeOtpCode }))}
                    style={{ background: 'var(--accent-primary, #3b82f6)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.72rem', fontWeight: 600, padding: '4px 10px', cursor: 'pointer' }}
                  >
                    Auto-Fill Code
                  </button>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>6-Digit Reset OTP</label>
                <input
                  type="text"
                  name="otp"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={formData.otp}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-input, rgba(0,0,0,0.3))', border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.18))', borderRadius: '8px', color: 'var(--accent-warning, #fbbf24)', fontSize: '1.1rem', letterSpacing: '4px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  required
                  placeholder="At least 6 characters"
                  value={formData.newPassword}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input, rgba(0,0,0,0.3))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))', borderRadius: '8px', color: 'var(--text-main, #f8fafc)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: '8px',
                  background: 'var(--accent-success, #10b981)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? "Updating Password..." : "Update Password & Sign In"}
                <CheckCircle2 size={16} />
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

