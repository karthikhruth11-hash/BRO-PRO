import express from "express";
import { toolRegistry } from "../core/toolRegistry.js";

const router = express.Router();

import { pcDataTrainer } from "../core/pcDataTrainerEngine.js";

router.get("/tools", (req, res) => {
  res.json({ success: true, tools: toolRegistry.getAllTools() });
});

router.post("/execute", async (req, res) => {
  try {
    const { toolName, params } = req.body;
    const result = await toolRegistry.executeTool(toolName, params);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/train", async (req, res) => {
  try {
    const result = await pcDataTrainer.trainFromDirectory();
    res.json({ success: true, training: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

import { ollamaProvider } from "../providers/ollamaProvider.js";
import { groqProvider } from "../providers/groqProvider.js";
import { geminiProvider } from "../providers/geminiProvider.js";
import { openaiProvider } from "../providers/openaiProvider.js";
import { randomForestRouter } from "../router/randomForestRouter.js";
import { hermesAgent } from "../agent/hermesAgent.js";
import { processUserIntent } from "../core/intentRouter.js";

router.get("/dataset-stats", (req, res) => {
  res.json({ success: true, stats: pcDataTrainer.getDatasetSummary() });
});

// GET /api/ai/health — Provider Health Status Check
router.get("/ai/health", async (req, res) => {
  const ollamaOnline = await ollamaProvider.isAvailable();
  const groqOnline = await groqProvider.isAvailable();
  const geminiOnline = await geminiProvider.isAvailable();
  const openaiOnline = await openaiProvider.isAvailable();

  res.json({
    success: true,
    providers: {
      ollama: { available: ollamaOnline, url: ollamaProvider.baseURL },
      groq: { available: groqOnline },
      gemini: { available: geminiOnline },
      openai: { available: openaiOnline },
      hermes: { available: hermesAgent.enabled },
      router: { available: true, strategy: process.env.MODEL_ROUTER_STRATEGY || "hybrid" }
    },
    routerTelemetry: randomForestRouter.getTelemetryStats()
  });
});

// POST /api/ai/chat — Unified AI Router Endpoint
router.post("/ai/chat", async (req, res) => {
  try {
    const { message, persona, options } = req.body;
    const result = await processUserIntent({ message, persona, options });
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
