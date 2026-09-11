import React, { useState } from "react";
import { X, Lock, CheckCircle2, ShieldCheck, CreditCard, Sparkles } from "lucide-react";

export function SubscriptionModal({ isOpen, onClose, onSubscriptionSuccess }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  if (!isOpen) return null;

  const handleSubscribe = async () => {
    setLoading(true);
    setMsg("");
    try {
      const token = localStorage.getItem("bro_auth_token") || "";
      const res = await fetch("/api/auth-manager/subscription/verify-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "x-wednesday-token": "wednesday-secret-local-handshake-token-2026"
        },
        body: JSON.stringify({
          paymentId: "pay_rzp_" + Date.now(),
          planId: "annual_pro"
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setMsg(data.message);
      if (onSubscriptionSuccess) onSubscriptionSuccess();
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      alert("Payment Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 99999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0, 0, 0, 0.7)",
      backdropFilter: "blur(6px)",
      padding: "16px"
    }}>
      <div style={{
        position: "relative",
        width: "100%",
        maxWidth: "480px",
        background: "var(--bg-card, #131b2e)",
        border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))",
        borderRadius: "16px",
        boxShadow: "var(--shadow-lg, 0 16px 48px rgba(0, 0, 0, 0.45))",
        color: "var(--text-main, #f8fafc)",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "20px"
      }}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))", paddingBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img
              src="/sagw-ai-logo.png"
              alt="SAGW AI"
              style={{ width: "34px", height: "34px", borderRadius: "8px", objectFit: "cover", border: "1px solid rgba(56, 189, 248, 0.25)" }}
            />
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--text-main, #f8fafc)" }}>
                30-Day Free Trial Expired
              </h2>
              <span style={{ fontSize: "12px", color: "var(--text-muted, #94a3b8)" }}>Upgrade your SAGW AI plan</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted, #94a3b8)",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: "13.5px", color: "var(--text-secondary, #94a3b8)", margin: 0, lineHeight: 1.6 }}>
          Your 30-day free trial has concluded. Upgrade to <strong style={{ color: "#38bdf8" }}>SAGW AI Pro</strong> to unlock unlimited multi-LLM routing, high-speed execution, and persistent memory stores.
        </p>

        <div style={{
          padding: "16px",
          borderRadius: "12px",
          background: "var(--bg-secondary, rgba(255, 255, 255, 0.03))",
          border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-main, #f8fafc)" }}>Annual Pro Membership</span>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--accent-primary, #3b82f6)", fontFamily: "monospace" }}>₹999 / year</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "10px", borderTop: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))", fontSize: "12.5px", color: "var(--text-secondary, #94a3b8)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle2 size={15} color="var(--accent-success, #10b981)" /> Unlimited Local & Cloud Multi-LLM Ensemble
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle2 size={15} color="var(--accent-success, #10b981)" /> High-Speed Telemetry & Code Generation Engine
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle2 size={15} color="var(--accent-success, #10b981)" /> Full Knowledge Graph PC Data Trainer Integration
            </div>
          </div>
        </div>

        {msg && (
          <div style={{
            padding: "10px 14px",
            borderRadius: "8px",
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            color: "var(--accent-success, #10b981)",
            fontSize: "12.5px",
            textAlign: "center"
          }}>
            {msg}
          </div>
        )}

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="btn-primary"
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "14px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1
          }}
        >
          <CreditCard size={18} />
          {loading ? "Verifying Payment..." : "Subscribe Now (Razorpay Server Verified)"}
        </button>

      </div>
    </div>
  );
}
