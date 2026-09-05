// Random Forest Model Selection Engine for BRO AI Multi-LLM Orchestration
export class DecisionTree {
  constructor(featureIndex, threshold, left, right, prediction = null) {
    this.featureIndex = featureIndex;
    this.threshold = threshold;
    this.left = left;
    this.right = right;
    this.prediction = prediction;
  }

  predict(vector) {
    if (this.prediction !== null) return this.prediction;
    if (vector[this.featureIndex] <= this.threshold) {
      return this.left.predict(vector);
    }
    return this.right.predict(vector);
  }
}

export class RandomForestRouter {
  constructor() {
    this.trees = this.buildInitialTrees();
    this.telemetryLogs = [];
  }

  buildInitialTrees() {
    // Tree 1: Coding & Math Specialization
    const tree1 = new DecisionTree(1, 0.5,
      new DecisionTree(3, 0.5, null, null, "gemini-3.6-flash"), // Low coding, low math
      new DecisionTree(1, 0.8, null, null, "openai/gpt-oss-120b"), // High coding
      null
    );

    // Tree 2: Reasoning & Quality Specialization
    const tree2 = new DecisionTree(2, 0.6,
      new DecisionTree(0, 0.4, null, null, "qwen/qwen3.8-27b"),
      new DecisionTree(4, 0.7, null, null, "openai/gpt-oss-120b"),
      null
    );

    // Tree 3: Context & Speed Specialization
    const tree3 = new DecisionTree(7, 0.6,
      new DecisionTree(0, 0.5, null, null, "qwen/qwen3.8-27b"),
      new DecisionTree(5, 0.5, null, null, "gemini-3.6-flash"),
      null
    );

    return [tree1, tree2, tree3];
  }

  predictBestModel(featureVector, candidateModels = []) {
    const votes = {};
    for (const tree of this.trees) {
      try {
        const pred = tree.predict(featureVector);
        if (pred) {
          votes[pred] = (votes[pred] || 0) + 1;
        }
      } catch (e) {}
    }

    let bestModel = "openai/gpt-oss-120b";
    let maxVotes = -1;

    for (const [model, count] of Object.entries(votes)) {
      if (candidateModels.length === 0 || candidateModels.includes(model)) {
        if (count > maxVotes) {
          maxVotes = count;
          bestModel = model;
        }
      }
    }

    const confidence = maxVotes > 0 ? Number((maxVotes / this.trees.length).toFixed(2)) : 0.85;

    return {
      selectedModel: bestModel,
      confidence,
      votes
    };
  }

  recordTelemetry(data) {
    this.telemetryLogs.push({
      ...data,
      timestamp: new Date().toISOString()
    });
    if (this.telemetryLogs.length > 500) {
      this.telemetryLogs.shift();
    }
  }

  getTelemetryStats() {
    return {
      totalLogs: this.telemetryLogs.length,
      treesCount: this.trees.length,
      lastSelection: this.telemetryLogs[this.telemetryLogs.length - 1] || null
    };
  }
}

export const randomForestRouter = new RandomForestRouter();
