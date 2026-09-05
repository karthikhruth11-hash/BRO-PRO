// Common phonetic typos, contractions, and abbreviations dictionary
const TYPO_MAP = {
  gud: "good",
  morng: "morning",
  mornng: "morning",
  mrng: "morning",
  hw: "how",
  wht: "what",
  ths: "this",
  abt: "about",
  abot: "about",
  tel: "tell",
  univrsity: "university",
  universty: "university",
  univercity: "university",
  natr: "nature",
  natur: "nature",
  computr: "computer",
  mothr: "mother",
  brd: "board",
  mothrbrd: "motherboard",
  lapto: "laptop",
  laptp: "laptop"
};

export function sanitizeInput(raw) {
  if (!raw) return "";
  return raw.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").trim();
}

export function normalizeTyposAndSpelling(rawText) {
  if (!rawText || typeof rawText !== "string") return rawText;

  let text = rawText.trim();

  // Normalize common multi-word contractions
  text = text
    .replace(/\bhw r u\b/gi, "how are you")
    .replace(/\bhw ru\b/gi, "how are you")
    .replace(/\bhow r u\b/gi, "how are you")
    .replace(/\bwht is ths\b/gi, "what is this")
    .replace(/\bmothr brd\b/gi, "motherboard")
    .replace(/\btell university about\b/gi, "tell me about university");

  // Normalize single word typos
  const words = text.split(/\s+/);
  const normalizedWords = words.map((w) => {
    const cleanWord = w.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (TYPO_MAP[cleanWord]) {
      return TYPO_MAP[cleanWord];
    }
    return w;
  });

  return normalizedWords.join(" ");
}

export function parseCommandFlags(text) {
  const flags = {
    persona: null,
    speak: false,
    rawText: text
  };

  if (!text) return flags;

  let clean = text;
  if (clean.includes("--jarvis")) {
    flags.persona = "jarvis";
    clean = clean.replace("--jarvis", "");
  } else if (clean.includes("--luna") || clean.includes("--girlfriend")) {
    flags.persona = "girlfriend";
    clean = clean.replace(/--(luna|girlfriend)/, "");
  } else if (clean.includes("--harvey") || clean.includes("--lawyer")) {
    flags.persona = "lawyer";
    clean = clean.replace(/--(harvey|lawyer)/, "");
  } else if (clean.includes("--atlas") || clean.includes("--polyglot")) {
    flags.persona = "polyglot";
    clean = clean.replace(/--(atlas|polyglot)/, "");
  }

  if (clean.includes("--speak")) {
    flags.speak = true;
    clean = clean.replace("--speak", "");
  }

  flags.rawText = normalizeTyposAndSpelling(clean);
  return flags;
}
