import { ollamaProvider } from "../providers/ollamaProvider.js";
import { groqProvider } from "../providers/groqProvider.js";
import { geminiProvider } from "../providers/geminiProvider.js";
import { openaiProvider } from "../providers/openaiProvider.js";

export class ModelRegistry {
  constructor() {
    this.models = {
      "openai/gpt-oss-120b": {
        provider: "groq",
        adapter: groqProvider,
        capabilities: ["chat", "coding", "reasoning", "math"],
        contextLength: 131072,
        costInput: 0.0001,
        costOutput: 0.0001,
        latencyScore: 0.95,
        qualityScore: 0.96,
        toolSupport: true,
        visionSupport: false
      },
      "qwen/qwen3.8-27b": {
        provider: "groq",
        adapter: groqProvider,
        capabilities: ["chat", "coding", "reasoning"],
        contextLength: 32768,
        costInput: 0.0001,
        costOutput: 0.0001,
        latencyScore: 0.98,
        qualityScore: 0.92,
        toolSupport: true,
        visionSupport: false
      },
      "gemini-3.6-flash": {
        provider: "google",
        adapter: geminiProvider,
        capabilities: ["chat", "coding", "reasoning", "vision", "math"],
        contextLength: 1048576,
        costInput: 0.0002,
        costOutput: 0.0004,
        latencyScore: 0.90,
        qualityScore: 0.94,
        toolSupport: true,
        visionSupport: true
      },
      "gpt-4o-mini": {
        provider: "openai",
        adapter: openaiProvider,
        capabilities: ["chat", "coding", "reasoning", "tools"],
        contextLength: 128000,
        costInput: 0.00015,
        costOutput: 0.0006,
        latencyScore: 0.88,
        qualityScore: 0.91,
        toolSupport: true,
        visionSupport: false
      }
    };
    this.localDiscovered = false;
  }

  async syncLocalOllamaModels() {
    try {
      const isOnline = await ollamaProvider.isAvailable();
      if (isOnline) {
        const localModels = await ollamaProvider.discoverModels();
        for (const lm of localModels) {
          if (!this.models[lm.name]) {
            this.models[lm.name] = {
              provider: "ollama",
              adapter: ollamaProvider,
              capabilities: ["chat", "coding", "reasoning"],
              contextLength: 8192,
              costInput: 0,
              costOutput: 0,
              latencyScore: 0.85,
              qualityScore: 0.88,
              toolSupport: false,
              visionSupport: false
            };
          }
        }
        this.localDiscovered = true;
      }
    } catch (e) {
      // Ollama offline
    }
  }

  getModel(name) {
    return this.models[name] || null;
  }

  getAllModels() {
    return Object.entries(this.models).map(([name, data]) => ({
      name,
      provider: data.provider,
      capabilities: data.capabilities,
      qualityScore: data.qualityScore,
      latencyScore: data.latencyScore
    }));
  }
}

export const modelRegistry = new ModelRegistry();
