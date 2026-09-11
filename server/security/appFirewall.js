/**
 * SAGW AI (W.E.D.N.E.S.D.A.Y. Pro) - Enterprise In-App Web Application Firewall (WAF)
 * 
 * Provides defense-in-depth security:
 * 1. HTTP Security Shield & Header Hardening (Helmet-style)
 * 2. Honeypot & Known Vulnerability Scanner Trap (/etc/passwd, .env, wp-login, phpmyadmin, etc.)
 * 3. Malicious User-Agent / Security Scanner Detection (sqlmap, nikto, dirbuster, etc.)
 * 4. Deep Packet / Payload Threat Inspection (SQLi, XSS, Path Traversal, Prototype Pollution)
 * 5. Sliding-Window IP Rate Limiter & Automatic Security Jail
 * 6. Real-Time Threat Telemetry & Security Metrics
 */

class ApplicationFirewall {
  constructor() {
    this.enabled = process.env.FIREWALL_ENABLED !== "false";
    
    // In-memory rate limiting and jail state
    this.ipRequestCounts = new Map(); // ip -> { count, windowStart }
    this.jailedIPs = new Map();       // ip -> { jailedUntil, reason, violationsCount }
    this.ipViolationCounts = new Map(); // ip -> [timestamps]

    // Real-time metrics
    this.metrics = {
      totalInspected: 0,
      totalBlocked: 0,
      blockedThreats: {
        honeypotProbes: 0,
        maliciousScanners: 0,
        pathTraversal: 0,
        sqlInjection: 0,
        xssAttack: 0,
        prototypePollution: 0,
        rateLimitExceeded: 0,
        jailedIPRequests: 0
      },
      recentThreats: []
    };

    // Configuration
    this.RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
    this.RATE_LIMIT_MAX_REQUESTS = 300;     // 300 req/min per IP
    this.AUTH_RATE_LIMIT_MAX = 25;          // 25 req/min for auth routes
    this.JAIL_DURATION_MS = 15 * 60 * 1000; // 15 minutes jail
    this.VIOLATIONS_BEFORE_JAIL = 3;        // Jail on 3 violations in 5 mins

    // Clean up expired counters periodically (every 5 minutes)
    setInterval(() => this.cleanupExpiredRecords(), 5 * 60 * 1000);
  }

  // 1. Client IP Extraction
  getClientIP(req) {
    const forwarded = req.headers["x-forwarded-for"];
    if (forwarded && typeof forwarded === "string") {
      return forwarded.split(",")[0].trim();
    }
    return req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || "127.0.0.1";
  }

  isLoopbackOrWhitelisted(ip) {
    return (
      ip === "127.0.0.1" ||
      ip === "::1" ||
      ip === "localhost" ||
      ip.startsWith("192.168.") ||
      ip.startsWith("10.") ||
      ip.startsWith("172.16.")
    );
  }

  // Record a detected threat in telemetry
  recordThreat(threatType, ip, req, reason) {
    this.metrics.totalBlocked++;
    if (this.metrics.blockedThreats[threatType] !== undefined) {
      this.metrics.blockedThreats[threatType]++;
    }

    const threatEvent = {
      timestamp: new Date().toISOString(),
      threatType,
      ip,
      method: req.method,
      url: req.originalUrl || req.url,
      reason,
      userAgent: (req.headers["user-agent"] || "").slice(0, 120)
    };

    this.metrics.recentThreats.unshift(threatEvent);
    if (this.metrics.recentThreats.length > 100) {
      this.metrics.recentThreats.pop();
    }

    // Track violations for auto-jailing
    const now = Date.now();
    const violations = this.ipViolationCounts.get(ip) || [];
    const recentViolations = violations.filter(t => now - t < 5 * 60 * 1000);
    recentViolations.push(now);
    this.ipViolationCounts.set(ip, recentViolations);

    // Auto-jail if not local and exceeds threshold
    if (!this.isLoopbackOrWhitelisted(ip) && recentViolations.length >= this.VIOLATIONS_BEFORE_JAIL) {
      this.jailedIPs.set(ip, {
        jailedUntil: now + this.JAIL_DURATION_MS,
        reason: `Exceeded security violation limit: ${threatType}`,
        violationsCount: recentViolations.length
      });
      console.warn(`[WAF SHIELD] 🚨 IP ${ip} has been JAILED for 15 minutes due to repeated violations.`);
    }

    console.warn(`[WAF SHIELD] 🛡️ BLOCKED [${threatType}] from ${ip} -> ${req.method} ${req.url} (${reason})`);
  }

  // Periodic memory cleanup
  cleanupExpiredRecords() {
    const now = Date.now();
    for (const [ip, data] of this.jailedIPs.entries()) {
      if (now > data.jailedUntil) {
        this.jailedIPs.delete(ip);
      }
    }
    for (const [ip, data] of this.ipRequestCounts.entries()) {
      if (now - data.windowStart > this.RATE_LIMIT_WINDOW_MS * 2) {
        this.ipRequestCounts.delete(ip);
      }
    }
  }

  // 2. HTTP Security Headers Hardening
  applySecurityHeaders(req, res, next) {
    // Strip headers that reveal server internals
    res.removeHeader("X-Powered-By");
    
    // Core defensive security headers
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
    res.setHeader("X-Firewall-Protection", "SAGW-Shield/2.0-Active");

    if (process.env.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    }

    next();
  }

  // 3. Honeypot & Malicious Probe Detection
  checkHoneypotProbes(req, ip) {
    const url = (req.originalUrl || req.url || "").toLowerCase();

    // High-risk scanner & backdoor honeypot signatures
    const honeypotPatterns = [
      /\.env($|\?|\/)/i,
      /\.git($|\/)/i,
      /\.svn($|\/)/i,
      /\.aws($|\/)/i,
      /\.ssh($|\/)/i,
      /wp-login\.php/i,
      /wp-admin($|\/)/i,
      /phpmyadmin/i,
      /pma($|\/)/i,
      /cgi-bin\//i,
      /web\.config/i,
      /shell\.php/i,
      /eval-stdin\.php/i,
      /actuator\/(health|env)/i,
      /\.bak($|\?)/i,
      /dump\.sql/i,
      /backup\.sql/i,
      /passwd/i,
      /win\.ini/i
    ];

    for (const pattern of honeypotPatterns) {
      if (pattern.test(url)) {
        return { isThreat: true, pattern: pattern.toString() };
      }
    }
    return { isThreat: false };
  }

  // 4. Malicious Scanner User-Agent Detection
  checkMaliciousUserAgent(req, ip) {
    const ua = (req.headers["user-agent"] || "").toLowerCase();
    if (!ua) return { isThreat: false };

    const scannerSignatures = [
      "sqlmap",
      "nikto",
      "masscan",
      "wpscan",
      "acunetix",
      "dirbuster",
      "gobuster",
      "nessus",
      "openvas",
      "zgrab",
      "censys",
      "nmap",
      "morfeus fucking scanner",
      "havij",
      "commix"
    ];

    for (const sig of scannerSignatures) {
      if (ua.includes(sig)) {
        return { isThreat: true, signature: sig };
      }
    }
    return { isThreat: false };
  }

  // 5. Deep Payload & Parameter Inspection
  inspectPayloads(req, ip) {
    const url = decodeURIComponent(req.originalUrl || req.url || "");

    // 5.1 Path Traversal Check (in URL & query string)
    const pathTraversalRegex = /(\.\.[\/\\]|%2e%2e[\/\\]|%252e%252e|\/etc\/(passwd|shadow)|c:\\windows\\system32)/i;
    if (pathTraversalRegex.test(url)) {
      return { isThreat: true, type: "pathTraversal", reason: "Path traversal pattern detected in request URI" };
    }

    // 5.2 Prototype Pollution Check in Body
    if (req.body && typeof req.body === "object") {
      const bodyStr = JSON.stringify(req.body);
      if (bodyStr.includes('"__proto__"') || (bodyStr.includes('"constructor"') && bodyStr.includes('"prototype"'))) {
        return { isThreat: true, type: "prototypePollution", reason: "Prototype pollution pattern in JSON payload" };
      }
    }

    // 5.3 SQL Injection (SQLi) Check in URL & Query params
    const queryStr = JSON.stringify(req.query || {});
    const sqliRegex = /(\b(UNION\s+ALL\s+SELECT|UNION\s+SELECT|SELECT\s+.*\s+FROM|INSERT\s+INTO|DROP\s+TABLE|ALTER\s+TABLE|DELETE\s+FROM)\b|'\s*OR\s*'1'\s*=\s*'1|--\s*$|\bEXEC\s*\(|WAITFOR\s+DELAY)/i;
    if (sqliRegex.test(url) || sqliRegex.test(queryStr)) {
      return { isThreat: true, type: "sqlInjection", reason: "SQL injection signature detected in query parameters" };
    }

    // 5.4 Cross-Site Scripting (XSS) in Query Params
    const xssRegex = /(<script\b[^>]*>|javascript:\s*[a-z0-9_]|onerror\s*=\s*['"]?alert|onload\s*=\s*['"]?alert)/i;
    if (xssRegex.test(url) || xssRegex.test(queryStr)) {
      return { isThreat: true, type: "xssAttack", reason: "XSS script execution pattern in query parameters" };
    }

    return { isThreat: false };
  }

  // 6. Sliding Window Rate Limiter
  checkRateLimit(req, ip) {
    if (this.isLoopbackOrWhitelisted(ip)) return { isAllowed: true };

    const now = Date.now();
    const isAuthRoute = (req.originalUrl || req.url || "").includes("/api/auth");
    const limit = isAuthRoute ? this.AUTH_RATE_LIMIT_MAX : this.RATE_LIMIT_MAX_REQUESTS;

    let record = this.ipRequestCounts.get(ip);
    if (!record || now - record.windowStart > this.RATE_LIMIT_WINDOW_MS) {
      record = { count: 1, windowStart: now };
      this.ipRequestCounts.set(ip, record);
      return { isAllowed: true };
    }

    record.count++;
    if (record.count > limit) {
      return {
        isAllowed: false,
        currentCount: record.count,
        limit,
        retryAfterSec: Math.ceil((this.RATE_LIMIT_WINDOW_MS - (now - record.windowStart)) / 1000)
      };
    }

    return { isAllowed: true };
  }

  // Main Firewall Middleware Handler
  middleware() {
    return (req, res, next) => {
      if (!this.enabled) return next();

      this.metrics.totalInspected++;
      const ip = this.getClientIP(req);

      // 1. Check if IP is in Security Jail
      const jailInfo = this.jailedIPs.get(ip);
      if (jailInfo) {
        if (Date.now() < jailInfo.jailedUntil) {
          this.recordThreat("jailedIPRequests", ip, req, "IP currently imprisoned in security jail");
          const remainingMinutes = Math.ceil((jailInfo.jailedUntil - Date.now()) / (60 * 1000));
          return res.status(403).json({
            error: "Forbidden: Access temporarily suspended by Application Firewall.",
            reason: "Repeated security violations detected from your IP address.",
            jailedDurationRemaining: `${remainingMinutes} minute(s)`
          });
        } else {
          // Jail expired
          this.jailedIPs.delete(ip);
        }
      }

      // 2. Check Rate Limits
      const rateCheck = this.checkRateLimit(req, ip);
      if (!rateCheck.isAllowed) {
        this.recordThreat("rateLimitExceeded", ip, req, `Rate limit exceeded (${rateCheck.currentCount}/${rateCheck.limit})`);
        res.setHeader("Retry-After", rateCheck.retryAfterSec);
        return res.status(429).json({
          error: "Too Many Requests: Rate limit exceeded.",
          message: "Please slow down your requests. Our Application Firewall has rate-limited your IP.",
          retryAfterSeconds: rateCheck.retryAfterSec
        });
      }

      // 3. Check Honeypot & Malicious Probe Targets
      const probeCheck = this.checkHoneypotProbes(req, ip);
      if (probeCheck.isThreat) {
        this.recordThreat("honeypotProbes", ip, req, `Probing sensitive path: ${probeCheck.pattern}`);
        return res.status(403).json({
          error: "Forbidden: Access denied by SAGW Application Firewall.",
          incidentId: `SEC-${Date.now()}`
        });
      }

      // 4. Check Malicious Scanners & Automated Attack Tools
      const scannerCheck = this.checkMaliciousUserAgent(req, ip);
      if (scannerCheck.isThreat) {
        this.recordThreat("maliciousScanners", ip, req, `Automated exploit scanner detected: ${scannerCheck.signature}`);
        return res.status(403).json({
          error: "Forbidden: Automated vulnerability scanner blocked by Application Firewall.",
          incidentId: `SEC-${Date.now()}`
        });
      }

      // 5. Deep Payload & Parameter Threat Inspection
      const payloadCheck = this.inspectPayloads(req, ip);
      if (payloadCheck.isThreat) {
        this.recordThreat(payloadCheck.type, ip, req, payloadCheck.reason);
        return res.status(403).json({
          error: `Forbidden: Malicious payload blocked by Application Firewall (${payloadCheck.type}).`,
          reason: payloadCheck.reason,
          incidentId: `SEC-${Date.now()}`
        });
      }

      // Request is clean -> Apply headers and continue
      this.applySecurityHeaders(req, res, next);
    };
  }

  // Get metrics for status dashboard
  getMetrics() {
    return {
      status: "active",
      engine: "SAGW Enterprise WAF Shield v2.0",
      ...this.metrics,
      activeJailedIPsCount: this.jailedIPs.size,
      jailedIPs: Array.from(this.jailedIPs.entries()).map(([ip, data]) => ({
        ip,
        jailedUntil: new Date(data.jailedUntil).toISOString(),
        reason: data.reason
      }))
    };
  }
}

export const appFirewall = new ApplicationFirewall();
