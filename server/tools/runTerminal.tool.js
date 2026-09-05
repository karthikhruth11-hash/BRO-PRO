import { exec } from "child_process";
import { isCommandAllowed } from "../security/allowList.js";

export const runTerminalTool = {
  name: "run_terminal",
  description: "Executes allow-listed CLI shell commands",
  inputSchema: { command: "string" },
  execute: async ({ command }) => {
    if (!command) return { success: false, output: "No command specified." };
    
    if (!isCommandAllowed(command)) {
      return {
        success: false,
        output: `Security Restriction: Command '${command}' is not in the system allow-list.`
      };
    }

    return new Promise((resolve) => {
      exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
        if (error) {
          resolve({ success: false, output: stderr || error.message });
        } else {
          resolve({ success: true, output: stdout || "Command executed with 0 exit code." });
        }
      });
    });
  }
};
