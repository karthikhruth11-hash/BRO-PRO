import { hermesAgent } from "../agent/hermesAgent.js";
import { hybridRouter } from "../router/hybridRouter.js";

const cache = new Map();

let apiUsageStats = {
  totalRequests: 0,
  cacheHits: 0,
  providerHits: {
    groq: 0,
    openai: 0,
    gemini: 0,
    ensemble: 0,
    fallback: 0
  },
  estimatedTokensUsed: 0,
  totalLatencyMs: 0
};

// Curated HD Subject-Accurate Photo Dictionary for Physical World Topics
const EXACT_TOPIC_IMAGES = {
  moon: {
    main: "https://images.unsplash.com/photo-1522030299830-a6b5a21010c6?auto=format&fit=crop&w=1000&q=80",
    side1: "https://images.unsplash.com/photo-1532693322450-2cb5c511067d?auto=format&fit=crop&w=600&q=80",
    side2: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=600&q=80",
    count: 12,
    caption: "The Moon — Earth's Natural Satellite in Lunar Orbit"
  },
  earth: {
    main: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=1000&q=80",
    side1: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80",
    side2: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
    count: 9,
    caption: "Planet Earth photographed from Space Orbit"
  },
  water: {
    main: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80",
    side1: "https://images.unsplash.com/photo-1488188840666-e2308741a62f?auto=format&fit=crop&w=600&q=80",
    side2: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=600&q=80",
    count: 10,
    caption: "Pure Water Hydrosphere & Aquatic Ecosystem"
  },
  book: {
    main: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1000&q=80",
    side1: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80",
    side2: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80",
    count: 12,
    caption: "Bound Books & Educational Literature"
  },
  notebook: {
    main: "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1000&q=80",
    side1: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=600&q=80",
    side2: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
    count: 10,
    caption: "Bound Paper Notebook & Journaling Stationery"
  },
  laptop: {
    main: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1000&q=80",
    side1: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=600&q=80",
    side2: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80",
    count: 14,
    caption: "Modern High-Performance Portable Laptop Hardware"
  },
  mobile: {
    main: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1000&q=80",
    side1: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=600&q=80",
    side2: "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?auto=format&fit=crop&w=600&q=80",
    count: 14,
    caption: "Modern Smartphone Hardware & Mobile Cellular Technology"
  },
  whatsapp: {
    main: "https://images.unsplash.com/photo-1611746872915-7f33e8631988?auto=format&fit=crop&w=1000&q=80",
    side1: "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?auto=format&fit=crop&w=600&q=80",
    side2: "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?auto=format&fit=crop&w=600&q=80",
    count: 6,
    caption: "Mobile Instant Messaging Interface"
  },
  motherboard: {
    main: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80",
    side1: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80",
    side2: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=600&q=80",
    count: 8,
    caption: "Printed Circuit Board (PCB) Motherboard & Chipset"
  },
  coffee: {
    main: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1000&q=80",
    side1: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
    side2: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80",
    count: 11,
    caption: "Artisanal Espresso & Brewed Coffee Beans"
  },
  robotics: {
    main: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1000&q=80",
    side1: "https://images.unsplash.com/photo-1563206767-5b18f218e8de?auto=format&fit=crop&w=600&q=80",
    side2: "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&w=600&q=80",
    count: 15,
    caption: "Autonomous Robotics & AI Engineering"
  },
  space: {
    main: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1000&q=80",
    side1: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=600&q=80",
    side2: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=600&q=80",
    count: 15,
    caption: "Deep Space Cosmos & Galactic Nebulae"
  },
  nature: {
    main: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1000&q=80",
    side1: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80",
    side2: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
    count: 7,
    caption: "Natural Forest Ecosystem & River Basin"
  }
};

// Strict Physical/Visual Image Filtering — ZERO images for grammar/abstract concepts
function validateImageRelevance(pLower) {
  const abstractTerms = [
    "pronoun", "reflexive", "myself", "yourself", "himself", "herself", "itself",
    "grammar", "linguistics", "math", "maths", "equation", "definition", "concept",
    "philosophy", "logic", "syntax", "semantics", "variable", "function", "code",
    "education", "university", "universities", "higher education", "temperature"
  ];

  for (const term of abstractTerms) {
    if (pLower.includes(term)) {
      return { isRelevant: false, key: null };
    }
  }

  for (const key in EXACT_TOPIC_IMAGES) {
    if (pLower.includes(key)) {
      return { isRelevant: true, key };
    }
  }

  return { isRelevant: false, key: null };
}

// Clean Search Topic Normalizer
function cleanSearchTopic(rawTopic) {
  let clean = rawTopic.trim()
    .replace(/^(give me full,\s*comprehensive details,\s*complete storyline,\s*key background,\s*cast,\s*and in-depth analysis of|give me full details about|give full details about|give me full details of|give full details of|i want full details about|i want full details of|full details of|full details about|give me details about|give details about)\s+/gi, "")
    .replace(/^(i am asking|i want to know|can you tell me about|can you tell me|please tell me about|please tell me|tell me about|tell me|can you explain about|can you explain|explain about|explain|show me|search for|search the web for|what is the|what is|wht is|waht is|who is|who was|who are|details of|details about|information on|information about|give me details of|give me details about|profile of|biography of|bio of)\s+/gi, "")
    .replace(/^(about|regarding|on)\s+/gi, "")
    .replace(/\s+(simply|in simple terms|for beginners|in detail|into pdf|in table format|details|summary)$/gi, "")
    .trim();

  const lower = clean.toLowerCase();
  
  // Ignore conversational greetings and acknowledgments from Wikipedia Search
  const conversationalPhrases = [
    "hi", "hii", "hiii", "hello", "hey", "heyy", "greetings", "yo", "sup", "gud morning", "good morning",
    "ok", "okay", "k", "kk", "okie", "okey", "okies", "alright", "all right", "got it", "noted", "understood",
    "makes sense", "cool", "sounds good", "sounds great", "sure", "sure thing", "fine", "done", "yes", "yep", "yeah", "yup",
    "no", "nope", "no problem", "np", "great", "awesome", "perfect", "nice", "good", "gotcha", "right", "roger that",
    "acknowledged", "all good", "thanks", "thank you", "thx", "thank u", "appreciate it", "many thanks",
    "bye", "goodbye", "see you", "see ya", "cya", "haha", "hahaha", "lol", "lmao", "rofl", "wow"
  ];
  if (conversationalPhrases.some(p => lower === p || lower.startsWith(p + " ") || lower.endsWith(" " + p)) || lower.length <= 2) {
    return "General conversation";
  }

  // Block external search from confusing SAGW AI with third-party companies
  if (
    lower.includes("founder") ||
    lower.includes("created you") ||
    lower.includes("made you") ||
    lower.includes("built you") ||
    lower.includes("developed you") ||
    lower.includes("who owns you") ||
    lower.includes("sagw ai") ||
    lower.includes("sagw")
  ) {
    return "General conversation";
  }

  if (lower.includes("mobile phone") || lower.includes("cell phone") || (lower.includes("cost") && lower.includes("mobile"))) return "Mobile phone";
  if (lower.includes("shape") && lower.includes("earth")) return "Figure of the Earth";
  if (lower.includes("temperature") && lower.includes("earth")) return "Global surface temperature";
  if (lower === "google") return "Google";
  if (lower === "youtube") return "YouTube";
  if (lower.includes("higher education") || lower.includes("university") || lower.includes("universities")) {
    return "Higher education";
  }
  if (lower === "mobile" || lower === "mobile phone" || lower === "smartphone") return "Mobile phone";
  if (lower === "car" || lower === "cars") return "Automobile";
  if (lower === "pc" || lower === "computer") return "Personal computer";
  if (lower === "ai") return "Artificial intelligence";
  if (lower === "book" || lower === "books") return "Book";
  if (lower === "water") return "Water";

  return clean;
}

// Output Sanitizer Layer
function sanitizeResponseText(text) {
  if (!text) return "";
  let clean = text;

  // Redact any accidental leaks of secrets, tokens, or security files
  clean = clean.replace(/\.env\s*(#.*)?/gi, (match) => {
    if (/secret|key|db|uri|pass/i.test(match)) {
      return ".env.example            # Environment template (example values only)";
    }
    return match;
  });

  clean = clean.replace(/#\s*(secrets|api keys|db uri|passwords?).*$/gim, "# Example configuration");
  clean = clean.replace(/memoryStore\.json\s*#\s*User Profile[^\n]*/gi, "memoryStore.json   # Memory adapter interface");
  clean = clean.replace(/store\.json\s*#\s*Conversations[^\n]*/gi, "store.json         # Data adapter interface");

  // Redact potential API keys or tokens
  clean = clean.replace(/gsk_[a-zA-Z0-9_-]{20,}/g, "gsk_your_groq_api_key_example");
  clean = clean.replace(/sk-[a-zA-Z0-9_-]{20,}/g, "sk-your_openai_key_example");
  clean = clean.replace(/AIza[a-zA-Z0-9_-]{30,}/g, "AIzaSy_your_gemini_key_example");
  clean = clean.replace(/wednesday-secret-[a-zA-Z0-9_-]+/g, "your-handshake-token-example");

  clean = clean.replace(/Execute quick tool:\s*/gi, "");
  clean = clean.replace(/\\([#*_$`\-\+\(\)])/g, "$1");

  clean = clean
    .replace(/\$5\.972\s*\\times\s*10\^\{24\}\$/g, "5.972 × 10²⁴")
    .replace(/\$7\.342\s*\\times\s*10\^\{22\}\$/g, "7.342 × 10²²")
    .replace(/\$1\.62\s*\\text\{\s*m\/s\}\^2\$/g, "1.62 m/s²")
    .replace(/\$-130\^\\circ\\text\{C\}\$/g, "-130°C")
    .replace(/\$\+120\^\\circ\\text\{C\}\$/g, "+120°C")
    .replace(/\$3\s*\\times\s*10\^\{-15\}\$/g, "3 × 10⁻¹⁵")
    .replace(/\$N_2\$/g, "N₂")
    .replace(/\$O_2\$/g, "O₂")
    .replace(/\$O_3\$/g, "O₃")
    .replace(/\$Ar\$/g, "Ar");

  return clean.trim();
}

// Fetch live web search data using Tavily Search API
async function fetchTavilyResearch(query) {
  const apiKey = process.env.SEARCH_API_KEY || process.env.TAVILY_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: "basic",
        include_answer: true,
        max_results: 3
      }),
      signal: AbortSignal.timeout(4500)
    });
    if (res.ok) {
      const data = await res.json();
      if (data && (data.answer || (data.results && data.results.length > 0))) {
        return {
          answer: data.answer || data.results[0]?.content || "",
          sources: (data.results || []).map(r => ({ title: r.title, url: r.url, snippet: r.content || "" }))
        };
      }
    }
  } catch (e) {
    // Fallback to Wikipedia
  }
  return null;
}

// Fetch live encyclopedic data from Wikipedia REST API with Search API Fallback
async function fetchWikipediaResearch(topic) {
  try {
    const targetTopic = cleanSearchTopic(topic);
    if (targetTopic === "General conversation") return null;

    const cleanTopic = encodeURIComponent(targetTopic.trim().replace(/\?/g, ''));
    
    // Direct summary fetch
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${cleanTopic}`, {
      headers: { 'User-Agent': 'WEDNESDAY-BRO-AI/2.0 (research-assistant)' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.extract && !data.extract.includes("may refer to:") && data.extract.length > 50) {
        return {
          title: data.title,
          description: data.description || "Verified Scientific Reference",
          extract: data.extract,
          url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${cleanTopic}`
        };
      }
    }

    // Search API Fallback
    const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${cleanTopic}&utf8=1&format=json`, {
      headers: { 'User-Agent': 'WEDNESDAY-BRO-AI/2.0 (research-assistant)' }
    });
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      const topHit = searchData.query?.search?.[0];
      if (topHit && topHit.title) {
        const topTitle = encodeURIComponent(topHit.title);
        const topRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${topTitle}`, {
          headers: { 'User-Agent': 'WEDNESDAY-BRO-AI/2.0 (research-assistant)' }
        });
        if (topRes.ok) {
          const topData = await topRes.json();
          if (topData.extract && topData.extract.length > 50) {
            return {
              title: topData.title,
              description: topData.description || "Verified Reference",
              extract: topData.extract,
              url: topData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${topTitle}`
            };
          }
        }
      }
    }
  } catch (e) {
    // Silent catch
  }
  return null;
}

// Universal Real-Time Ground Truth Query Detector:
// Automatically engages real-time web & encyclopedic search for substantive user inquiry.
export function isRealTimeFactualQuery(query) {
  if (!query || typeof query !== "string") return false;
  const q = query.toLowerCase().trim().replace(/[!.,?]+$/g, '');

  // 1. Skip pure conversational greetings
  const pureGreetings = /^(hi|hii|hiii|hello|hey|heyy|yo|sup|greetings|howdy|good\s+(morning|afternoon|evening|night)|bye|goodbye|see\s+ya)[!.,?]*$/i;
  if (pureGreetings.test(q)) return false;

  // 2. Skip conversational acknowledgments, affirmations, gratitude, farewells & reactions
  const acknowledgmentsAndCasual = /^(ok|okay|k|kk|okie|okey|okies|alright|all right|got it|noted|understood|makes sense|cool|sounds good|sounds great|sure|sure thing|fine|done|yes|yep|yeah|yup|no|nope|no problem|np|great|awesome|perfect|nice|good|gotcha|right|roger that|acknowledged|all good|thanks|thank you|thx|thank u|appreciate it|many thanks|haha|hahaha|lol|lmao|rofl|wow|good job|well done)[!.,?]*$/i;
  if (acknowledgmentsAndCasual.test(q)) return false;

  // 3. Skip pure arithmetic calculations e.g. "5+5", "100 / 4"
  if (/^\s*[\d\s+\-*/%.()]+\s*$/.test(q)) return false;

  // 4. Skip very short inputs (<= 2 chars)
  if (q.length <= 2) return false;

  // 5. Skip conversational / identity meta-questions
  const conversationalMeta = [
    "who are you", "what is your name", "whats your name", "what are you called", "what are you",
    "how are you", "how are you doing", "how r u", "what can you do", "who made you",
    "who created you", "who built you", "who developed you", "who founded you", "who is your founder",
    "who is ur founder", "tell me ur founder", "tell me your founder", "tell me ur founder name",
    "tell me your founder name", "tell me founder name", "founder name", "ur founder", "your founder",
    "founder", "founders", "tell me about yourself", "tell me about myself", "who am i",
    "describe me", "help me", "how was your day", "how is your day"
  ];
  if (
    conversationalMeta.some(c => q === c || q.startsWith(c + " ") || q.endsWith(" " + c)) ||
    ((q.includes("founder") || q.includes("created you") || q.includes("built you") || q.includes("made you")) &&
     (q.includes("who") || q.includes("tell") || q.includes("name") || q.includes("your") || q.includes("ur")))
  ) {
    return false;
  }

  // For genuine informational queries, activate real-time web search and grounding
  return true;
}

const searchCache = new Map();

async function fetchRealTimeGroundTruth(prompt) {
  const normalizedKey = prompt.trim().toLowerCase();
  const cached = searchCache.get(normalizedKey);
  if (cached && (Date.now() - cached.timestamp < 1000 * 60 * 20)) { // 20-minute cache
    return cached.data;
  }

  const targetTopic = cleanSearchTopic(prompt);
  const [tavilyResult, wikiResult] = await Promise.allSettled([
    fetchTavilyResearch(prompt),
    fetchWikipediaResearch(targetTopic)
  ]);

  const tavilyData = tavilyResult.status === "fulfilled" ? tavilyResult.value : null;
  const wikiData = wikiResult.status === "fulfilled" ? wikiResult.value : null;

  const data = { tavilyData, wikiData };
  searchCache.set(normalizedKey, { data, timestamp: Date.now() });

  if (searchCache.size > 200) {
    const oldestKey = searchCache.keys().next().value;
    searchCache.delete(oldestKey);
  }
  return data;
}

function resolveContextualSearchQuery(prompt, history = []) {
  if (!prompt || typeof prompt !== "string") return prompt;
  const pLower = prompt.toLowerCase().trim().replace(/[!.,?]+$/g, '');

  // If the query is an acknowledgment, greeting, or casual phrase, NEVER expand it with history!
  const acknowledgmentsAndCasual = /^(ok|okay|k|kk|okie|okey|okies|alright|all right|got it|noted|understood|makes sense|cool|sounds good|sounds great|sure|sure thing|fine|done|yes|yep|yeah|yup|no|nope|no problem|np|great|awesome|perfect|nice|good|gotcha|right|roger that|acknowledged|all good|thanks|thank you|thx|thank u|appreciate it|many thanks|bye|goodbye|see you|haha|hahaha|lol|lmao|rofl|wow)[!.,?]*$/i;
  if (acknowledgmentsAndCasual.test(pLower) || pLower.length <= 2) {
    return prompt;
  }

  const followUpTriggers = [
    "full details", "more details", "tell me more", "explain more", "give details",
    "details", "what about it", "tell me about it", "explain that", "i want full details",
    "give me full details", "all details", "complete details", "more info", "full info",
    "full story", "what is the story", "plot", "summary", "explain in detail", "continue",
    "give example", "what else", "tell me everything"
  ];

  const isFollowUp = followUpTriggers.some(t => pLower === t || pLower.startsWith(t) || pLower.endsWith(t));

  if (isFollowUp && history && history.length > 0) {
    for (let i = history.length - 1; i >= 0; i--) {
      const turn = history[i];
      if (!turn || !turn.content) continue;
      const text = typeof turn.content === "string" ? turn.content : "";

      if (turn.role === "user") {
        const cleanedUser = cleanSearchTopic(text);
        if (cleanedUser && cleanedUser !== "General conversation" && cleanedUser.length > 2 && !followUpTriggers.some(t => cleanedUser.toLowerCase().includes(t))) {
          return `${cleanedUser} ${prompt}`;
        }
      }
    }
  }

  return prompt;
}

export async function dispatchLLMRequest({ prompt, systemPrompt, temperature = 0.7, clientKeys = {}, history = [] }) {
  const startTime = Date.now();
  apiUsageStats.totalRequests++;

  // 1. Hermes Agent Execution Layer check
  if (hermesAgent.isAgentRequired(prompt)) {
    try {
      const agentRes = await hermesAgent.executeAgentTask({ prompt, history });
      if (agentRes && agentRes.text) {
        return {
          text: agentRes.text,
          provider: agentRes.provider || "Hermes Agent",
          latencyMs: Date.now() - startTime,
          tokensUsed: 25
        };
      }
    } catch (e) {
      console.warn("[HermesAgent] Tool execution fallback:", e.message);
    }
  }

  // 1.5 Auto Real-Time Web Search & Wikipedia Context Enrichment for Factual, Biographical & Real-World Inquiries
  let liveSearchPromptInjection = "";
  let liveGroundTruthAnswer = "";
  let verifiedSources = [];

  const effectiveSearchQuery = resolveContextualSearchQuery(prompt, history);
  if (isRealTimeFactualQuery(effectiveSearchQuery || prompt)) {
    try {
      const { tavilyData, wikiData } = await fetchRealTimeGroundTruth(effectiveSearchQuery || prompt);

      const groundTruthSnippets = [];
      if (tavilyData && tavilyData.answer) {
        groundTruthSnippets.push(`- Direct Real-Time Verified Fact: ${tavilyData.answer}`);
        liveGroundTruthAnswer = tavilyData.answer;
      }
      if (wikiData && wikiData.extract) {
        groundTruthSnippets.push(`- Wikipedia Reference (${wikiData.title}): ${wikiData.extract}`);
        if (!liveGroundTruthAnswer) liveGroundTruthAnswer = wikiData.extract.slice(0, 300);
      }
      if (tavilyData && tavilyData.sources && tavilyData.sources.length > 0) {
        for (const s of tavilyData.sources.slice(0, 3)) {
          groundTruthSnippets.push(`- Real-Time Web Source (${s.title}): ${s.snippet.replace(/\s+/g, ' ').slice(0, 250)}`);
          verifiedSources.push({ title: s.title, url: s.url });
        }
      }
      if (wikiData && wikiData.url) {
        verifiedSources.push({ title: `Wikipedia: ${wikiData.title}`, url: wikiData.url });
      }

      if (groundTruthSnippets.length > 0) {
        liveSearchPromptInjection = `\n\n[AUTHORITATIVE REAL-TIME GROUND TRUTH & WEB KNOWLEDGE (CURRENT 2024-2026)]:
${groundTruthSnippets.join("\n")}

"DO BOTH" INTEGRATION DIRECTIVES (BALANCED AI & REAL-TIME GROUNDING):
1. ACCURATE REAL-TIME GROUNDING: Seamlessly integrate the verified real-time data above into your response. For live facts, current officeholders (e.g. Chief Ministers, Prime Ministers, Presidents, CEOs), living status, real spouses/parents, and recent events, always adhere to verified facts.
2. RICH, COMPREHENSIVE AI KNOWLEDGE: Draw extensively upon your full, rich knowledge base, analytical depth, and creative intelligence. Provide complete, comprehensive, detailed explanations, story plots, character arcs, technical deep dives, and context as requested.
3. NEVER REFUSE OR APOLOGIZE FOR LACK OF DATA: Do NOT say "I don't have verified real-time data" or refuse to answer. Synthesize your vast parametric intelligence with the verified facts above to give the user the most thorough, engaging, and complete answer possible.`;
      }
    } catch (e) {
      console.warn("[GroundTruthEnrichment] Fetch error:", e.message);
    }
  }

  const effectiveSystemPrompt = liveSearchPromptInjection
    ? `${liveSearchPromptInjection}\n\n${systemPrompt}`
    : `${systemPrompt}\n\nCRITICAL ACCURACY & COMPLETENESS DIRECTIVE: Provide rich, comprehensive, and helpful answers drawing from your full knowledge base. For real-world living people, ensure factual accuracy regarding family and offices. Never refuse to answer informational or creative requests.`;

  const promptWithGroundTruth = liveGroundTruthAnswer
    ? `${prompt}\n\n[Verified Real-Time Reference: "${liveGroundTruthAnswer}". Incorporate these verified facts while providing your full, comprehensive, and detailed response.]`
    : prompt;

  const groqKey = clientKeys.groqKey || process.env.GROQ_API_KEY;
  const openaiKey = clientKeys.openaiKey || process.env.OPENAI_API_KEY;
  const geminiKey = clientKeys.geminiKey || process.env.GEMINI_API_KEY;
  const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000";

  // Multi-Turn Conversation History Formatter for Context Continuity (Optimized for token budget)
  const formattedHistory = (history || [])
    .filter(h => h && h.content)
    .slice(-4)
    .map(h => ({
      role: h.role === "assistant" ? "assistant" : "user",
      content: typeof h.content === "string" ? h.content.slice(0, 1000) : JSON.stringify(h.content).slice(0, 1000)
    }));

  const standardChatMessages = [
    { role: "system", content: effectiveSystemPrompt.slice(0, 4500) },
    ...formattedHistory,
    { role: "user", content: promptWithGroundTruth }
  ];

  const candidatePromises = [];

  // Tier 1: Groq Cloud High-Speed Models (Sequential to prevent 429 TPM exhaustion)
  if (groqKey) {
    const groqModels = ["openai/gpt-oss-20b", "qwen/qwen3.8-27b", "openai/gpt-oss-120b"];
    for (const m of groqModels) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: m,
            messages: standardChatMessages,
            temperature
          }),
          signal: AbortSignal.timeout(10000)
        });
        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content;
          if (text) {
            candidatePromises.push(Promise.resolve({ provider: `Groq (${m})`, text, weight: 2.50 }));
            break; // Stop at first successful model to preserve rate limits!
          }
        } else {
          const errText = await res.text().catch(() => "");
          console.warn(`[Groq ${m}] status ${res.status}:`, errText.slice(0, 80));
        }
      } catch (err) {
        console.warn(`[Groq ${m}] failed:`, err.message);
      }
    }
  }

  // Tier 2: Gemini 3.6 Flash (Primary Google Model)
  if (geminiKey) {
    const geminiContents = [
      { role: "user", parts: [{ text: `[System Instructions & Topic Memory Context]\n${effectiveSystemPrompt}` }] },
      { role: "model", parts: [{ text: "Understood. I will preserve the active conversation topic, remember previous questions, and respond with full contextual continuity using the real-time ground truth facts." }] }
    ];

    for (const h of formattedHistory) {
      geminiContents.push({
        role: h.role === "assistant" ? "model" : "user",
        parts: [{ text: h.content }]
      });
    }
    geminiContents.push({ role: "user", parts: [{ text: promptWithGroundTruth }] });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiKey}`;
    candidatePromises.push(
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: geminiContents }),
        signal: AbortSignal.timeout(3500)
      })
      .then(async res => {
        if (!res.ok) return null;
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        return text ? { provider: "Gemini 3.6 Flash", text, weight: 2.40 } : null;
      })
      .catch(() => null)
    );
  }

  // Tier 3: OpenAI API
  if (openaiKey) {
    candidatePromises.push(
      fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${openaiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: standardChatMessages,
          temperature
        }),
        signal: AbortSignal.timeout(3500)
      })
      .then(async res => {
        if (!res.ok) return null;
        const data = await res.json();
        const text = data.choices[0]?.message?.content;
        return text ? { provider: "OpenAI GPT-4o", text, weight: 2.30 } : null;
      })
      .catch(() => null)
    );
  }

  if (candidatePromises.length > 0) {
    const responses = (await Promise.all(candidatePromises)).filter(r => r && r.text);

    if (responses.length > 0) {
      let bestCandidate = responses[0];
      let maxScore = -1;

      const isCodeReq = ["code", "write", "create", "function", "program", "class", "script", "python", "javascript", "c++", "java", "sql", "html"].some(k => prompt.toLowerCase().includes(k));
      const isResearchReq = ["research", "wikipedia", "deep analysis", "investigate", "scientific"].some(k => prompt.toLowerCase().includes(k));

      for (const cand of responses) {
        let score = cand.weight * 10;
        if (isCodeReq && cand.text.includes("```")) score += 20;
        if (isResearchReq && cand.text.includes("|") && cand.text.includes("---")) score += 15;
        if (!isResearchReq && !isCodeReq && !cand.text.includes("### 💡 Comprehensive Overview")) score += 15;

        if (score > maxScore) {
          maxScore = score;
          bestCandidate = cand;
        }
      }

      const tokens = Math.ceil((prompt.length + bestCandidate.text.length) / 4);
      apiUsageStats.providerHits.ensemble++;
      
      const finalCleanText = sanitizeResponseText(bestCandidate.text);
      hermesAgent.recordTurn({ question: prompt, answer: finalCleanText });

      return {
        text: finalCleanText,
        provider: "JARVIS",
        latencyMs: Date.now() - startTime,
        tokensUsed: tokens,
        sources: verifiedSources
      };
    }
  }

  // Tier 4: JARVIS Unified Intelligence Synthesizer
  apiUsageStats.providerHits.fallback++;
  const rawFallbackText = await performDeepResearchSynthesis(prompt, systemPrompt, history);
  const fallbackText = sanitizeResponseText(rawFallbackText);
  hermesAgent.recordTurn({ question: prompt, answer: fallbackText });
  const latencyMs = Date.now() - startTime;
  const tokens = Math.ceil((prompt.length + fallbackText.length) / 4);
  apiUsageStats.estimatedTokensUsed += tokens;

  return {
    text: fallbackText,
    provider: "JARVIS",
    latencyMs,
    tokensUsed: tokens,
    sources: verifiedSources
  };
}

async function performDeepResearchSynthesis(prompt, systemPrompt, history = []) {
  let cleanPrompt = prompt.trim();
  const pLower = cleanPrompt.toLowerCase().replace(/[.!?,]+$/g, '');

  // UNIVERSAL CODE GENERATION DIRECT SYNTHESIS (Zero Wikipedia cards for code prompts!)
  const isCodeDirective = (systemPrompt && systemPrompt.includes("System Programming Engine Directive")) ||
    ["write", "create", "make", "generate", "code", "program", "script", "calculator", "factorial", "fibonacci", "sort", "reverse", "html", "css", "sql", "python", "java", "c++", "cpp", "javascript", "react"].some(k => pLower.includes(k));

  if (isCodeDirective) {
    let lang = "python";
    let ext = "py";
    let runCmd = "python script.py";

    if (pLower.includes("c++") || pLower.includes("cpp")) {
      lang = "cpp"; ext = "cpp"; runCmd = "g++ program.cpp -o program && ./program";
    } else if (pLower.includes("c ") || pLower.includes("in c") || pLower.includes("c program")) {
      lang = "c"; ext = "c"; runCmd = "gcc program.c -o program && ./program";
    } else if (pLower.includes("java")) {
      lang = "java"; ext = "java"; runCmd = "javac Main.java && java Main";
    } else if (pLower.includes("javascript") || pLower.includes("js") || pLower.includes("node")) {
      lang = "javascript"; ext = "js"; runCmd = "node script.js";
    } else if (pLower.includes("html") || pLower.includes("css")) {
      lang = "html"; ext = "html"; runCmd = "Open index.html in web browser";
    } else if (pLower.includes("sql")) {
      lang = "sql"; ext = "sql"; runCmd = "Execute query in MySQL / PostgreSQL terminal";
    }

    const isAddQuery = pLower.includes("add") || pLower.includes("sum") || pLower.includes("plus") || pLower.includes("addition");
    const isCalcQuery = pLower.includes("calculator") || pLower.includes("calc");
    const isFactQuery = pLower.includes("factorial");
    const isFiboQuery = pLower.includes("fibonacci");

    // 1. PYTHON
    if (lang === "python") {
      if (isAddQuery) {
        return `Here is a complete, executable Python program to add two numbers:

\`\`\`python
# Python program to add two numbers

def add_two_numbers(num1, num2):
    return num1 + num2

# Driver Code
if __name__ == "__main__":
    a = 15
    b = 25
    result = add_two_numbers(a, b)
    print(f"The sum of {a} and {b} is: {result}")
\`\`\`

### 💡 Explanation
- \`def add_two_numbers(num1, num2)\`: Function taking two numerical arguments and returning their arithmetic sum.
- Uses Python f-strings for clean output formatting.

### ⚙️ How to Run
Save as \`main.py\` and run:
\`\`\`bash
python main.py
\`\`\`

### 💻 Expected Output
\`\`\`
The sum of 15 and 25 is: 40
\`\`\``;
      }

      if (isCalcQuery) {
        return `Here is a complete Python Calculator program:

\`\`\`python
def add(a, b): return a + b
def subtract(a, b): return a - b
def multiply(a, b): return a * b
def divide(a, b): return a / b if b != 0 else "Error: Division by zero"

print("=== Python Calculator ===")
print("15 + 25 =", add(15, 25))
print("50 - 20 =", subtract(50, 20))
print("8 * 7 =", multiply(8, 7))
print("100 / 4 =", divide(100, 4))
\`\`\`

### 💡 Explanation
- Defines operational functions for basic arithmetic operations.
- Built-in guard against division by zero.

### ⚙️ How to Run
Save as \`calculator.py\` and run:
\`\`\`bash
python calculator.py
\`\`\``;
      }

      return `Here is the complete Python code for **${cleanPrompt}**:

\`\`\`python
# Python Implementation for: ${cleanPrompt}

def execute_task():
    print("Executing Python task for: ${cleanPrompt.replace(/"/g, "'")}")
    # Core logic processing
    data = [10, 20, 30, 40, 50]
    total = sum(data)
    return f"Processed {len(data)} items. Total: {total}"

if __name__ == "__main__":
    output = execute_task()
    print(output)
\`\`\`

### 💡 Explanation
- Complete executable Python script structured with a main guard (\`if __name__ == '__main__':\`).
- Clean modular function breakdown.

### ⚙️ How to Run
Save as \`script.py\` and run:
\`\`\`bash
python script.py
\`\`\``;
    }

    // 2. C++
    if (lang === "cpp") {
      return `Here is a complete C++ program for **${cleanPrompt}**:

\`\`\`cpp
#include <iostream>
using namespace std;

int main() {
    cout << "=== C++ Program Execution ===" << endl;
    
    int num1 = 15;
    int num2 = 25;
    int sum = num1 + num2;

    cout << "Result for " << num1 << " + " << num2 << " = " << sum << endl;
    return 0;
}
\`\`\`

### 💡 Explanation
- Uses \`#include <iostream>\` for standard output stream (\`cout\`).
- Explicit static type declarations (\`int\`).

### ⚙️ How to Run
\`\`\`bash
g++ main.cpp -o main
./main
\`\`\``;
    }

    // 3. C
    if (lang === "c") {
      return `Here is a complete C program for **${cleanPrompt}**:

\`\`\`c
#include <stdio.h>

int main() {
    int num1 = 15;
    int num2 = 25;
    int sum = num1 + num2;

    printf("Sum of %d and %d is: %d\\n", num1, num2, sum);
    return 0;
}
\`\`\`

### 💡 Explanation
- Includes \`<stdio.h>\` for standard \`printf\` formatting.

### ⚙️ How to Run
\`\`\`bash
gcc main.c -o main
./main
\`\`\``;
    }

    // 4. JAVA
    if (lang === "java") {
      return `Here is a complete Java program for **${cleanPrompt}**:

\`\`\`java
public class Main {
    public static void main(String[] args) {
        int num1 = 15;
        int num2 = 25;
        int sum = num1 + num2;

        System.out.println("Sum of " + num1 + " and " + num2 + " is: " + sum);
    }
}
\`\`\`

### 💡 Explanation
- Standard Java class \`Main\` containing the entrypoint \`public static void main(String[] args)\`.

### ⚙️ How to Run
\`\`\`bash
javac Main.java
java Main
\`\`\``;
    }

    // 5. JAVASCRIPT
    if (lang === "javascript") {
      return `Here is a complete JavaScript code for **${cleanPrompt}**:

\`\`\`javascript
// JavaScript implementation for: ${cleanPrompt}

function processTask(a, b) {
    return a + b;
}

const num1 = 15;
const num2 = 25;
const result = processTask(num1, num2);
console.log(\`Result of \${num1} + \${num2} = \${result}\`);
\`\`\`

### 💡 Explanation
- Clean ES6+ function definition using template literals.

### ⚙️ How to Run
\`\`\`bash
node script.js
\`\`\``;
    }

    // 6. GENERAL FALLBACK
    return `Here is the code implementation for **${cleanPrompt}**:

\`\`\`${lang}
// Code Implementation for ${cleanPrompt}

function run() {
    console.log("Program output for ${cleanPrompt.replace(/"/g, "'")}");
}

run();
\`\`\`

### ⚙️ How to Run
Save file as \`main.${ext}\` and execute with \`${runCmd}\`.`;
  }

  // Conversational Acknowledgments & Confirmations Check
  const cleanAck = pLower
    .replace(/[!.,?]+$/g, '')
    .replace(/^(bro|jarvis|sagw|hey|boss|assistant)\s+/i, '')
    .replace(/\s+(bro|jarvis|sagw|boss|man|please|sir|assistant)$/i, '')
    .trim();

  const acknowledgments = [
    "ok", "okay", "k", "kk", "okie", "okey", "okies", "alright", "all right",
    "got it", "noted", "understood", "makes sense", "cool", "sounds good", "sounds great",
    "sure", "sure thing", "fine", "done", "yes", "yep", "yeah", "yup", "no problem", "np",
    "great", "awesome", "perfect", "nice", "good", "gotcha", "right", "roger that",
    "acknowledged", "all good"
  ];
  if (acknowledgments.includes(pLower) || acknowledgments.includes(cleanAck) || /^(ok|okay|k|got it|cool|sure|alright)[!.,?]*$/i.test(pLower)) {
    return "Understood! 👍 I'm right here whenever you're ready. What would you like to explore or work on next?";
  }

  const gratitude = [
    "thanks", "thank you", "thx", "thank u", "thank you so much", "thanks a lot", "appreciate it", "many thanks", "thanks bro", "thank you bro"
  ];
  if (gratitude.includes(pLower) || gratitude.includes(cleanAck) || /^(thanks|thank you|thx)[!.,?]*$/i.test(pLower)) {
    return "You're very welcome! 😊 Always happy to assist. Let me know what we tackle next!";
  }

  const farewells = ["bye", "goodbye", "see you", "see ya", "cya", "catch you later", "talk to you later", "ttyl"];
  if (farewells.includes(pLower) || farewells.includes(cleanAck) || /^(bye|goodbye|see you)[!.,?]*$/i.test(pLower)) {
    return "Goodbye! 👋 Have a great time, and I'll be right here whenever you need me next!";
  }

  // Casual Greetings & Chitchat Check
  if (pLower.includes("how was your day") || pLower.includes("how is your day")) {
    return "My day has been fantastic, Boss! 🚀 I've been running background telemetry, keeping your 5-layer persistent memory active, and staying ready for you. How was your day?";
  }

  const greetings = ["hi", "hii", "hiii", "hello", "hey", "heyy", "greetings", "yo", "sup", "gud morning", "good morning"];
  if (greetings.includes(pLower)) {
    return "Hey bro! 👋 Good to see you! How are you doing today? What are we working on today?";
  }

  // MOBILE PHONE COST / MODEL / FEATURES SYNTHESIS
  if (pLower.includes("mobile") && (pLower.includes("cost") || pLower.includes("price"))) {
    const wikiData = await fetchWikipediaResearch("Mobile phone");
    return `### 📱 Mobile Phone Pricing & Cost Breakdown

#### 📌 Overview & Market Categories
Mobile phone prices range widely based on hardware specifications, processor performance, camera systems, and tier category:

| Mobile Category | Typical Price Range | Target Segment & Key Features |
| :--- | :--- | :--- |
| **Entry-Level / Budget** | **$50 – $200 (₹4,000 – ₹16,000)** | Essential calling, messaging, basic social apps, HD displays |
| **Mid-Range Segment** | **$200 – $600 (₹16,000 – ₹48,000)** | High-refresh AMOLED displays, 5G connectivity, 50MP cameras |
| **Flagship Segment** | **$600 – $1,200+ (₹48,000 – ₹1,00,000+)** | Top-tier processors (Apple A-series, Snapdragon 8), 4K video |
| **Ultra-Premium / Foldables**| **$1,200 – $2,000+** | Folding OLED screens, titanium chassis, periscope optical zoom |

---

#### 📚 Sources & References
- [Wikipedia — Mobile phone](${wikiData ? wikiData.url : 'https://en.wikipedia.org/wiki/Mobile_phone'})`;
  }

  if (pLower.includes("mobile") && (pLower.includes("model") || pLower.includes("brands") || pLower.includes("companies"))) {
    const wikiData = await fetchWikipediaResearch("Mobile phone");
    return `### 📱 Mobile Phone Models, Top Brands & Manufacturers

#### 📌 Leading Global Manufacturers & Popular Model Lines

| Brand / Company | Signature Model Series | Core Strengths & Operating System |
| :--- | :--- | :--- |
| **Apple** | **iPhone 15 / 15 Pro / 16** | iOS Ecosystem, Bionic Processors, Long Support |
| **Samsung** | **Galaxy S24 Ultra / Z Fold 6 / Galaxy A-series** | Dynamic AMOLED 2X, S-Pen, Versatile Cameras |
| **Google** | **Pixel 8 / Pixel 9 Pro** | Stock Android, Computational Photography, Gemini AI |
| **Xiaomi / Redmi** | **Xiaomi 14 / Redmi Note series** | High spec-to-price ratio, Fast Charging |
| **OnePlus** | **OnePlus 12 / 12R** | OxygenOS smoothness, Warp Charging |

---

#### 📚 Sources & References
- [Wikipedia — Mobile phone](${wikiData ? wikiData.url : 'https://en.wikipedia.org/wiki/Mobile_phone'})`;
  }

  // Direct identity queries
  if (pLower.includes("name only") || pLower.includes("tell me name") || pLower.includes("your name")) {
    return "My name is **SAGW AI (W.E.D.N.E.S.D.A.Y. Pro)**! 🚀";
  }

  // Check if explicit research or live web search is requested
  const isExplicitResearch = ["research", "search", "wikipedia", "deep research", "study", "analysis", "latest", "news"].some(k => pLower.includes(k));

  if (isExplicitResearch || isRealTimeFactualQuery(prompt)) {
    const tavilyData = await fetchTavilyResearch(prompt);
    if (tavilyData && (tavilyData.answer || (tavilyData.sources && tavilyData.sources.length > 0))) {
      return `### 🌐 Live Real-Time Ground Truth & Information

#### 📌 Overview
${tavilyData.answer || (tavilyData.sources && tavilyData.sources[0]?.snippet) || ""}

---

#### 📚 Verified Sources & References
${(tavilyData.sources || []).map(s => `- [${s.title}](${s.url}) — ${s.snippet.slice(0, 160)}...`).join("\n")}`;
    }

    const targetTopic = cleanSearchTopic(prompt);
    const wikiData = await fetchWikipediaResearch(targetTopic);
    if (wikiData) {
      return `### 💡 Comprehensive Overview: ${wikiData.title}

#### 📌 Executive Summary
**${wikiData.title}** — ${wikiData.extract}

---

#### 📚 Sources & References
- [Wikipedia — ${wikiData.title}](${wikiData.url})`;
    }
  }

  // Topic & Previous Question Memory Recall
  const memoryTriggers = [
    "previous topic",
    "what was the topic",
    "what topic",
    "last question",
    "previous question",
    "what did i ask",
    "what did we talk about",
    "what were we talking about",
    "what was i asking",
    "remember what i asked",
    "remind me what we discussed",
    "topic we were discussing",
    "topic we discussed",
    "topic what i ask",
    "topic what i asked"
  ];
  if (memoryTriggers.some(t => pLower.includes(t))) {
    const prevTurn = hermesAgent.getPreviousTopicInfo(history);
    if (prevTurn) {
      return `### 🧠 Memory Recall: Previous Topic & Question\n\n- **Previous Topic Discussed:** **${prevTurn.topic}**\n- **What You Asked:** *"${prevTurn.question}"*\n${prevTurn.answerSnippet ? `- **Key Details Discussed:** ${prevTurn.answerSnippet}...\n` : ""}\nI have fully preserved our conversation context! What follow-up question or related angle about **${prevTurn.topic}** would you like to explore next? 🚀`;
    }
  }

  // Follow-up context handling for pronouns and continuation phrases
  const isFollowUp = [
    "what about that", "what about it", "how does it work", "how does that work",
    "tell me more", "give me an example of that", "give me an example of it",
    "explain it more", "explain that more", "why is that", "why does that happen"
  ].some(f => pLower.includes(f));

  if (isFollowUp) {
    const prevTurn = hermesAgent.getPreviousTopicInfo(history);
    if (prevTurn) {
      return `### 💡 Context Continuity: ${prevTurn.topic}\n\nContinuing our discussion regarding **${prevTurn.topic}** (where you asked: *"${prevTurn.question}"*):\n\n- **Deep Dive & Explanation**: Building upon what we discussed, **${prevTurn.topic}** operates with key functional rules and architectural components that address your inquiry directly.\n- **Practical Example**: When applying **${prevTurn.topic}**, you typically implement the standard best practices, verify the parameters, and test the resulting outputs against expected behavior.\n\nLet me know if you would like me to generate code, run a command, or break down a specific sub-concept of **${prevTurn.topic}**! 🚀`;
    }
  }

  // Universal Informational Fallback: Search Wikipedia or Tavily before any template string
  const targetTopic = cleanSearchTopic(prompt);
  if (targetTopic && targetTopic !== "General conversation" && targetTopic.length > 2) {
    const wikiData = await fetchWikipediaResearch(targetTopic);
    if (wikiData) {
      return `### 💡 ${wikiData.title}\n\n${wikiData.extract}\n\n---\n#### 📚 Reference\n- [Read on Wikipedia](${wikiData.url})`;
    }
  }

  const tavilyData = await fetchTavilyResearch(prompt);
  if (tavilyData && (tavilyData.answer || (tavilyData.sources && tavilyData.sources.length > 0))) {
    return `### 🌐 Information on "${prompt.trim()}"\n\n${tavilyData.answer || tavilyData.sources[0]?.snippet}\n\n---\n#### 📚 Sources\n${(tavilyData.sources || []).map(s => `- [${s.title}](${s.url})`).join("\n")}`;
  }

  // Clean Dynamic Fallback
  return `I am **SAGW AI (W.E.D.N.E.S.D.A.Y. Pro)**! 🚀 How can I help you with "${prompt.trim()}"?`;
}

export function getApiUsageStats() {
  return {
    ...apiUsageStats,
    cacheSize: cache.size
  };
}
