import React, { useState, useEffect } from "react";
import {
  Users, Activity, Shield, Key, FileText, Download, UserX, UserCheck,
  Trash2, RefreshCw, Search, Filter, Clock, ShieldAlert, CheckCircle,
  X, AlertTriangle, Cpu, HardDrive, Database, Settings, LogOut, MessageSquare,
  Radio, Zap, FileSpreadsheet, Lock, Eye, Calendar, UserPlus, Server, ChevronRight
} from "lucide-react";

export function AdminControlCenter({ onClose }) {
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" | "users" | "online" | "login" | "registration" | "conversations" | "exports" | "access" | "security" | "audit" | "system" | "settings"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState("");

  // Data states
  const [stats, setStats] = useState(null);
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loginActivity, setLoginActivity] = useState([]);
  const [registrationActivity, setRegistrationActivity] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [settings, setSettings] = useState(null);

  // Selected User Modal / Detail state
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetUser, setDeleteTargetUser] = useState(null);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [extendDaysMap, setExtendDaysMap] = useState({});

  // Export selection state
  const [exportUserId, setExportUserId] = useState("");
  const [exportFormat, setExportFormat] = useState("json");

  const token = localStorage.getItem("bro_auth_token") || "";

  const DEFAULT_STATS = {
    members: { total: 1, verified: 1, unverified: 0, active: 1, suspended: 0, currentlyLoggedIn: 1, recentlyActive: 1 },
    authentication: { successfulLogins: 1, failedLogins: 0, recentLogins: [], recentLogouts: [], registrationAttempts: 1, successfulRegistrations: 1, failedRegistrations: 0, otpVerificationAttempts: 1, failedOtpAttempts: 0 },
    access: { activeTrial: 0, expiredTrial: 0, approachingExpiration: 0, unlimitedAdmins: 1, authorizedAdmins: ["karthikhruth@gmail.com"] },
    system: { totalSessions: 1, totalAuditLogs: 1, totalActivityLogs: 1, totalSecurityEvents: 0 }
  };

  const currentStats = stats || DEFAULT_STATS;

  const fetchAllAdminData = async () => {
    setLoading(true);
    setError("");
    try {
      const headers = {
        "Authorization": `Bearer ${token}`,
        "x-wednesday-token": "wednesday-secret-local-handshake-token-2026"
      };

      const safeFetchJson = async (url) => {
        try {
          const res = await fetch(url, { headers });
          if (!res.ok) return null;
          return await res.json();
        } catch (e) {
          return null;
        }
      };

      const [
        statsData, onlineData, usersData, loginData, regData, convData, secData, auditData, setData
      ] = await Promise.all([
        safeFetchJson("/api/auth-manager/admin/dashboard"),
        safeFetchJson("/api/auth-manager/admin/currently-logged-in"),
        safeFetchJson("/api/auth-manager/admin/users"),
        safeFetchJson("/api/auth-manager/admin/login-activity"),
        safeFetchJson("/api/auth-manager/admin/registration-activity"),
        safeFetchJson("/api/auth-manager/admin/conversations"),
        safeFetchJson("/api/auth-manager/admin/security-events"),
        safeFetchJson("/api/auth-manager/admin/audit-logs"),
        safeFetchJson("/api/auth-manager/admin/settings")
      ]);

      if (statsData && statsData.success && statsData.stats) setStats(statsData.stats);
      if (onlineData && onlineData.success) setOnlineMembers(onlineData.members || []);
      if (usersData && usersData.success) setUsers(usersData.users || []);
      if (loginData && loginData.success) setLoginActivity(loginData.loginActivity || []);
      if (regData && regData.success) setRegistrationActivity(regData.registrationActivity || []);
      if (convData && convData.success) setConversations(convData.conversations || []);
      if (secData && secData.success) setSecurityEvents(secData.securityEvents || []);
      if (auditData && auditData.success) setAuditLogs(auditData.auditLogs || []);
      if (setData && setData.success) setSettings(setData.settings || {});

    } catch (err) {
      console.warn("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAdminData();
    const interval = setInterval(fetchAllAdminData, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchUserDetails = async (userId) => {
    setSelectedUserId(userId);
    setLoadingDetails(true);
    setUserDetails(null);
    try {
      const res = await fetch(`/api/auth-manager/admin/users/${userId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "x-wednesday-token": "wednesday-secret-local-handshake-token-2026"
        }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setUserDetails(data.userDetails);
    } catch (err) {
      alert("Error loading user details: " + err.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleBanUser = async (userId) => {
    try {
      const res = await fetch(`/api/auth-manager/admin/users/${userId}/ban`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "x-wednesday-token": "wednesday-secret-local-handshake-token-2026"
        }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setActionMsg(data.message);
      fetchAllAdminData();
      if (selectedUserId === userId) fetchUserDetails(userId);
      setTimeout(() => setActionMsg(""), 3500);
    } catch (err) {
      alert("Error banning user: " + err.message);
    }
  };

  const handleUnbanUser = async (userId) => {
    try {
      const res = await fetch(`/api/auth-manager/admin/users/${userId}/unban`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "x-wednesday-token": "wednesday-secret-local-handshake-token-2026"
        }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setActionMsg(data.message);
      fetchAllAdminData();
      if (selectedUserId === userId) fetchUserDetails(userId);
      setTimeout(() => setActionMsg(""), 3500);
    } catch (err) {
      alert("Error unbanning user: " + err.message);
    }
  };

  const handleExtendAccess = async (userId) => {
    const days = parseInt(extendDaysMap[userId] || "30", 10);
    try {
      const res = await fetch(`/api/auth-manager/admin/users/${userId}/extend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "x-wednesday-token": "wednesday-secret-local-handshake-token-2026"
        },
        body: JSON.stringify({ days })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setActionMsg(data.message);
      fetchAllAdminData();
      if (selectedUserId === userId) fetchUserDetails(userId);
      setTimeout(() => setActionMsg(""), 3500);
    } catch (err) {
      alert("Error extending access: " + err.message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetUser) return;
    try {
      const res = await fetch(`/api/auth-manager/admin/users/${deleteTargetUser.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "x-wednesday-token": "wednesday-secret-local-handshake-token-2026"
        }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setActionMsg(`User ${deleteTargetUser.email} permanently removed.`);
      setShowDeleteConfirm(false);
      setDeleteTargetUser(null);
      if (selectedUserId === deleteTargetUser.id) setSelectedUserId(null);
      fetchAllAdminData();
      setTimeout(() => setActionMsg(""), 3500);
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const handleExportChatTrigger = (targetId = "", format = "json") => {
    let url = `/api/auth-manager/admin/export-chat?token=${token}&format=${format}`;
    if (targetId) url += `&userId=${targetId}`;
    window.open(url, "_blank");
  };

  const handleExportUsersExcel = () => {
    window.open(`/api/auth-manager/admin/export-excel?token=${token}`, "_blank");
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === "active") return u.accountStatus === "active" && !u.isExpired;
    if (statusFilter === "suspended") return u.accountStatus === "suspended";
    if (statusFilter === "expired") return u.isExpired && !u.isAdmin;
    if (statusFilter === "admin") return u.isAdmin;
    return true;
  });



  return (
    <div style={{
      display: "flex",
      height: "100%",
      width: "100%",
      flex: 1,
      background: "radial-gradient(circle at 50% 0%, #0d1629 0%, #060913 100%)",
      color: "#e2e8f0",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      overflow: "hidden"
    }}>
      {/* SIDEBAR NAVIGATION */}
      <div style={{
        width: "270px",
        background: "rgba(10, 16, 30, 0.95)",
        backdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(0, 240, 255, 0.15)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0
      }}>
        {/* Header Branding */}
        <div style={{
          padding: "24px 20px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          alignItems: "center",
          gap: "14px"
        }}>
          <div style={{
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #00f0ff 0%, #7000ff 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            boxShadow: "0 0 20px rgba(0, 240, 255, 0.4)"
          }}>
            <Shield size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "17px", color: "#fff", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "6px" }}>
              BRO AI <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "rgba(0,240,255,0.2)", color: "#00f0ff" }}>PRO</span>
            </div>
            <div style={{ fontSize: "11px", color: "#00f0ff", fontWeight: 700, letterSpacing: "1px", marginTop: "2px" }}>ADMIN CONTROL CENTER</div>
          </div>
        </div>

        {/* Navigation Items */}
        <div style={{ flex: 1, padding: "14px 12px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
          {[
            { id: "dashboard", label: "Dashboard Overview", icon: Activity },
            { id: "users", label: "Users Management", icon: Users, badge: currentStats?.members?.total },
            { id: "online", label: "Currently Logged In", icon: Radio, badge: currentStats?.members?.currentlyLoggedIn, highlight: true },
            { id: "login", label: "Login Activity", icon: Key },
            { id: "registration", label: "Registration Activity", icon: UserPlus },
            { id: "conversations", label: "Conversations", icon: MessageSquare },
            { id: "exports", label: "Chat & Data Exports", icon: Download },
            { id: "access", label: "Access Management", icon: Clock },
            { id: "security", label: "Security Center", icon: ShieldAlert, alert: (securityEvents.length > 0) },
            { id: "audit", label: "Audit Logs", icon: FileText },
            { id: "system", label: "System Statistics", icon: Server },
            { id: "settings", label: "Settings", icon: Settings }
          ].map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "11px 16px",
                  borderRadius: "10px",
                  border: isActive ? "1px solid rgba(0, 240, 255, 0.3)" : "1px solid transparent",
                  background: isActive ? "linear-gradient(90deg, rgba(0,240,255,0.15) 0%, rgba(112,0,255,0.1) 100%)" : "transparent",
                  color: isActive ? "#00f0ff" : "#94a3b8",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: "13.5px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                  outline: "none"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Icon size={18} style={{ color: isActive ? "#00f0ff" : "#64748b" }} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge !== null && (
                  <span style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "12px",
                    background: item.highlight ? "rgba(16, 185, 129, 0.25)" : "rgba(255, 255, 255, 0.1)",
                    color: item.highlight ? "#10b981" : "#94a3b8",
                    border: item.highlight ? "1px solid rgba(16, 185, 129, 0.4)" : "none"
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Admin Status */}
        <div style={{
          padding: "18px",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          background: "rgba(0,0,0,0.2)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 10px #10b981" }} />
            <div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff" }}>karthikhruth@gmail.com</div>
              <div style={{ fontSize: "10.5px", color: "#10b981" }}>Authorized Administrator</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              background: "rgba(239, 68, 68, 0.12)",
              color: "#ef4444",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.2s"
            }}
          >
            <X size={16} /> Exit Admin Dashboard
          </button>
        </div>
      </div>

      {/* MAIN VIEW CONTENT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top Header Bar */}
        <div style={{
          padding: "18px 32px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          background: "rgba(10, 16, 30, 0.6)",
          backdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
              <span>ADMIN CONTROL</span> <ChevronRight size={12} /> <span style={{ color: "#00f0ff" }}>{activeTab.toUpperCase()}</span>
            </div>
            <h1 style={{ margin: "4px 0 0 0", fontSize: "22px", fontWeight: 800, color: "#fff", textTransform: "capitalize" }}>
              {activeTab.replace(/([A-Z])/g, ' $1')}
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            {actionMsg && (
              <div style={{
                fontSize: "12.5px",
                fontWeight: 700,
                color: "#10b981",
                background: "rgba(16, 185, 129, 0.15)",
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid rgba(16, 185, 129, 0.4)"
              }}>
                {actionMsg}
              </div>
            )}
            <button
              onClick={handleExportUsersExcel}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 16px",
                borderRadius: "9px",
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                color: "#10b981",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              <FileSpreadsheet size={16} /> Export Users CSV
            </button>
            <button
              onClick={fetchAllAdminData}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 16px",
                borderRadius: "9px",
                background: "rgba(0, 240, 255, 0.15)",
                border: "1px solid rgba(0, 240, 255, 0.4)",
                color: "#00f0ff",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </div>

        {/* VIEW CONTAINER */}
        <div style={{ flex: 1, overflowY: "auto", padding: "32px" }}>
          {error && (
            <div style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              color: "#f87171",
              padding: "16px 20px",
              borderRadius: "12px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontWeight: 600
            }}>
              <AlertTriangle size={22} />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === "dashboard" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "20px" }}>
                <MetricCard title="Total Registered Members" value={currentStats?.members?.total || 0} icon={Users} color="#00f0ff" subtext={`${currentStats?.members?.verified || 0} Verified Accounts`} />
                <MetricCard title="Currently Logged In" value={currentStats?.members?.currentlyLoggedIn || 0} icon={Radio} color="#10b981" subtext={`${currentStats?.members?.recentlyActive || 0} active in last 24h`} pulse />
                <MetricCard title="Active 30-Day Accounts" value={currentStats?.access?.activeTrial || 0} icon={Clock} color="#a855f7" subtext={`${currentStats?.access?.approachingExpiration || 0} expiring within 7 days`} />
                <MetricCard title="Expired Access Users" value={currentStats?.access?.expiredTrial || 0} icon={UserX} color="#f59e0b" subtext="Access period completed" />
                <MetricCard title="Suspended / Banned" value={currentStats?.members?.suspended || 0} icon={UserX} color="#ef4444" subtext="Blocked by administrator" />
                <MetricCard title="Unlimited Administrators" value={currentStats?.access?.unlimitedAdmins || 1} icon={Shield} color="#00f0ff" subtext="Permanent access granted" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                <div style={cardStyle}>
                  <h3 style={cardTitleStyle}><Key size={20} color="#00f0ff" /> Authentication Activity Metrics</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "18px" }}>
                    <DataRow label="Successful Logins" value={currentStats?.authentication?.successfulLogins || 0} color="#10b981" />
                    <DataRow label="Failed Login Attempts" value={currentStats?.authentication?.failedLogins || 0} color="#ef4444" />
                    <DataRow label="Total Registration Attempts" value={currentStats?.authentication?.registrationAttempts || 0} color="#3b82f6" />
                    <DataRow label="OTP Verification Attempts" value={currentStats?.authentication?.otpVerificationAttempts || 0} color="#a855f7" />
                    <DataRow label="Failed OTP Attempts" value={currentStats?.authentication?.failedOtpAttempts || 0} color="#f59e0b" />
                  </div>
                </div>

                <div style={cardStyle}>
                  <h3 style={cardTitleStyle}><ShieldAlert size={20} color="#ef4444" /> Security & System Summary</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "18px" }}>
                    <DataRow label="Active Server Sessions" value={currentStats?.system?.totalSessions || 0} color="#00f0ff" />
                    <DataRow label="Security Alerts & Incidents" value={currentStats?.system?.totalSecurityEvents || 0} color="#f59e0b" />
                    <DataRow label="Recorded Audit Logs" value={currentStats?.system?.totalAuditLogs || 0} color="#94a3b8" />
                    <DataRow label="Primary Authorized Owner" value="karthikhruth@gmail.com" color="#10b981" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USERS MANAGEMENT */}
          {activeTab === "users" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                  <input
                    type="text"
                    placeholder="Search members by Name, Email, or User ID..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
                  <option value="all">All Accounts</option>
                  <option value="active">Active Access</option>
                  <option value="expired">Expired Access</option>
                  <option value="suspended">Suspended / Banned</option>
                  <option value="admin">Administrators</option>
                </select>
              </div>

              <div style={tableContainerStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Member Details</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Access Period</th>
                      <th style={thStyle}>Last Login</th>
                      <th style={thStyle}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id} style={trStyle}>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 700, color: "#fff", fontSize: "14px" }}>{u.name}</div>
                          <div style={{ fontSize: "12.5px", color: "#00f0ff" }}>{u.email}</div>
                          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>ID: {u.id}</div>
                        </td>
                        <td style={tdStyle}>
                          {u.isAdmin ? (
                            <span style={badgeStyle("#00f0ff")}>ADMIN</span>
                          ) : u.accountStatus === "suspended" ? (
                            <span style={badgeStyle("#ef4444")}>BANNED</span>
                          ) : u.isExpired ? (
                            <span style={badgeStyle("#f59e0b")}>EXPIRED</span>
                          ) : (
                            <span style={badgeStyle("#10b981")}>ACTIVE</span>
                          )}
                          {u.isOnline && <span style={{ ...badgeStyle("#10b981"), marginLeft: "8px" }}>🟢 ONLINE</span>}
                        </td>
                        <td style={tdStyle}>
                          <div style={{ fontSize: "13px", color: "#e2e8f0", fontWeight: 600 }}>{u.accessStatusText}</div>
                          <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px" }}>
                            Expires: {u.access_expires_at ? new Date(u.access_expires_at).toLocaleDateString() : "Permanent"}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ fontSize: "12.5px", color: "#94a3b8" }}>
                            {u.last_login_at ? new Date(u.last_login_at).toLocaleString() : "Never"}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button onClick={() => fetchUserDetails(u.id)} style={btnSmallStyle("#00f0ff")}>
                              <Eye size={14} /> Details
                            </button>
                            {!u.isAdmin && (
                              <>
                                {u.accountStatus === "suspended" ? (
                                  <button onClick={() => handleUnbanUser(u.id)} style={btnSmallStyle("#10b981")}>
                                    <UserCheck size={14} /> Unban
                                  </button>
                                ) : (
                                  <button onClick={() => handleBanUser(u.id)} style={btnSmallStyle("#f59e0b")}>
                                    <UserX size={14} /> Ban
                                  </button>
                                )}
                                <button onClick={() => { setDeleteTargetUser(u); setShowDeleteConfirm(true); }} style={btnSmallStyle("#ef4444")}>
                                  <Trash2 size={14} /> Remove
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CURRENTLY LOGGED IN */}
          {activeTab === "online" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ fontSize: "14px", color: "#94a3b8" }}>
                Members authenticated with an active server heartbeat session (within last 2 minutes).
              </div>

              <div style={tableContainerStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Member Name & Email</th>
                      <th style={thStyle}>Login Time</th>
                      <th style={thStyle}>Last Activity Ping</th>
                      <th style={thStyle}>Session Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {onlineMembers.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: "32px", textAlign: "center", color: "#64748b", fontSize: "14px" }}>
                          No active online heartbeat sessions detected right now.
                        </td>
                      </tr>
                    ) : (
                      onlineMembers.map(m => (
                        <tr key={m.id} style={trStyle}>
                          <td style={tdStyle}>
                            <div style={{ fontWeight: 700, color: "#fff", fontSize: "14px" }}>{m.name}</div>
                            <div style={{ fontSize: "12.5px", color: "#00f0ff" }}>{m.email}</div>
                          </td>
                          <td style={tdStyle}>
                            <div style={{ fontSize: "12.5px", color: "#94a3b8" }}>
                              {m.loginTime ? new Date(m.loginTime).toLocaleString() : "Active"}
                            </div>
                          </td>
                          <td style={tdStyle}>
                            <div style={{ fontSize: "12.5px", color: "#10b981", fontWeight: 600 }}>
                              {m.lastActivity ? new Date(m.lastActivity).toLocaleTimeString() : "Just now"}
                            </div>
                          </td>
                          <td style={tdStyle}>
                            <span style={badgeStyle("#10b981")}>🟢 Currently Online</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: LOGIN ACTIVITY */}
          {activeTab === "login" && (
            <div style={tableContainerStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Timestamp</th>
                    <th style={thStyle}>User / Email</th>
                    <th style={thStyle}>Event Type</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {loginActivity.map(l => (
                    <tr key={l.id} style={trStyle}>
                      <td style={tdStyle}>
                        <div style={{ fontSize: "12.5px", color: "#94a3b8" }}>{new Date(l.timestamp).toLocaleString()}</div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 700, color: "#fff" }}>{l.name || "N/A"}</div>
                        <div style={{ fontSize: "12.5px", color: "#00f0ff" }}>{l.email || "N/A"}</div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#e2e8f0" }}>{l.type}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={badgeStyle(l.status === "success" ? "#10b981" : "#ef4444")}>
                          {l.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: "12.5px", color: "#64748b" }}>{l.ipAddress}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 5: REGISTRATION ACTIVITY */}
          {activeTab === "registration" && (
            <div style={tableContainerStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Timestamp</th>
                    <th style={thStyle}>User / Email</th>
                    <th style={thStyle}>Event</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {registrationActivity.map(r => (
                    <tr key={r.id} style={trStyle}>
                      <td style={tdStyle}>
                        <div style={{ fontSize: "12.5px", color: "#94a3b8" }}>{new Date(r.timestamp).toLocaleString()}</div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 700, color: "#fff" }}>{r.name || "Applicant"}</div>
                        <div style={{ fontSize: "12.5px", color: "#00f0ff" }}>{r.email}</div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: "13px", color: "#e2e8f0" }}>{r.type}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={badgeStyle(r.status === "success" ? "#10b981" : "#f59e0b")}>{r.status.toUpperCase()}</span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: "12.5px", color: "#64748b" }}>{r.ipAddress}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 6: CONVERSATIONS */}
          {activeTab === "conversations" && (
            <div style={tableContainerStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Conversation Title</th>
                    <th style={thStyle}>User</th>
                    <th style={thStyle}>Messages</th>
                    <th style={thStyle}>Last Updated</th>
                    <th style={thStyle}>Export Options</th>
                  </tr>
                </thead>
                <tbody>
                  {conversations.map(c => (
                    <tr key={c.id} style={trStyle}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 700, color: "#fff" }}>{c.title}</div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>ID: {c.id}</div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: "13px", color: "#e2e8f0", fontWeight: 600 }}>{c.userName}</div>
                        <div style={{ fontSize: "12.5px", color: "#00f0ff" }}>{c.userEmail}</div>
                      </td>
                      <td style={tdStyle}>
                        <span style={badgeStyle("#a855f7")}>{c.messageCount} msgs</span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: "12.5px", color: "#94a3b8" }}>{new Date(c.updatedDate).toLocaleString()}</div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button onClick={() => handleExportChatTrigger(c.userId, "json")} style={btnSmallStyle("#00f0ff")}>JSON</button>
                          <button onClick={() => handleExportChatTrigger(c.userId, "csv")} style={btnSmallStyle("#10b981")}>CSV</button>
                          <button onClick={() => handleExportChatTrigger(c.userId, "html")} style={btnSmallStyle("#a855f7")}>PDF</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 7: EXPORTS */}
          {activeTab === "exports" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "650px" }}>
              <div style={cardStyle}>
                <h3 style={cardTitleStyle}><Download size={20} color="#00f0ff" /> Admin Chat & Data Export Console</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "18px", marginTop: "20px" }}>
                  <div>
                    <label style={labelStyle}>Target User (Select specific user or exported all):</label>
                    <select value={exportUserId} onChange={e => setExportUserId(e.target.value)} style={selectStyle}>
                      <option value="">All Registered Users Data</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>Export File Format:</label>
                    <select value={exportFormat} onChange={e => setExportFormat(e.target.value)} style={selectStyle}>
                      <option value="json">JSON Format (.json)</option>
                      <option value="csv">CSV Spreadsheet (.csv)</option>
                      <option value="txt">Plain Text (.txt)</option>
                      <option value="html">Printable HTML / PDF Document (.html)</option>
                    </select>
                  </div>

                  <button
                    onClick={() => handleExportChatTrigger(exportUserId, exportFormat)}
                    style={{
                      padding: "14px",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #00f0ff 0%, #7000ff 100%)",
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: "14px",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      marginTop: "10px",
                      boxShadow: "0 0 20px rgba(0, 240, 255, 0.4)"
                    }}
                  >
                    <Download size={20} /> Export Conversations Now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: ACCESS MANAGEMENT */}
          {activeTab === "access" && (
            <div style={tableContainerStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Member Name & Email</th>
                    <th style={thStyle}>Current Access Status</th>
                    <th style={thStyle}>Days Remaining</th>
                    <th style={thStyle}>Access Expiry Date</th>
                    <th style={thStyle}>Extend Access Period</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={trStyle}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 700, color: "#fff" }}>{u.name}</div>
                        <div style={{ fontSize: "12.5px", color: "#00f0ff" }}>{u.email}</div>
                      </td>
                      <td style={tdStyle}>
                        <span style={badgeStyle(u.isAdmin ? "#00f0ff" : u.isExpired ? "#ef4444" : "#10b981")}>
                          {u.accessStatusText}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: "13.5px", fontWeight: 800, color: u.daysRemaining <= 7 && !u.isAdmin ? "#ef4444" : "#e2e8f0" }}>
                          {u.isAdmin ? "♾️ Unlimited" : `${u.daysRemaining} Days`}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: "12.5px", color: "#94a3b8" }}>
                          {u.access_expires_at ? new Date(u.access_expires_at).toLocaleDateString() : "Permanent"}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        {!u.isAdmin && (
                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <select
                              value={extendDaysMap[u.id] || "30"}
                              onChange={e => setExtendDaysMap({ ...extendDaysMap, [u.id]: e.target.value })}
                              style={{ ...selectStyle, padding: "6px 10px", fontSize: "12.5px" }}
                            >
                              <option value="7">+7 Days</option>
                              <option value="30">+30 Days</option>
                              <option value="90">+90 Days</option>
                              <option value="365">+1 Year</option>
                            </select>
                            <button onClick={() => handleExtendAccess(u.id)} style={btnSmallStyle("#10b981")}>
                              Extend
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 9: SECURITY CENTER */}
          {activeTab === "security" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ fontSize: "14px", color: "#94a3b8" }}>
                Security events, authentication failures, banned account attempts, and unauthorized admin access attempts.
              </div>

              <div style={tableContainerStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Timestamp</th>
                      <th style={thStyle}>Event Type</th>
                      <th style={thStyle}>Severity</th>
                      <th style={thStyle}>Target Email</th>
                      <th style={thStyle}>Description</th>
                      <th style={thStyle}>IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {securityEvents.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#64748b", fontSize: "14px" }}>
                          No security alerts or incidents recorded.
                        </td>
                      </tr>
                    ) : (
                      securityEvents.map(s => (
                        <tr key={s.id} style={trStyle}>
                          <td style={tdStyle}>
                            <div style={{ fontSize: "12.5px", color: "#94a3b8" }}>{new Date(s.timestamp).toLocaleString()}</div>
                          </td>
                          <td style={tdStyle}>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>{s.type}</span>
                          </td>
                          <td style={tdStyle}>
                            <span style={badgeStyle(s.severity === "high" ? "#ef4444" : s.severity === "medium" ? "#f59e0b" : "#3b82f6")}>
                              {s.severity.toUpperCase()}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <div style={{ fontSize: "12.5px", color: "#00f0ff" }}>{s.email || "N/A"}</div>
                          </td>
                          <td style={tdStyle}>
                            <div style={{ fontSize: "12.5px", color: "#e2e8f0" }}>{s.description}</div>
                          </td>
                          <td style={tdStyle}>
                            <div style={{ fontSize: "12.5px", color: "#64748b" }}>{s.ipAddress}</div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 10: AUDIT LOGS */}
          {activeTab === "audit" && (
            <div style={tableContainerStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Timestamp</th>
                    <th style={thStyle}>Action Executed</th>
                    <th style={thStyle}>Actor ID</th>
                    <th style={thStyle}>Target User</th>
                    <th style={thStyle}>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(a => (
                    <tr key={a.id} style={trStyle}>
                      <td style={tdStyle}>
                        <div style={{ fontSize: "12.5px", color: "#94a3b8" }}>{new Date(a.timestamp).toLocaleString()}</div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#00f0ff" }}>{a.action}</span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: "12.5px", color: "#e2e8f0" }}>{a.actorUserId}</div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: "12.5px", color: "#e2e8f0" }}>{a.targetUserId || "N/A"}</div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: "12.5px", color: "#64748b" }}>{a.ipAddress}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 11: SYSTEM STATISTICS */}
          {activeTab === "system" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
              <div style={cardStyle}>
                <h3 style={cardTitleStyle}><Server size={20} color="#00f0ff" /> Server Environment</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "18px" }}>
                  <DataRow label="Backend Engine" value="BRO AI Express BFF" />
                  <DataRow label="Authorization Status" value="Server Authorized" color="#10b981" />
                  <DataRow label="Authorized Admin Account" value="karthikhruth@gmail.com" color="#00f0ff" />
                  <DataRow label="Access Limit" value="Permanent / Unlimited Access" color="#a855f7" />
                </div>
              </div>

              <div style={cardStyle}>
                <h3 style={cardTitleStyle}><Database size={20} color="#a855f7" /> Database & Store Records</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "18px" }}>
                  <DataRow label="Total Registered Users" value={currentStats?.members?.total || 0} />
                  <DataRow label="Active Server Sessions" value={currentStats?.system?.totalSessions || 0} />
                  <DataRow label="Audit Trail Records" value={currentStats?.system?.totalAuditLogs || 0} />
                  <DataRow label="Recorded Security Events" value={currentStats?.system?.totalSecurityEvents || 0} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 12: SETTINGS */}
          {activeTab === "settings" && (
            <div style={{ maxWidth: "650px", display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={cardStyle}>
                <h3 style={cardTitleStyle}><Settings size={20} color="#00f0ff" /> Administrator Configuration</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "20px" }}>
                  <div>
                    <label style={labelStyle}>Primary Authorized Administrator Email:</label>
                    <input type="text" readOnly value="karthikhruth@gmail.com" style={{ ...inputStyle, background: "rgba(0,0,0,0.4)" }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Default Non-Admin User Access Period:</label>
                    <input type="text" readOnly value="30 Days (Strict Server Enforcement)" style={{ ...inputStyle, background: "rgba(0,0,0,0.4)" }} />
                  </div>
                  <div style={{ fontSize: "12.5px", color: "#64748b" }}>
                    Note: Server security rules strictly enforce role authorization on all protected administrative APIs.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* USER DETAILS MODAL */}
      {selectedUserId && (
        <div style={modalBackdropStyle}>
          <div style={{ ...modalBoxStyle, width: "680px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "16px" }}>
              <h3 style={{ margin: 0, color: "#fff", fontSize: "20px", fontWeight: 800 }}>User Profile Inspection</h3>
              <button onClick={() => setSelectedUserId(null)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}><X size={22} /></button>
            </div>

            {loadingDetails || !userDetails ? (
              <div style={{ padding: "48px", textAlign: "center", color: "#00f0ff", fontWeight: 600 }}>Loading user details...</div>
            ) : (
              <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={labelStyle}>Full Name</label>
                    <div style={{ fontWeight: 700, color: "#fff", fontSize: "15px" }}>{userDetails.account.name}</div>
                  </div>
                  <div>
                    <label style={labelStyle}>Email Address</label>
                    <div style={{ fontWeight: 700, color: "#00f0ff", fontSize: "15px" }}>{userDetails.account.email}</div>
                  </div>
                  <div>
                    <label style={labelStyle}>Mobile Number</label>
                    <div style={{ color: "#e2e8f0", fontSize: "14px" }}>{userDetails.account.mobile || "N/A"}</div>
                  </div>
                  <div>
                    <label style={labelStyle}>User ID</label>
                    <div style={{ fontSize: "12.5px", color: "#64748b" }}>{userDetails.account.id}</div>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "16px" }}>
                  <h4 style={{ color: "#00f0ff", margin: "0 0 12px 0", fontSize: "15px", fontWeight: 700 }}>Access & Account Status</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <DataRow label="Access Status" value={userDetails.access.statusText} />
                    <DataRow label="Account Status" value={userDetails.account.accountStatus.toUpperCase()} color={userDetails.account.accountStatus === "suspended" ? "#ef4444" : "#10b981"} />
                    <DataRow label="Assigned Role" value={userDetails.account.role} />
                    <DataRow label="Registration Date" value={new Date(userDetails.account.registrationDate).toLocaleDateString()} />
                  </div>
                </div>

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "16px" }}>
                  <h4 style={{ color: "#a855f7", margin: "0 0 12px 0", fontSize: "15px", fontWeight: 700 }}>User Owned Data Statistics</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                    <DataRow label="Conversations" value={userDetails.dataStatistics.conversationCount} />
                    <DataRow label="Isolated Memories" value={userDetails.dataStatistics.memoryCount} />
                    <DataRow label="Uploaded Files" value={userDetails.dataStatistics.fileCount} />
                  </div>
                </div>

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "20px", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                  {userDetails.account.role !== "ADMIN" && (
                    <>
                      {userDetails.account.accountStatus === "suspended" ? (
                        <button onClick={() => handleUnbanUser(userDetails.account.id)} style={btnStyle("#10b981")}>
                          <UserCheck size={16} /> Unban Account
                        </button>
                      ) : (
                        <button onClick={() => handleBanUser(userDetails.account.id)} style={btnStyle("#f59e0b")}>
                          <UserX size={16} /> Ban Account
                        </button>
                      )}
                      <button onClick={() => { setDeleteTargetUser(userDetails.account); setShowDeleteConfirm(true); }} style={btnStyle("#ef4444")}>
                        <Trash2 size={16} /> Permanently Remove User
                      </button>
                    </>
                  )}
                  <button onClick={() => setSelectedUserId(null)} style={btnStyle("#64748b")}>Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONFIRMATION DELETE DIALOG */}
      {showDeleteConfirm && deleteTargetUser && (
        <div style={modalBackdropStyle}>
          <div style={{ ...modalBoxStyle, width: "450px", border: "1px solid rgba(239, 68, 68, 0.5)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#ef4444" }}>
              <AlertTriangle size={26} />
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>Confirm User Deletion</h3>
            </div>
            <p style={{ fontSize: "14px", color: "#cbd5e1", margin: "18px 0", lineHeight: "1.5" }}>
              Are you sure you want to permanently remove user <strong>{deleteTargetUser.name}</strong> ({deleteTargetUser.email})?
              <br /><br />
              This operation will permanently delete their account and invalidate active sessions immediately.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={btnStyle("#64748b")}>Cancel</button>
              <button onClick={handleConfirmDelete} style={btnStyle("#ef4444")}>Yes, Permanently Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color, subtext, pulse }) {
  return (
    <div style={{
      background: "rgba(13, 20, 36, 0.75)",
      backdropFilter: "blur(12px)",
      border: `1px solid ${color}44`,
      borderRadius: "16px",
      padding: "22px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4)`
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "13px", color: "#94a3b8", fontWeight: 600 }}>{title}</span>
        <div style={{ padding: "8px", borderRadius: "10px", background: `${color}15` }}>
          <Icon size={22} color={color} />
        </div>
      </div>
      <div style={{ fontSize: "32px", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
        {value}
      </div>
      {subtext && <div style={{ fontSize: "12px", color: "#64748b" }}>{subtext}</div>}
    </div>
  );
}

function DataRow({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px", padding: "6px 0", borderBottom: "1px dashed rgba(255,255,255,0.06)" }}>
      <span style={{ color: "#94a3b8" }}>{label}</span>
      <span style={{ fontWeight: 700, color: color || "#fff" }}>{value}</span>
    </div>
  );
}

const cardStyle = {
  background: "rgba(13, 20, 36, 0.75)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  borderRadius: "16px",
  padding: "24px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
};

const cardTitleStyle = {
  margin: 0,
  fontSize: "16px",
  fontWeight: 800,
  color: "#fff",
  display: "flex",
  alignItems: "center",
  gap: "10px"
};

const tableContainerStyle = {
  background: "rgba(13, 20, 36, 0.75)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  borderRadius: "16px",
  overflow: "hidden",
  boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  textAlign: "left"
};

const thStyle = {
  background: "rgba(0, 0, 0, 0.5)",
  padding: "16px 20px",
  fontSize: "12px",
  fontWeight: 800,
  color: "#94a3b8",
  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  textTransform: "uppercase",
  letterSpacing: "0.8px"
};

const trStyle = {
  borderBottom: "1px solid rgba(255, 255, 255, 0.04)"
};

const tdStyle = {
  padding: "16px 20px",
  fontSize: "13.5px"
};

const inputStyle = {
  width: "100%",
  padding: "11px 16px 11px 42px",
  borderRadius: "10px",
  background: "rgba(0,0,0,0.4)",
  border: "1px solid rgba(255,255,255,0.15)",
  color: "#fff",
  fontSize: "13.5px",
  outline: "none",
  boxSizing: "border-box"
};

const selectStyle = {
  padding: "11px 16px",
  borderRadius: "10px",
  background: "#0a101e",
  border: "1px solid rgba(255,255,255,0.15)",
  color: "#fff",
  fontSize: "13.5px",
  outline: "none"
};

const labelStyle = {
  display: "block",
  fontSize: "12.5px",
  color: "#94a3b8",
  marginBottom: "8px",
  fontWeight: 700
};

const badgeStyle = (color) => ({
  fontSize: "11px",
  fontWeight: 800,
  padding: "4px 10px",
  borderRadius: "14px",
  background: `${color}22`,
  color: color,
  border: `1px solid ${color}44`,
  display: "inline-block",
  letterSpacing: "0.5px"
});

const btnSmallStyle = (color) => ({
  padding: "6px 12px",
  borderRadius: "8px",
  background: `${color}20`,
  border: `1px solid ${color}44`,
  color: color,
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  transition: "all 0.2s"
});

const btnStyle = (color) => ({
  padding: "9px 18px",
  borderRadius: "9px",
  background: `${color}20`,
  border: `1px solid ${color}44`,
  color: color,
  fontSize: "13.5px",
  fontWeight: 700,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  transition: "all 0.2s"
});

const modalBackdropStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0, 0, 0, 0.85)",
  backdropFilter: "blur(10px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 99999
};

const modalBoxStyle = {
  background: "#0a101e",
  border: "1px solid rgba(0, 240, 255, 0.4)",
  borderRadius: "20px",
  padding: "28px",
  boxShadow: "0 0 50px rgba(0, 240, 255, 0.2)"
};
