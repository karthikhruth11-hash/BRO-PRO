import { toolRegistry } from "../core/toolRegistry.js";

export class HermesAgent {
  constructor() {
    this.enabled = process.env.HERMES_ENABLED !== "false";
  }

  isAgentRequired(prompt) {
    if (!this.enabled || !prompt) return false;
    const pLower = prompt.toLowerCase();
    const agentTriggers = ["open app", "launch", "run command", "terminal", "execute", "browse", "filesystem", "system tool"];
    return agentTriggers.some(t => pLower.includes(t));
  }

  async executeAgentTask({ prompt, persona = "jarvis" }) {
    const pLower = prompt.toLowerCase();

    // OS Open App Tool
    if (pLower.includes("open ") || pLower.includes("launch ")) {
      let appName = prompt.replace(/^(open|launch)\s+/i, "").trim();
      const toolRes = await toolRegistry.executeTool("open_app", { appName });
      return {
        text: toolRes.message || `Hermes Agent opened ${appName}`,
        provider: "Hermes Agent (OS Tool)",
        toolUsed: "open_app"
      };
    }

    // System Telemetry Tool
    if (pLower.includes("telemetry") || pLower.includes("system status") || pLower.includes("system stats")) {
      const toolRes = await toolRegistry.executeTool("get_system_telemetry", {});
      return {
        text: `### 🖥️ Hermes Agent System Telemetry:\n\`\`\`json\n${JSON.stringify(toolRes, null, 2)}\n\`\`\``,
        provider: "Hermes Agent (Telemetry)",
        toolUsed: "get_system_telemetry"
      };
    }

    return null;
  }
}

export const hermesAgent = new HermesAgent();
