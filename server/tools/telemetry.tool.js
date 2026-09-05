import os from "os";

export const telemetryTool = {
  name: "get_telemetry",
  description: "Retrieves live CPU, Memory, OS uptime, and platform telemetry metrics",
  inputSchema: {},
  execute: async () => {
    const freeMem = os.freemem();
    const totalMem = os.totalmem();
    const usedMem = totalMem - freeMem;
    const memUsagePct = ((usedMem / totalMem) * 100).toFixed(1);

    const cpus = os.cpus();
    const loadAvg = os.loadavg();

    return {
      success: true,
      telemetry: {
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        uptimeSeconds: Math.floor(os.uptime()),
        cpuModel: cpus[0]?.model || "Intel Core i7",
        cpuCores: cpus.length,
        loadAvg,
        memory: {
          totalMB: Math.round(totalMem / (1024 * 1024)),
          usedMB: Math.round(usedMem / (1024 * 1024)),
          freeMB: Math.round(freeMem / (1024 * 1024)),
          percentUsed: parseFloat(memUsagePct)
        },
        timestamp: new Date().toISOString()
      }
    };
  }
};
