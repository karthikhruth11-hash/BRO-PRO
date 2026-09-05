import React from "react";
import { AdminControlCenter } from "./AdminControlCenter";

class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Admin Control Center Error Boundary Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: "40px",
          color: "#f87171",
          background: "#070a12",
          width: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}>
          <h2 style={{ color: "#ef4444", marginBottom: "12px", fontSize: "22px" }}>Admin Control Center Warning</h2>
          <p style={{ color: "#94a3b8", maxWidth: "550px", textAlign: "center", lineHeight: 1.5, fontSize: "14px" }}>
            {this.state.error?.message || "An unexpected error occurred while loading dashboard metrics."}
          </p>
          <div style={{ display: "flex", gap: "14px", marginTop: "24px" }}>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                padding: "10px 22px",
                borderRadius: "8px",
                background: "rgba(0,240,255,0.2)",
                border: "1px solid #00f0ff",
                color: "#00f0ff",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "14px"
              }}
            >
              Retry Load
            </button>
            <button
              onClick={this.props.onClose}
              style={{
                padding: "10px 22px",
                borderRadius: "8px",
                background: "rgba(239,68,68,0.2)",
                border: "1px solid #ef4444",
                color: "#ef4444",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "14px"
              }}
            >
              Close & Return to Chat
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function AdminDashboardModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: "100vw",
      height: "100vh",
      zIndex: 999999,
      background: "#070a12",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column"
    }}>
      <AdminErrorBoundary onClose={onClose}>
        <AdminControlCenter onClose={onClose} />
      </AdminErrorBoundary>
    </div>
  );
}
