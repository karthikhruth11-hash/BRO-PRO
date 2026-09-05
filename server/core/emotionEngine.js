export function analyzeEmotion(text) {
  if (!text || typeof text !== "string") return { mood: "neutral", score: 0.5 };
  
  const lower = text.toLowerCase();
  
  const positiveWords = ["happy", "great", "awesome", "thanks", "love", "good", "amazing", "excited", "perfect"];
  const stressedWords = ["frustrated", "error", "broken", "help", "urgent", "stuck", "bug", "tired", "stressed"];
  const analyticalWords = ["code", "analyze", "explain", "how", "why", "system", "data", "architecture", "build"];
  
  let posScore = positiveWords.filter(w => lower.includes(w)).length;
  let stressScore = stressedWords.filter(w => lower.includes(w)).length;
  let analyticalScore = analyticalWords.filter(w => lower.includes(w)).length;

  if (stressScore > posScore && stressScore > analyticalScore) {
    return { mood: "stressed/urgent", score: 0.8, recommendation: "Provide reassuring, concise, step-by-step assistance." };
  } else if (posScore > stressScore && posScore > analyticalScore) {
    return { mood: "positive/upbeat", score: 0.85, recommendation: "Match enthusiastic, friendly energy." };
  } else if (analyticalScore > 0) {
    return { mood: "focused/analytical", score: 0.75, recommendation: "Provide structured, high-precision technical answers." };
  }
  
  return { mood: "neutral", score: 0.5, recommendation: "Maintain standard active persona style." };
}
