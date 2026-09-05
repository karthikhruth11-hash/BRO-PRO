export function extractRequestFeatures(prompt, options = {}) {
  if (!prompt || typeof prompt !== "string") {
    return {
      taskType: "casual",
      complexity: 0.2,
      codingScore: 0,
      reasoningScore: 0,
      mathScore: 0,
      writingScore: 0.5,
      visionRequired: false,
      toolRequired: false,
      browserRequired: false,
      computerUseRequired: false,
      contextLength: 0,
      urgency: 0.5,
      vector: [0.2, 0, 0, 0, 0.5, 0, 0, 0, 0, 0.5]
    };
  }

  const pLower = prompt.toLowerCase();

  const codingKeywords = ["code", "function", "write", "python", "javascript", "c++", "java", "sql", "html", "css", "script", "bug", "error", "debug", "class"];
  const reasoningKeywords = ["explain", "why", "compare", "analyze", "architecture", "algorithm", "eval", "evaluation", "pros and cons", "investigate"];
  const mathKeywords = ["add", "sum", "multiply", "divide", "calculate", "equation", "formula", "integral", "derivative", "math", "matrix", "algebra"];
  const writingKeywords = ["essay", "story", "write an article", "rewrite", "poem", "draft", "summary"];
  const toolKeywords = ["open", "launch", "search", "browse", "file", "terminal", "run command", "web"];
  const visionKeywords = ["image", "photo", "picture", "screenshot", "diagram", "draw"];

  const codingScore = codingKeywords.filter(k => pLower.includes(k)).length > 0 ? 0.9 : 0.1;
  const reasoningScore = reasoningKeywords.filter(k => pLower.includes(k)).length > 0 ? 0.85 : 0.2;
  const mathScore = mathKeywords.filter(k => pLower.includes(k)).length > 0 ? 0.95 : 0.05;
  const writingScore = writingKeywords.filter(k => pLower.includes(k)).length > 0 ? 0.8 : 0.3;

  const toolRequired = toolKeywords.some(k => pLower.includes(k));
  const visionRequired = visionKeywords.some(k => pLower.includes(k)) || (options.attachments && options.attachments.length > 0);
  const browserRequired = pLower.includes("browse") || pLower.includes("web search") || pLower.includes("website");
  const computerUseRequired = pLower.includes("open app") || pLower.includes("launch") || pLower.includes("run command");

  let taskType = "casual";
  if (codingScore > 0.5) taskType = "coding";
  else if (mathScore > 0.5) taskType = "math";
  else if (reasoningScore > 0.5) taskType = "reasoning";
  else if (toolRequired) taskType = "tool";

  const lengthPenalty = Math.min(1.0, prompt.length / 2000);
  const complexity = Math.max(0.2, (codingScore + reasoningScore + mathScore + lengthPenalty) / 4);

  const contextLength = prompt.length + (options.history ? options.history.reduce((a, b) => a + (b.content?.length || 0), 0) : 0);

  const vector = [
    complexity,
    codingScore,
    reasoningScore,
    mathScore,
    writingScore,
    visionRequired ? 1.0 : 0.0,
    toolRequired ? 1.0 : 0.0,
    Math.min(1.0, contextLength / 10000),
    0.5, // urgency
    0.5  // cost sensitivity
  ];

  return {
    taskType,
    complexity,
    codingScore,
    reasoningScore,
    mathScore,
    writingScore,
    visionRequired,
    toolRequired,
    browserRequired,
    computerUseRequired,
    contextLength,
    urgency: 0.5,
    vector
  };
}
