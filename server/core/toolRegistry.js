import { openAppTool } from "../tools/openApp.tool.js";
import { readFilesTool } from "../tools/readFiles.tool.js";
import { runTerminalTool } from "../tools/runTerminal.tool.js";
import { telemetryTool } from "../tools/telemetry.tool.js";

class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this.registerTool(openAppTool);
    this.registerTool(readFilesTool);
    this.registerTool(runTerminalTool);
    this.registerTool(telemetryTool);
  }

  registerTool(tool) {
    if (!tool.name || typeof tool.execute !== "function") {
      throw new Error("Invalid tool definition. Must provide 'name' and 'execute' function.");
    }
    this.tools.set(tool.name, tool);
  }

  getTool(name) {
    return this.tools.get(name);
  }

  getAllTools() {
    return Array.from(this.tools.values()).map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema
    }));
  }

  async executeTool(name, params) {
    const tool = this.getTool(name);
    if (!tool) {
      return { success: false, message: `Tool '${name}' is not registered in the system.` };
    }
    try {
      return await tool.execute(params || {});
    } catch (err) {
      return { success: false, message: `Execution error in tool '${name}': ${err.message}` };
    }
  }
}

export const toolRegistry = new ToolRegistry();
