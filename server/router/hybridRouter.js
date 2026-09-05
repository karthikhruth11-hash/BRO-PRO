import { modelRegistry } from "./modelRegistry.js";
import { extractRequestFeatures } from "./featureExtractor.js";
import { randomForestRouter } from "./randomForestRouter.js";
import { fallbackManager } from "./fallbackManager.js";

export class HybridRouter {
  async routeAndExecute({ prompt, systemPrompt, options = {}, executeProviderFn }) {
    // Sync local Ollama models if online
    await modelRegistry.syncLocalOllamaModels();

    const features = extractRequestFeatures(prompt, options);
    const allModels = modelRegistry.getAllModels();

    // 1. Hard Capability Filtering
    let validModels = allModels.filter(m => {
      const spec = modelRegistry.getModel(m.name);
      if (!spec) return false;

      if (features.visionRequired && !spec.visionSupport) return false;
      if (features.toolRequired && !spec.toolSupport && spec.provider !== "ollama") return false;
      if (features.contextLength > spec.contextLength) return false;

      return true;
    });

    if (validModels.length === 0) {
      validModels = allModels;
    }

    const validNames = validModels.map(m => m.name);

    // 2. Random Forest ML Ranking
    const rfPrediction = randomForestRouter.predictBestModel(features.vector, validNames);
    const primaryModel = rfPrediction.selectedModel;

    // Build fallback chain
    const fallbackChain = validNames.filter(n => n !== primaryModel);

    // Logging routing decision
    const routingDecision = {
      selectedModel: primaryModel,
      provider: modelRegistry.getModel(primaryModel)?.provider || "unknown",
      confidence: rfPrediction.confidence,
      taskType: features.taskType,
      complexity: features.complexity,
      fallbackChain
    };

    if (process.env.ENABLE_ROUTING_LOGS !== "false") {
      console.log(`[HybridRouter] Decision:`, JSON.stringify(routingDecision));
    }

    // 3. Execute with Fallback Manager
    const result = await fallbackManager.executeWithFallback(primaryModel, fallbackChain, async (targetModel) => {
      const modelSpec = modelRegistry.getModel(targetModel);
      if (executeProviderFn) {
        return await executeProviderFn(targetModel, modelSpec);
      }
      if (modelSpec && modelSpec.adapter) {
        return await modelSpec.adapter.generate({
          prompt,
          systemPrompt,
          model: targetModel,
          temperature: options.temperature || 0.7
        });
      }
      throw new Error(`No adapter available for model ${targetModel}`);
    });

    // Record telemetry for Random Forest continuous evaluation
    randomForestRouter.recordTelemetry({
      promptLength: prompt.length,
      taskType: features.taskType,
      selectedModel: primaryModel,
      finalModel: result.provider,
      latencyMs: result.latencyMs || 0,
      fallbackUsed: result.fallbackUsed
    });

    return {
      ...result,
      routingDecision
    };
  }
}

export const hybridRouter = new HybridRouter();
