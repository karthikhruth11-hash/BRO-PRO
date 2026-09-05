import fs from "fs";
import path from "path";

export const readFilesTool = {
  name: "read_files",
  description: "Reads file system contents safely in a virtual sandbox environment",
  inputSchema: { filePath: "string" },
  execute: async ({ filePath = "." }) => {
    try {
      const resolved = path.resolve(filePath);
      const stats = fs.statSync(resolved);

      if (stats.isDirectory()) {
        const files = fs.readdirSync(resolved);
        return {
          success: true,
          type: "directory",
          path: resolved,
          contents: files.slice(0, 30).map(f => {
            const fPath = path.join(resolved, f);
            const fStats = fs.statSync(fPath);
            return { name: f, isDirectory: fStats.isDirectory(), size: fStats.size };
          })
        };
      } else {
        const content = fs.readFileSync(resolved, "utf8");
        return {
          success: true,
          type: "file",
          path: resolved,
          size: stats.size,
          content: content.slice(0, 2000)
        };
      }
    } catch (err) {
      return { success: false, message: `Error reading file path '${filePath}': ${err.message}` };
    }
  }
};
