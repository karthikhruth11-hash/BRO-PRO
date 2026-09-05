export class FallbackManager {
  constructor(maxRetries = parseInt(process.env.MAX_MODEL_RETRIES || "2", 10)) {
    this.maxRetries = maxRetries;
  }

  async executeWithFallback(primaryModel, candidateChain, executeFn) {
    let lastError = null;
    const tried = [];

    const queue = [primaryModel, ...candidateChain.filter(m => m !== primaryModel)];

    for (let attempt = 0; attempt <= this.maxRetries && attempt < queue.length; attempt++) {
      const targetModel = queue[attempt];
      tried.push(targetModel);

      try {
        const result = await executeFn(targetModel);
        if (result && result.text) {
          return {
            ...result,
            fallbackUsed: attempt > 0,
            triedModels: tried
          };
        }
      } catch (err) {
        lastError = err;
        console.warn(`[FallbackManager] Model ${targetModel} failed: ${err.message}. Retrying...`);
      }
    }

    throw new Error(`All candidate models failed. Last error: ${lastError?.message || "Unknown error"}`);
  }
}

export const fallbackManager = new FallbackManager();
