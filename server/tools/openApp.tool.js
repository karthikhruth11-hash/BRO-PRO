import { exec } from "child_process";
import { ALLOWED_EXECUTABLES } from "../security/allowList.js";

export const openAppTool = {
  name: "open_app",
  description: "Launches an allow-listed desktop application or system command",
  inputSchema: { appName: "string (e.g. notepad, spotify, whatsapp, calculator, browser, vscode, terminal)" },
  execute: async ({ appName }) => {
    if (!appName) return { success: false, message: "No application name provided." };
    const key = appName.toLowerCase().trim();
    const appConfig = ALLOWED_EXECUTABLES[key];

    if (!appConfig) {
      return {
        success: false,
        message: `Application '${appName}' is not in the system allow-list. Approved apps: ${Object.keys(ALLOWED_EXECUTABLES).join(", ")}`
      };
    }

    return new Promise((resolve) => {
      exec(appConfig.command, (error) => {
        if (error) {
          resolve({ success: false, message: `Failed to launch ${appConfig.desc}: ${error.message}` });
        } else {
          resolve({ success: true, message: `Successfully launched ${appConfig.desc} (${appConfig.command})` });
        }
      });
    });
  }
};
