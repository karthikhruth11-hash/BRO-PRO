import fs from "fs";
import path from "path";

const FORBIDDEN_PATTERNS = [
  /\.env/i,
  /data[\\/]/i,
  /security[\\/]/i,
  /store\.json/i,
  /memoryStore\.json/i,
  /auth_db\.json/i,
  /secret/i,
  /credential/i,
  /token/i,
  /password/i,
  /\.pem$/i,
  /\.cert$/i
];

const HIDDEN_DIR_ITEMS = new Set([
  "data",
  "security",
  "uploads",
  "node_modules",
  ".git",
  ".env",
  ".env.production.local",
  ".dist",
  ".vercel"
]);

export const readFilesTool = {
  name: "read_files",
  description: "Reads file system contents safely in a virtual sandbox environment",
  inputSchema: { filePath: "string" },
  execute: async ({ filePath = "." }) => {
    try {
      const normalizedPath = filePath.replace(/\\/g, "/");
      if (FORBIDDEN_PATTERNS.some(p => p.test(normalizedPath))) {
        return {
          success: false,
          message: "Security Policy Enforcement: Access to configuration secrets, credentials, or private storage files is strictly prohibited."
        };
      }

      const resolved = path.resolve(filePath);
      const projectRoot = process.cwd();
      if (!resolved.startsWith(projectRoot)) {
        return {
          success: false,
          message: "Security Policy Enforcement: Traversal outside the project workspace is prohibited."
        };
      }

      const stats = fs.statSync(resolved);

      if (stats.isDirectory()) {
        const files = fs.readdirSync(resolved);
        const safeFiles = files.filter(f => !f.startsWith(".") && !HIDDEN_DIR_ITEMS.has(f.toLowerCase()));
        return {
          success: true,
          type: "directory",
          path: resolved,
          contents: safeFiles.slice(0, 30).map(f => {
            const fPath = path.join(resolved, f);
            const fStats = fs.statSync(fPath);
            return { name: f, isDirectory: fStats.isDirectory(), size: fStats.size };
          })
        };
      } else {
        const rawContent = fs.readFileSync(resolved, "utf8");
        // Scrub any accidental token matches
        const safeContent = rawContent
          .replace(/gsk_[a-zA-Z0-9_-]{20,}/g, "gsk_example_key")
          .replace(/sk-[a-zA-Z0-9_-]{20,}/g, "sk-example_key")
          .replace(/AIza[a-zA-Z0-9_-]{30,}/g, "AIzaSy_example_key");

        return {
          success: true,
          type: "file",
          path: resolved,
          size: stats.size,
          content: safeContent.slice(0, 2000)
        };
      }
    } catch (err) {
      return { success: false, message: `Error reading file path '${filePath}': ${err.message}` };
    }
  }
};
