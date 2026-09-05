import express from "express";
import { toolRegistry } from "../core/toolRegistry.js";
import { getApiUsageStats } from "../core/providerGateway.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const sysResult = await toolRegistry.executeTool("get_telemetry", {});
    const apiStats = getApiUsageStats();
    res.json({
      success: true,
      system: sysResult.telemetry,
      aiUsage: apiStats
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
