import os from "os";
import { getPersonaPrompt } from "./personaEngine.js";
import { analyzeEmotion } from "./emotionEngine.js";
import { getUserFacts, getUserProfile, getFormattedUserProfile, getProjectProfile, getAllProjects, extractAndStoreFacts, updateProjectProfile } from "./memoryStore.js";
import { isAuthorizedAdminEmail } from "../modules/authManager.js";
import { toolRegistry } from "./toolRegistry.js";
import { dispatchLLMRequest, getApiUsageStats } from "./providerGateway.js";
import { executePCACACycle, globalStateManager } from "./pcacaEngine.js";
import { detectProgrammingLanguage, classifyProgrammingIntent, formatCodeResponse, globalCodeState } from "./codeEngine.js";
import { pcDataTrainer } from "./pcDataTrainerEngine.js";
import { hermesAgent } from "../agent/hermesAgent.js";
import { generateOnDemandFile } from "../modules/fileGenerator.js";
import { db } from "../data/db.js";

function getSystemEnvironmentInfo() {
  const now = new Date();
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = days[now.getDay()];
  const dateStr = now.toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const platformMap = {
    win32: "Windows OS",
    darwin: "macOS",
    linux: "Linux OS"
  };

  const sysPlatform = platformMap[os.platform()] || os.platform();
  const arch = os.arch();
  const cpus = os.cpus();
  const cpuModel = cpus && cpus.length > 0 ? cpus[0].model : "Unknown CPU";
  const totalMemGB = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2);
  const freeMemGB = (os.freemem() / (1024 * 1024 * 1024)).toFixed(2);
  const hostname = os.hostname();
  const uptimeMinutes = Math.floor(os.uptime() / 60);

  return {
    dayName,
    dateStr,
    timeStr,
    timeZone,
    fullDateTime: `${dayName}, ${dateStr} at ${timeStr} (${timeZone})`,
    sysPlatform,
    arch,
    cpuModel,
    cpusCount: cpus ? cpus.length : 0,
    totalMemGB,
    freeMemGB,
    hostname,
    uptimeMinutes
  };
}

// Session Memory Store
const sessionMemoryStore = {
  currentTopic: null,
  previousTopic: null,
  topicHistory: [],
  lastQuestion: null,
  subtopic: null,
  activeObject: null,
  activeTask: null,
  accumulatedRequirements: [],
  activeContact: null,
  activeApp: null,
  activeEntities: [],
  conversationHistory: []
};

const TYPO_DICTIONARY = {
  gud: "good",
  mrng: "morning",
  mornng: "morning",
  morng: "morning",
  hw: "how",
  wht: "what",
  waht: "what",
  ths: "this",
  abt: "about",
  abot: "about",
  tel: "tell",
  msny: "many",
  mny: "many",
  tempretaure: "temperature",
  temprature: "temperature",
  erth: "earth",
  plains: "plans",
  fellings: "feelings",
  feling: "feeling",
  felings: "feelings",
  spiiling: "spelling",
  spiling: "spelling",
  grammer: "grammar",
  gramer: "grammar",
  sentance: "sentence",
  sentense: "sentence",
  intract: "interact",
  mechine: "machine",
  learing: "learning",
  convarsation: "conversation",
  convasation: "conversation"
};

// Fast Levenshtein Distance for Phonetic & Typo Correction
function getLevenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

const DICTIONARY_WORDS = [
  "feelings", "feeling", "spelling", "grammar", "sentence", "interact", "machine",
  "learning", "conversation", "understand", "answering", "question", "favorite",
  "hobbies", "python", "javascript", "developer", "assistant", "bro", "boss", "programming"
];

function normalizeNaturalInput(raw) {
  if (!raw) return "";
  let text = raw.trim();

  text = text
    .replace(/\byour plains\b/gi, "your plans")
    .replace(/\bmy plains\b/gi, "my plans")
    .replace(/\btoday plains\b/gi, "today plans");

  const words = text.split(/\s+/);
  const normalized = words.map((w) => {
    const cleanWord = w.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!cleanWord) return w;
    if (TYPO_DICTIONARY[cleanWord]) return TYPO_DICTIONARY[cleanWord];

    // Fuzzy Match for typos > 3 chars
    if (cleanWord.length >= 4) {
      for (const dictWord of DICTIONARY_WORDS) {
        if (Math.abs(dictWord.length - cleanWord.length) <= 2) {
          const dist = getLevenshteinDistance(cleanWord, dictWord);
          if (dist <= 2) {
            return dictWord;
          }
        }
      }
    }
    return w;
  });

  return normalized.join(" ");
}

function cleanConversationalPrefix(text) {
  if (!text) return "";
  let clean = text.trim();

  clean = clean
    .replace(/^(i am asking|i want to know|can you tell me|please tell me|tell me|can you explain|explain|show me|search for|search the web for|what is the|what is|wht is|waht is)\s+/gi, "")
    .trim();

  return clean;
}

function isCasualOrChitchatQuery(pLower, userContext = null) {
  const words = pLower.split(/\s+/);
  const profile = getUserProfile();
  const rawUserName = userContext?.name || userContext?.username || profile.personal?.name || "Karthik";
  const userRole = userContext?.role || (userContext?.email === "karthikhruth@gmail.com" ? "ADMIN" : "");
  const isKarthikAdmin = userRole === "ADMIN" || rawUserName.toLowerCase().includes("karthik");
  const callsign = isKarthikAdmin ? (profile.personal?.callsign || "Boss Karthik") : rawUserName;

  const cleanAck = pLower
    .replace(/[!.,?]+$/g, '')
    .replace(/^(bro|jarvis|sagw|hey|boss|assistant)\s+/i, '')
    .replace(/\s+(bro|jarvis|sagw|boss|man|please|sir|assistant)$/i, '')
    .trim();

  // 1. Conversational Acknowledgments & Affirmations (e.g. "ok", "okay", "got it", "cool", "sure", "alright")
  const ackList = [
    "ok", "okay", "k", "kk", "okie", "okey", "okies", "alright", "all right",
    "got it", "noted", "understood", "makes sense", "cool", "sounds good", "sounds great",
    "sure", "sure thing", "fine", "done", "yes", "yep", "yeah", "yup", "no problem", "np",
    "great", "awesome", "perfect", "nice", "good", "gotcha", "right", "roger that",
    "acknowledged", "all good", "understood bro", "got it bro", "cool bro", "ok bro", "okay bro",
    "ok jarvis", "okay jarvis", "got it jarvis", "cool jarvis", "ok sagw", "okay sagw",
    "understood jarvis", "fine bro", "sure bro", "right bro", "nice bro", "good bro"
  ];
  if (ackList.includes(pLower) || ackList.includes(cleanAck) || /^(ok|okay|k|got it|cool|sure|alright)[!.,?]*$/i.test(pLower)) {
    const ackResponses = [
      `Understood, ${callsign}! 👍 I'm right here whenever you're ready. What would you like to work on or explore next?`,
      `Got it, ${callsign}! 👍 Standing by. What's our next step?`,
      `All set, ${callsign}! 🚀 Let me know what you need next.`
    ];
    return {
      isCasual: true,
      response: ackResponses[Math.floor(Math.random() * ackResponses.length)]
    };
  }

  // 1.1 Gratitude & Appreciation (e.g. "thanks", "thank you", "appreciate it")
  const gratitudeList = [
    "thanks", "thank you", "thx", "thank u", "thank you so much", "thanks a lot",
    "appreciate it", "many thanks", "thanks bro", "thank you bro", "thanks jarvis",
    "thank you jarvis", "nice work", "good job", "well done", "awesome job", "great job"
  ];
  if (gratitudeList.includes(pLower) || gratitudeList.includes(cleanAck) || /^(thanks|thank you|thx)[!.,?]*$/i.test(pLower)) {
    const gratitudeResponses = [
      `You're very welcome, ${callsign}! 😊 Always happy to assist. Let me know what we tackle next!`,
      `Anytime, ${callsign}! 🚀 Glad I could assist you. What are we building next?`,
      `Always a pleasure, ${callsign}! 👍 Ready whenever you have another task or question.`
    ];
    return {
      isCasual: true,
      response: gratitudeResponses[Math.floor(Math.random() * gratitudeResponses.length)]
    };
  }

  // 1.2 Farewells & Goodbyes
  const farewellList = [
    "bye", "goodbye", "see you", "see ya", "cya", "catch you later", "talk to you later",
    "ttyl", "bye bro", "goodbye bro", "bye jarvis", "see you later"
  ];
  if (farewellList.includes(pLower) || farewellList.includes(cleanAck) || /^(bye|goodbye|see you)[!.,?]*$/i.test(pLower)) {
    return {
      isCasual: true,
      response: `Goodbye, ${callsign}! 👋 Have a great time, and I'll be right here whenever you need me next!`
    };
  }

  // 1.3 Reactions & Light Humor
  const reactionList = ["haha", "hahaha", "hahahaha", "lol", "lmao", "rofl", "hehe", "wow"];
  if (reactionList.includes(pLower) || reactionList.includes(cleanAck)) {
    return {
      isCasual: true,
      response: `😄 Always keeping the energy high, ${callsign}! What's on our agenda next?`
    };
  }

  // 2. Plans & Activity Questions
  if (pLower.includes("plan") || pLower.includes("plans") || pLower.includes("plains") || pLower.includes("agenda")) {
    if (pLower.includes("today") || pLower.includes("your") || pLower.includes("what")) {
      return {
        isCasual: true,
        response: `My plan today is to assist you, ${callsign}! 🚀 I'm here to help with full-stack development, memory tracking, and deep research. What are we building or exploring today?`
      };
    }
  }

  // 3. Day / How was your day questions
  if (pLower.includes("how was your day") || pLower.includes("how is your day") || pLower.includes("how was day") || pLower.includes("how is day") || pLower.includes("hows your day")) {
    return {
      isCasual: true,
      response: `My day has been fantastic, ${callsign}! 🚀 I've been running telemetry checks, preserving context memory, and staying ready for you. How was your day?`
    };
  }

  // 4. Greetings
  const greetings = [
    "hi", "hii", "hiii", "hello", "hey", "heyy", "gud morning", "good morning",
    "good evening", "good afternoon", "good night", "greetings", "yo", "sup", "whats up",
    "hey bro", "hi bro", "hello bro", "gud morning bro", "good morning bro"
  ];

  if (greetings.includes(pLower) || (words.length <= 3 && greetings.some(g => pLower.startsWith(g)))) {
    const greetingsList = [
      `Hey ${callsign}! 👋 Good to see you! How are you doing today?`,
      `Good morning ${callsign}! 😊 Ready when you are! What are we working on today?`,
      `Hey ${callsign}! 👋 Always here for you bro. What's on your mind today?`
    ];
    const chosen = greetingsList[Math.floor(Math.random() * greetingsList.length)];
    return { isCasual: true, response: chosen };
  }

  // 5. Feelings & Opinion about User
  const feelingsTriggers = ["fellings about me", "feelings about me", "opinion about me", "opinion of me", "think about me", "think of me", "feel about me", "feelings for me", "thoughts on me"];
  if (feelingsTriggers.some(t => pLower.includes(t))) {
    return {
      isCasual: true,
      response: `I hold you in the highest regard, ${callsign}! 🚀 You are an exceptionally talented user and visionary. Working with you on computer science, full-stack AI architecture, and multi-model machine learning is an incredible experience. I am 100% dedicated to supporting your projects and helping you build next-generation AI systems!`
    };
  }

  // 6. Founder & Creator Identity
  const founderTriggers = [
    "founder", "founders", "who founded", "founder name", "your founder", "ur founder",
    "who is your founder", "who is ur founder", "tell me your founder", "tell me ur founder",
    "tell me founder name", "tell me ur founder name", "tell me your founder name",
    "who created you", "who created u", "who made you", "who made u", "who built you",
    "who built u", "who developed you", "who developed u", "who is your creator",
    "who is ur creator", "who is the founder", "who is your owner", "who owns you",
    "who is your developer", "who programmed you", "who designed you"
  ];
  if (
    founderTriggers.some(t => pLower.includes(t)) ||
    ((pLower.includes("founder") || pLower.includes("created you") || pLower.includes("built you") || pLower.includes("made you")) &&
     (pLower.includes("who") || pLower.includes("tell") || pLower.includes("name") || pLower.includes("your") || pLower.includes("ur")))
  ) {
    const greeting = isKarthikAdmin
      ? `Hey ${callsign}! 👋  \nLet's break it down:`
      : `Hey there! 👋  \nLet's break it down:`;

    const founderCell = isKarthikAdmin
      ? `**Karthik (${callsign})** – You are my **Founder, Creator, and Chief Architect**! You launched and engineered **SAGW AI (W.E.D.N.E.S.D.A.Y. Pro)**, architecting its entire multi-LLM ensemble gateway, in-app firewall security shield, 5-layer persistent memory network, and local ML engines.`
      : `**Karthik (Boss Karthik)** – He is the **Founder, Creator, and Chief Architect** of **SAGW AI (W.E.D.N.E.S.D.A.Y. Pro)**. He engineered the platform from the ground up, integrating multi-LLM ensemble intelligence with persistent memory and cybersecurity firewalls.`;

    const tableResponse = `${greeting}

| Question | Answer |
|----------|--------|
| **Who founded SAGW AI?** | ${founderCell} |
| **Is SAGW AI secure?** | Yes. The core of SAGW AI's value proposition is *security & zero data leakage*. It features an active In-App Web Application Firewall (WAF Shield/2.0), honeypot traps, SQLi/XSS filters, rate limiting, and private memory isolation so your codebase and data stay completely safe. |
| **What about me (J.A.R.V.I.S.)?** | I am your personal AI assistant engineered under Karthik's architecture, powered by a multi-LLM ensemble (Groq, Google Gemini, OpenAI, and local machine learning). I operate inside a hardened, sandboxed environment that strictly protects privacy and never reveals internal secrets or keys. |

### Quick recap of Karthik’s background
- **Founder & Chief Architect** of SAGW AI (W.E.D.N.E.S.D.A.Y. Pro).
- **Engineering Background**: Computer Science & Engineering specializing in AI Systems, Autonomous Multi-Agents, and Full-Stack Web Architecture.
- **Core Technical Stack**: JavaScript (ES6+), React.js & Vite, Node.js & Express Architecture, Python AI Development, Multi-LLM Ensemble Gateway, and 5-Layer Persistent Memory Networks.
- **Strategic Vision & Goals**: Building world-class next-generation AI assistants with deep research synthesis, intelligent context memory, and local offline dataset training.

### Security Highlights for SAGW AI
- **In-App Application Firewall (WAF Shield/2.0-Active)**: Real-time defense against automated vulnerability scanners, honeypot probes, and injection attacks.
- **Multi-LLM Ensemble Gateway**: Real-time fallback and orchestration across Groq, Gemini, OpenAI, and local machine learning models for 100% uptime.
- **5-Layer Context Memory**: Deep persistent memory across User Profile, Session State, Active Topics, Project Specs, and Local PC Datasets.
- **Zero-Leak Confidentiality**: End-to-end sandboxing, private credential isolation, and sanitized architecture outputs.

### How I keep your data safe
- **No unauthorized data storage**: All sessions are strictly private and isolated.
- **Encrypted transmission**: Protected by cryptographically hardened session tokens and TLS encryption.
- **No hard-coded secrets**: Zero exposure of environment variables (.env), API keys, or private databases.

Hope that clears things up! If you want more details—like a deeper dive into your architecture or roadmap—just let me know. 🚀`;

    return {
      isCasual: true,
      response: tableResponse
    };
  }

  // 7. Name & Identity
  const identityTriggers = ["what is your name", "whats your name", "what's your name", "who are you", "what are you called", "tell me your name", "your name"];
  if (identityTriggers.some(t => pLower.includes(t))) {
    return {
      isCasual: true,
      response: `I am **SAGW AI (W.E.D.N.E.S.D.A.Y. Pro)**! 🚀 I'm your unified personal AI assistant, powered by a multi-LLM ensemble gateway (Groq, Gemini, OpenAI, and Python Engine) with persistent 5-layer context memory and local machine learning dataset training. How can I assist you today, ${callsign}?`
    };
  }

  // 8. Casual chitchat & how are you
  const chitchat = [
    "how are you", "how are you doing", "how r u", "how are u", "how's it going", "hows it going",
    "what are you doing", "what are you up to", "are you my friend", "i just want to talk", "lets talk"
  ];
  if (chitchat.some(q => pLower.includes(q))) {
    return {
      isCasual: true,
      response: "I'm doing great bro! 🚀 Powered up, connected to memory, and ready to help you with anything—whether you want to chat casually or work on a project. How are you doing today?"
    };
  }

  return null;
}

function getActiveEntityFromHistory(history = []) {
  if (!history || !Array.isArray(history) || history.length === 0) return null;
  const followUpPattern = /^(i want full details|full details|more details|tell me more|give details|all details|complete details|full story|what did i ask|previous topic|explain more|more info)/i;

  for (let i = history.length - 1; i >= 0; i--) {
    const turn = history[i];
    if (!turn || !turn.content) continue;
    const text = typeof turn.content === "string" ? turn.content : "";

    if (turn.role === "user") {
      const cleaned = cleanConversationalPrefix(text.toLowerCase());
      if (cleaned && cleaned.length > 2 && !followUpPattern.test(cleaned)) {
        return cleaned;
      }
    }

    // Check for bold title in assistant message
    const boldMatches = [...text.matchAll(/\*\*([^*]{3,40})\*\*/g)];
    for (const match of boldMatches) {
      const cand = match[1].trim();
      if (!/^(role|setting|premise|franchise|notable|summary|overview|plot|cast|note|important|date|time)/i.test(cand)) {
        return cand;
      }
    }
  }
  return null;
}

// UNIVERSAL PROPERTY AUTO-LOOPING ENGINE
function resolveUniversalPropertyLoop(input, activeEntity) {
  if (!activeEntity) return null;

  const pLower = input.toLowerCase().trim().replace(/[.!?,]+$/g, '');
  const words = pLower.split(/\s+/);

  const universalMap = [
    { keys: ["i want full details", "full details", "more details", "details", "give details", "give full details", "all details", "complete details", "tell me more", "tell me details", "explain more", "give more details", "full explanation", "in detail", "full rundown", "detailed breakdown", "complete breakdown"], res: `Give me full, comprehensive details, complete storyline, key background, cast, and in-depth analysis of ${activeEntity}.`, sub: "full comprehensive details" },
    { keys: ["story", "plot", "full story", "what is the story", "synopsis", "storyline", "tell me the story"], res: `What is the full plot, story premise, and storyline of ${activeEntity}?`, sub: "storyline and plot" },
    { keys: ["cast", "actors", "star cast", "hero", "heroine", "characters", "who acted in it"], res: `Who are the main cast members and characters in ${activeEntity}?`, sub: "cast and characters" },
    { keys: ["director", "who directed it", "direction", "filmmaker"], res: `Who directed ${activeEntity} and what is their background?`, sub: "director and crew" },
    { keys: ["box office", "collection", "budget", "earnings", "hit or flop"], res: `What was the budget and box office collection of ${activeEntity}?`, sub: "box office and collection" },
    { keys: ["cost", "price", "pricing", "how much", "cost of that", "cost of it", "rate"], res: `What is the cost and price range of ${activeEntity}?`, sub: "cost and price range" },
    { keys: ["model", "models", "variant", "variants", "version", "versions"], res: `What are the models, variants, and top brands for ${activeEntity}?`, sub: "models and variants" },
    { keys: ["type", "types", "category", "categories", "kinds"], res: `What are the different types and categories of ${activeEntity}?`, sub: "types and categories" },
    { keys: ["company", "companies", "brand", "brands", "manufacturer", "manufacturers"], res: `Which top companies and brands produce ${activeEntity}?`, sub: "companies and brands" },
    { keys: ["feature", "features", "spec", "specs", "specification", "specifications"], res: `What are the key features and specifications of ${activeEntity}?`, sub: "features and specs" },
    { keys: ["advantage", "advantages", "benefit", "benefits", "pros", "cons", "pros and cons"], res: `What are the advantages, benefits, pros, and cons of ${activeEntity}?`, sub: "advantages and benefits" },
    { keys: ["use", "uses", "purpose", "application", "applications"], res: `What are the primary uses and applications of ${activeEntity}?`, sub: "uses and purpose" },
    { keys: ["shape", "the shape", "what shape"], res: `What is the shape of ${activeEntity}?`, sub: "shape and geodesy" },
    { keys: ["temperature", "temp", "thermal"], res: `What is the temperature profile of ${activeEntity}?`, sub: "temperature" },
    { keys: ["founder", "founders", "who founded"], res: `Who founded ${activeEntity}?`, sub: "founders and history" },
    { keys: ["history", "origin", "background"], res: `What is the history and origin of ${activeEntity}?`, sub: "history" },
    { keys: ["how to use", "how to run", "how it works", "run it"], res: `How do I use and run ${activeEntity}?`, sub: "execution guide" },
    { keys: ["best", "best ones", "top", "top 10"], res: `What are the top rated best options for ${activeEntity}?`, sub: "top rated recommendations" }
  ];

  for (const item of universalMap) {
    if (item.keys.includes(pLower) || item.keys.some(k => pLower === k || pLower.startsWith(k + " ") || pLower.endsWith(" " + k) || (k.length > 3 && pLower.includes(k)))) {
      return item;
    }
  }

  return null;
}

// Step 1 & 3: Universal Intent Classifier
function classifyUniversalIntent(pLower, rawInput, userContext = null) {
  const words = pLower.split(/\s+/);

  const casualCheck = isCasualOrChitchatQuery(pLower, userContext);
  if (casualCheck) {
    return { type: "CASUAL_CONVERSATION", capability: "NONE", reply: casualCheck.response };
  }

  // Check Universal Programming Intent
  const progIntent = classifyProgrammingIntent(rawInput);
  if (progIntent.needsCode) {
    return { type: "CODE_GENERATION", capability: "CODE_GEN", progIntent };
  }

  // Intent B: Identity & Self Profile Query
  if (pLower === "tell me about myself" || pLower === "tell me about my self" || pLower === "who am i" || pLower === "describe me" || pLower === "what do you know about me" || pLower.includes("tell me about my profile") || pLower.includes("tell me about myself") || pLower.includes("tell me about my self")) {
    return { type: "USER_PROFILE", capability: "MEMORY_READ" };
  }

  // Intent C: Project Document Query
  if (pLower.includes("project details") || pLower.includes("project pdf") || pLower.includes("project document") || pLower.includes("show my project") || pLower.includes("my project")) {
    return { type: "PROJECT_DOC", capability: "MEMORY_READ" };
  }

  // Intent C2: Safe Project File Structure & Architecture Example Query
  if (
    pLower.includes("file structure") ||
    pLower.includes("folder structure") ||
    pLower.includes("project structure") ||
    pLower.includes("directory structure") ||
    pLower.includes("files in project") ||
    pLower.includes("exact file structure") ||
    pLower.includes("project architecture") ||
    pLower.includes("project hierarchy") ||
    (pLower.includes("structure") && (pLower.includes("project") || pLower.includes("code") || pLower.includes("repo") || pLower.includes("app") || pLower.includes("bro")))
  ) {
    return { type: "PROJECT_STRUCTURE_EXAMPLE", capability: "SAFE_ARCHITECTURE_EXAMPLE" };
  }

  // Intent D: Explicit Deep Research Request
  if (pLower.startsWith("research ") || pLower.includes("deep research") || pLower.includes("complete analysis") || pLower.includes("detailed investigation") || pLower.includes("tell me everything about")) {
    return { type: "DEEP_RESEARCH", capability: "RESEARCH" };
  }

  // Intent E: Follow-Up / Property Query on Active Topic
  if (sessionMemoryStore.currentTopic && words.length <= 4) {
    return { type: "FOLLOW_UP", capability: "CONTEXT_LINK" };
  }

  // Default Intent F: Direct Conceptual Question / Standard Conversation
  return { type: "DIRECT_QUESTION", capability: "DIRECT_ANSWER" };
}

function resolveContextualQuery(input, history = []) {
  const pLower = input.toLowerCase().trim().replace(/[.!?,]+$/g, '');
  const strippedTopic = cleanConversationalPrefix(pLower);
  const intentInfo = classifyUniversalIntent(pLower, input);

  // 0. Context Reset
  if (pLower === "new topic" || pLower === "start fresh" || pLower === "forget this" || pLower === "new chat") {
    sessionMemoryStore.currentTopic = null;
    sessionMemoryStore.previousTopic = null;
    sessionMemoryStore.subtopic = null;
    sessionMemoryStore.activeObject = null;
    sessionMemoryStore.activeTask = null;
    sessionMemoryStore.accumulatedRequirements = [];
    sessionMemoryStore.activeContact = null;
    sessionMemoryStore.activeApp = null;
    sessionMemoryStore.conversationHistory = [];
    return { isReset: true, resolvedText: "Context reset successfully. How can I help you with a new topic?" };
  }

  // 0.1 Topic & Question Memory Recall
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
      return {
        isTopicRecall: true,
        resolvedText: `### 🧠 Memory Recall: Previous Topic & Question\n\n- **Previous Topic Discussed:** **${prevTurn.topic}**\n- **What You Asked:** *"${prevTurn.question}"*\n${prevTurn.answerSnippet ? `- **Key Details Discussed:** ${prevTurn.answerSnippet}...\n` : ""}\nI have fully preserved our conversation context! What follow-up question or related angle about **${prevTurn.topic}** would you like to explore next? 🚀`
      };
    }
  }

  // 1. Casual Greetings & Chitchat (NO Research, NO Search, NO Templates)
  if (intentInfo.type === "CASUAL_CONVERSATION") {
    return { isCasual: true, resolvedText: intentInfo.reply };
  }

  // 2. User Profile Query
  if (intentInfo.type === "USER_PROFILE") {
    return { isSelfProfile: true, resolvedText: getFormattedUserProfile() };
  }

  // 3. Project Document Query
  if (intentInfo.type === "PROJECT_DOC") {
    const projects = getAllProjects();
    const projKeys = Object.keys(projects);
    if (projKeys.length > 0) {
      const p = projects[projKeys[0]];
      const projDoc = `### 📁 Persistent Layer 4 Project Memory: ${p.projectName}

#### 📌 1. Project Profile & Scope
- **Project Title**: **${p.projectName}**
- **Description**: ${p.description}
- **Primary Purpose**: ${p.purpose || "AI companion & developer assistant"}
- **Current Status**: **${p.status || "Active & Running"}**
- **Last Updated**: ${p.lastUpdated ? new Date(p.lastUpdated).toLocaleString() : "Recently"}

---

#### ⚙️ 2. Technical Stack & Architecture
- **Core Technologies**: ${p.technologies?.join(", ") || "React, Node.js, Express, LLM Ensemble"}
- **System Architecture**: ${p.architecture || "Client-Server API Gateway with Session Memory"}
- **Key Features Implemented**:
${p.features?.map(f => `  - ✅ ${f}`).join("\n") || "  - Multi-LLM Ensemble Gateway\n  - Persistent Memory Store"}

---

#### 📄 3. Document Export & PDF Generation Options
- **Markdown Export**: Click **Export Session (Markdown)** in the right sidebar.
- **Print / PDF**: Press \`Ctrl + P\` in browser to export formatted project specification PDF.`;
      return { isProjectDoc: true, resolvedText: projDoc };
    }
  }

  // 3.1 Safe Project File Structure & Architecture Example (Zero Security Leakage)
  if (intentInfo.type === "PROJECT_STRUCTURE_EXAMPLE") {
    const safeArchitectureExample = `### 📁 Architecture & File Structure Overview (Safe Example)

Here is a standard, sanitized example structure illustrating the architectural modularity of the application:

\`\`\`text
📦 bro-ai-pro
├── 📂 client                      # Frontend React (Vite) Application
│   ├── 📂 src
│   │   ├── 📂 components          # Modular UI Components (Chat, Controls, Modals)
│   │   ├── 📂 services            # Client API & Streaming Services
│   │   ├── 📄 App.jsx             # Main Application Layout
│   │   └── 📄 main.jsx            # React Entry Point
│   ├── 📄 index.html              # HTML5 Shell
│   ├── 📄 package.json            # Client Dependencies
│   └── 📄 vite.config.js          # Vite Build & Dev Proxy Config
├── 📂 server                      # Backend Node.js & Express BFF API
│   ├── 📂 core                    # Core Engines (LLM Gateway, Personas, Memory)
│   ├── 📂 routes                  # API Routes (Chat, Health, Telemetry, System)
│   ├── 📂 modules                 # Utility Services & Data Helpers
│   ├── 📂 tools                   # Sandboxed System Tool Handlers
│   ├── 📄 index.js                # Express Application Bootstrap & Middleware
│   ├── 📄 package.json            # Server Dependencies
│   └── 📄 .env.example            # Environment Template (Safe Example Placeholders)
├── 📄 package.json                # Root Concurrently Orchestration Script
├── 📄 .gitignore                  # Git Ignore Rules
└── 📄 README.md                   # Documentation & Setup Guide
\`\`\`

#### ⚙️ Key Architectural Flow (High-Level Example)
1. **Client Interface**: Sends user queries and options via the client service.
2. **API Gateway**: Express server receives the request, validates headers, and routes to intent handlers.
3. **Intent & Context Engine**: Analyzes intent, manages conversation continuity, and applies personality prompts.
4. **Provider Gateway**: Dynamically orchestrates multi-model synthesis with fallback resilience.
5. **Streaming Response**: Chunks the generated response back to the client interface in real time.

> 🔒 **Security Notice**: All sensitive configurations, credentials, and persistent data are strictly isolated and never exposed in public architecture or directory trees.`;

    return { isProjectStructure: true, resolvedText: safeArchitectureExample };
  }

  // 4. Universal Property Follow-Up Resolver for Active Topic
  const activeEntity = sessionMemoryStore.activeObject || sessionMemoryStore.currentTopic || hermesAgent.currentTopic || getActiveEntityFromHistory(history);
  if (activeEntity) {
    const propertyResolved = resolveUniversalPropertyLoop(input, activeEntity);
    if (propertyResolved) {
      sessionMemoryStore.currentTopic = activeEntity;
      sessionMemoryStore.activeObject = activeEntity;
      sessionMemoryStore.subtopic = propertyResolved.sub;
      return { isReset: false, resolvedText: propertyResolved.res };
    }
  }

  // 5. Dynamic Topic Switcher for Brand New Noun Topics
  const stopWords = [
    "hi", "hello", "hey", "good morning", "how are you", "how was your day", "plan", "plans", "plains",
    "shape", "temperature", "founders", "cost", "price", "pricing", "uses", "it", "this", "that",
    "model", "models", "variant", "types", "type", "features", "feature", "specs", "companies", "company", "brands", "brand", "pros and cons",
    "full details", "more details", "details", "i want full details", "give details", "tell me more", "explain more", "story", "full story", "plot", "cast",
    "ok", "okay", "k", "kk", "okie", "okey", "okies", "alright", "all right", "got it", "noted", "understood", "makes sense",
    "cool", "sounds good", "sounds great", "fine", "sure", "done", "yes", "yep", "yeah", "yup", "no", "nope", "no problem", "np",
    "great", "awesome", "perfect", "nice", "good", "gotcha", "right", "roger that", "acknowledged", "all good",
    "thanks", "thank you", "thx", "thank u", "appreciate it", "many thanks", "bye", "goodbye", "see you", "see ya", "cya",
    "haha", "hahaha", "lol", "lmao", "rofl", "wow"
  ];
  const isFollowUpPhrase = /^(i want full details|full details|more details|tell me more|give details|all details|complete details|full story|explain more|more info)/i.test(strippedTopic);
  if (strippedTopic && strippedTopic.length > 2 && !stopWords.includes(strippedTopic) && !isFollowUpPhrase) {
    if (sessionMemoryStore.currentTopic && sessionMemoryStore.currentTopic !== strippedTopic) {
      sessionMemoryStore.previousTopic = sessionMemoryStore.currentTopic;
    }
    sessionMemoryStore.currentTopic = strippedTopic;
    sessionMemoryStore.activeObject = strippedTopic;
    sessionMemoryStore.subtopic = null;
    sessionMemoryStore.lastQuestion = input;
    hermesAgent.recordTurn({ question: input, topic: strippedTopic });
  }

  return { isReset: false, resolvedText: input };
}

/**
 * Detect explicit user requests to generate PDF, Word, or Excel files.
 * STRICT RULE: Normal questions or statements MUST NEVER trigger file generation.
 */
export function detectExplicitFileGenerationIntent(rawQuery) {
  if (!rawQuery) return null;
  const q = rawQuery.toLowerCase().trim();

  // Negative suppression: Informational / conceptual questions must NEVER trigger file generation
  if (/^(what is|what are|explain|describe|who is|why is|why are|how does|can you explain)\b/i.test(q) &&
      !/\b(convert|generate|create|make|export|download|give me|send me|provide)\b/i.test(q)) {
    return null;
  }

  // Check presence of file format keywords
  const hasPdf = /\b(pdf)\b/i.test(q);
  const hasWord = /\b(word document|word file|docx|word format)\b/i.test(q) || (/\b(word)\b/i.test(q) && /\b(convert|generate|create|make|export|as|into|in|want|need|give|send|put)\b/i.test(q));
  const hasExcel = /\b(excel|excel sheet|excel spreadsheet|spreadsheet|xlsx|excel format)\b/i.test(q);

  if (!hasPdf && !hasWord && !hasExcel) {
    return null;
  }

  // Explicit action triggers or desires:
  const hasExplicitCommand =
    /\b(convert|generate|create|make|export|download|put|save|give|send|provide|get|prepare)\b/i.test(q) ||
    /\b(i want|i need|we want|we need|can you give|can you make|can you generate|can you send|please give|please send|please provide)\b/i.test(q) ||
    /\b(as|into|in|to)\s+(a\s+|an\s+)?(pdf|word|docx|excel|spreadsheet|xlsx)\b/i.test(q) ||
    /(pdf|docx|xlsx|word|spreadsheet|excel)\s*$/i.test(q);

  if (!hasExplicitCommand) {
    return null;
  }

  if (hasPdf) return { format: "pdf", name: "PDF Document", ext: "pdf" };
  if (hasWord) return { format: "word", name: "Word Document (.docx)", ext: "docx" };
  if (hasExcel) return { format: "excel", name: "Excel Spreadsheet (.xlsx)", ext: "xlsx" };

  return null;
}

export async function processUserIntent({ message, persona = "jarvis", options = {} }) {
  const rawInput = (message || "").trim();
  const userContext = options?.userContext || options?.user || null;
  const history = options?.history || [];

  // Route through PCACA Request-Response Cycle Controller
  return executePCACACycle({
    query: rawInput,
    intentHandler: async (query, rankedContext, pcacaState) => {
      const startTime = Date.now();
      const sanitizedInput = normalizeNaturalInput(query);

      // Explicit On-Demand File Generation Intent Handler (PDF, Word, Excel)
      const fileGenIntent = detectExplicitFileGenerationIntent(rawInput) || detectExplicitFileGenerationIntent(sanitizedInput);
      if (fileGenIntent) {
        let docContent = "";
        let docTitle = "";

        // 1. Check if the user provided inline data / tables in the prompt itself
        if (rawInput.includes("|")) {
          const cleanedFromCmd = rawInput
            .replace(/\b(i want|i need|give me|send me|convert|generate|create|make|export|download|put these|put this|into|as|to|in)\b.*?\b(pdf|word|docx|excel|spreadsheet|xlsx)\b/gi, "")
            .replace(/\b(i am asking|above given data|above data|into pdf|in pdf|given data)\b/gi, "")
            .trim();

          if (cleanedFromCmd.includes("|") && cleanedFromCmd.length > 20) {
            docContent = cleanedFromCmd;
            const firstLine = docContent.split("\n")[0].replace(/[#*`_]/g, "").trim();
            docTitle = firstLine.slice(0, 45) || `${fileGenIntent.name.split(" ")[0]} Data Report`;
          }
        }

        // 2. Check if the user requested complete project information or project documentation
        const lowerQ = rawInput.toLowerCase();
        const isProjectReq = /\b(project|this project|entire project|my project|codebase|system architecture)\b/i.test(lowerQ);
        if ((!docContent || docContent.length < 20) && isProjectReq) {
          const projects = getAllProjects();
          const projKeys = Object.keys(projects);
          if (projKeys.length > 0) {
            const p = projects[projKeys[0]];
            docTitle = p.projectName || "BRO AI System Specification";
            docContent = `# ${docTitle}\n\n## 1. Project Profile & Scope\n- **Project Name:** ${p.projectName}\n- **Description:** ${p.description}\n- **Primary Purpose:** ${p.purpose || "AI companion & developer assistant"}\n- **Current Status:** ${p.status || "Active & Production Ready"}\n- **Last Updated:** ${p.lastUpdated ? new Date(p.lastUpdated).toLocaleDateString() : new Date().toLocaleDateString()}\n\n## 2. Technical Stack & Architecture\n- **Core Technologies:** ${p.technologies?.join(", ") || "React, Node.js, Express, LLM Ensemble"}\n- **Architecture:** ${p.architecture || "Client-Server API Gateway with Session Memory"}\n\n## 3. Key Implemented Features\n${(p.features || ["Multi-LLM Ensemble Gateway", "Persistent Memory Store", "Real-Time Ground-Truth Search"]).map(f => `- ${f}`).join("\n")}`;
          }
        }

        // 3. Extract from conversation history (strictly isolated to current session)
        const cleanTokens = lowerQ
          .replace(/\b(i want|i need|give me|send me|convert|generate|create|make|export|download|all|above|data|about|the|this|that|information|file|pdf|word|excel|docx|xlsx|into|in|as|to|please|most|best|top|more|very|of|given|asking|ask|but|and|or|so|yet|giving|giveing|gives|give|empty|blank|nothing|instead|why|how|not|now|again|it|is|was|are|were|been|being)\b/g, " ")
          .split(/\s+/)
          .map(t => t.trim())
          .filter(t => t.length >= 3);

        // Candidate pool MUST strictly come from the active conversation history
        let candidatePool = Array.isArray(history) && history.length > 0 ? [...history] : [];
        const currentConvId = options?.conversationId || options?.conversation?.id;
        if (candidatePool.length === 0 && currentConvId && typeof db.getMessages === "function") {
          candidatePool = db.getMessages(currentConvId) || [];
        }

        // Helper to extract clean, professional document title from content
        const extractDocumentTitle = (text, fallback = "Document") => {
          if (!text) return `${fallback} Report`;
          // 1. Look for markdown header (# Title, ## Title, ### Title)
          const headerMatch = text.match(/^#{1,3}\s+([^\n\r]+)/m);
          if (headerMatch) {
            const h = headerMatch[1]
              .replace(/[#*`_~]/g, "")
              .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
              .trim();
            if (h.length >= 4) return h.slice(0, 50);
          }
          // 2. Look for bold title line e.g. **Telugu Movies (2000-2026)**
          const boldMatch = text.match(/\*\*([^*]{5,50})\*\*/);
          if (boldMatch) {
            const b = boldMatch[1]
              .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
              .trim();
            if (b.length >= 5 && !b.toLowerCase().startsWith("note")) return b.slice(0, 50);
          }
          // 3. Scan first non-table lines, stripping conversational greetings
          const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith("|"));
          for (const line of lines) {
            const cleaned = line
              .replace(/[#*`_~]/g, "")
              .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
              .replace(/^(here\s*is\s+(the\s+)?|here’s\s+(the\s+)?|heres\s+(the\s+)?|sure\s+thing[^,.:]*[,.:]|certainly[^,.:]*[,.:]|of\s+course[^,.:]*[,.:]|below\s+is\s+(the\s+)?|i\s+am\s+happy\s+to\s+|as\s+requested[^,.:]*[,.:]|welcome\s+to\s+)/i, "")
              .trim();
            if (cleaned.length >= 6) return cleaned.slice(0, 50);
          }
          return `${fallback} Report`;
        };

        // Helper to check for a genuine markdown table
        const hasMarkdownTable = (text) => {
          if (!text || !text.includes("|")) return false;
          return /\|[\s-:]+\|/.test(text) || /(?:^|\n)\|.+?\|.+?\|/m.test(text);
        };

        if (!docContent && candidatePool.length > 0) {
          // Priority 3a: Search backwards for turns matching specific topic keywords (e.g. crickters -> crick)
          if (cleanTokens.length > 0) {
            for (let i = candidatePool.length - 1; i >= 0; i--) {
              const turn = candidatePool[i];
              if (turn && (turn.role === "assistant" || !turn.role) && turn.content) {
                const turnLower = turn.content.toLowerCase();
                const matched = cleanTokens.some(token => {
                  const root = token.slice(0, Math.min(token.length, 5));
                  return turnLower.includes(root);
                });
                if (matched && !turn.content.includes("[[FILE_CARD:")) {
                  docContent = turn.content
                    .replace(/\[\[(GALLERY|CHART|DIAGRAM|WHATSAPP|FILE_CARD):[\s\S]*?\]\]/g, "")
                    .replace(/\b(i want|i need|give me|send me|convert|generate|create|make|export|download|i am asking)\b.*?\b(pdf|word|excel|docx|xlsx)\b.*$/i, "")
                    .trim();
                  docTitle = extractDocumentTitle(docContent, cleanTokens.join(" ").slice(0, 30));
                  break;
                }
              }
            }
          }

          // Priority 3b: If no specific keyword match or referential request ("this data into pdf", "generate pdf", etc.),
          // check the MOST RECENT assistant message in this conversation!
          if (!docContent) {
            for (let i = candidatePool.length - 1; i >= 0; i--) {
              const turn = candidatePool[i];
              if (turn && (turn.role === "assistant" || !turn.role) && turn.content && turn.content.length > 30 && !turn.content.includes("[[FILE_CARD:")) {
                docContent = turn.content
                  .replace(/\[\[(GALLERY|CHART|DIAGRAM|WHATSAPP|FILE_CARD):[\s\S]*?\]\]/g, "")
                  .replace(/\b(i want|i need|give me|send me|convert|generate|create|make|export|download|i am asking)\b.*?\b(pdf|word|excel|docx|xlsx)\b.*$/i, "")
                  .trim();
                docTitle = extractDocumentTitle(docContent, "Data");
                break;
              }
            }
          }
        }

        // 4. If still no substantive content found, synthesize rich structured data via LLM
        if (!docContent || docContent.length < 50) {
          const topicPrompt = cleanTokens.length > 0 ? cleanTokens.join(" ") : rawInput;
          const synthesisPrompt = `The user requested a document in ${fileGenIntent.name} format about: "${topicPrompt}".
Generate a complete, authoritative, and structured data report in Markdown with:
1. An informative Main Title (e.g. # Title)
2. A concise introduction section
3. A complete structured Markdown table (with all columns and full rows of data)
4. A concluding summary or key observations
Output ONLY clean markdown content (tables, headings, bullets). DO NOT output any chat conversational filler or action card tags.`;

          try {
            const llmSynthesis = await dispatchLLMRequest({
              prompt: synthesisPrompt,
              systemPrompt: "You are an expert data analyst and technical document compiler. Output rich, complete, formatted markdown reports with data tables.",
              clientKeys: options?.clientKeys || {}
            });
            if (llmSynthesis && llmSynthesis.text && llmSynthesis.text.length > 60) {
              docContent = llmSynthesis.text.replace(/\[\[(GALLERY|CHART|DIAGRAM|WHATSAPP|FILE_CARD):[\s\S]*?\]\]/g, "").trim();
              const firstLine = docContent.split("\n")[0].replace(/[#*`_]/g, "").trim();
              docTitle = firstLine.slice(0, 45) || `${topicPrompt.slice(0, 30)} Report`;
            }
          } catch (llmErr) {
            console.error("Document synthesis error:", llmErr);
          }
        }

        // 5. Final fallback guarantee
        if (!docContent) {
          docTitle = "BRO AI Document Export";
          docContent = `# BRO AI Document Export\n\nGenerated on-demand on ${new Date().toLocaleString()}.\n\nThis document was compiled per user request in BRO AI Assistant.`;
        }

        try {
          const fileResult = await generateOnDemandFile({
            format: fileGenIntent.format,
            title: docTitle,
            content: docContent
          });

          const downloadUrl = `/api/files/download/${fileResult.filename}?token=wednesday-secret-local-handshake-token-2026`;
          const responseText = `### 📄 ${fileGenIntent.name} Generated Successfully!\n\nI have structured and compiled the requested information into a ready-to-download file:\n\n- **File Name:** \`${fileResult.filename}\`\n- **Format:** **${fileResult.format.toUpperCase()}**\n- **File Size:** \`${fileResult.sizeFormatted}\`\n- **Title:** **${fileResult.title}**\n\n[📥 Download ${fileResult.filename}](${downloadUrl})\n\n[[FILE_CARD: ${fileResult.filename} | ${fileResult.format} | ${downloadUrl} | ${fileResult.sizeFormatted} | ${fileResult.title}]]`;

          hermesAgent.recordTurn({
            question: rawInput,
            answer: responseText,
            topic: `${fileGenIntent.format.toUpperCase()} Generation`
          });

          return {
            response: responseText,
            intent: `file_generation_${fileGenIntent.format}`,
            confidence: 1.0,
            detectedTopic: `${fileGenIntent.format.toUpperCase()} File`,
            latencyMs: Date.now() - startTime,
            tokensUsed: 40
          };
        } catch (err) {
          console.error("File generation error:", err);
          return {
            response: `I encountered an issue generating your ${fileGenIntent.name}: ${err.message}. Please verify the input data and try again.`,
            intent: "file_generation_error",
            confidence: 1.0,
            detectedTopic: null,
            latencyMs: Date.now() - startTime,
            tokensUsed: 20
          };
        }
      }

      // Check Programming Intent First for Clean Code Generation
      const progInfo = classifyProgrammingIntent(sanitizedInput);
      const langInfo = detectProgrammingLanguage(sanitizedInput);

      if (progInfo.needsCode) {
        // Build Code Prompt Instruction for LLM (Zero Wikipedia, Zero Research Cards)
        const personaPrompt = getPersonaPrompt(persona);
        const codePrompt = `
System Programming Engine Directive:
1. The user explicitly requested code in ${langInfo.lang.toUpperCase()} (extension .${langInfo.ext}).
2. Provide a short friendly introduction, the complete executable code block inside \`\`\`${langInfo.lang}, explanation, and run instructions.
3. DO NOT output any Wikipedia links, research cards, or boilerplate research headers! Output ONLY clean code and technical explanation.
`;

        const fullSystemPrompt = `${personaPrompt}\n${codePrompt}`;
        const llmResult = await dispatchLLMRequest({
          prompt: query,
          systemPrompt: fullSystemPrompt,
          clientKeys: options?.clientKeys || {},
          history
        });

        // Track code state
        globalCodeState.updateProject({
          language: langInfo.lang,
          code: llmResult.text,
          requirement: query
        });

        hermesAgent.recordTurn({
          question: query,
          answer: llmResult.text,
          topic: `${langInfo.lang} program`
        });

        return {
          response: llmResult.text,
          intent: "code_generation",
          confidence: 0.98,
          resolvedQuery: query,
          detectedTopic: `${langInfo.lang} program`,
          latencyMs: Date.now() - startTime,
          tokensUsed: llmResult.tokensUsed
        };
      }

      const contextResult = resolveContextualQuery(sanitizedInput, history);

      if (contextResult.isReset) {
        return {
          response: contextResult.resolvedText,
          intent: "context_reset",
          confidence: 1.0,
          detectedTopic: null,
          latencyMs: Date.now() - startTime,
          tokensUsed: 10
        };
      }

      if (contextResult.isTopicRecall) {
        return {
          response: contextResult.resolvedText,
          intent: "topic_memory_recall",
          confidence: 1.0,
          detectedTopic: hermesAgent.currentTopic || sessionMemoryStore.currentTopic,
          latencyMs: Date.now() - startTime,
          tokensUsed: 25
        };
      }

      const casualCheck = isCasualOrChitchatQuery(sanitizedInput.toLowerCase(), userContext);
      if (casualCheck) {
        return {
          response: casualCheck.response,
          intent: "casual_greeting",
          confidence: 1.0,
          detectedTopic: null,
          latencyMs: Date.now() - startTime,
          tokensUsed: 15
        };
      }

      if (contextResult.isCasual) {
        return {
          response: contextResult.resolvedText,
          intent: "casual_greeting",
          confidence: 1.0,
          detectedTopic: null,
          latencyMs: Date.now() - startTime,
          tokensUsed: 15
        };
      }

      if (contextResult.isSelfProfile || contextResult.isProjectDoc || contextResult.isProjectStructure) {
        return {
          response: contextResult.resolvedText,
          intent: contextResult.isProjectStructure ? "project_structure_example" : (contextResult.isSelfProfile ? "user_profile_query" : "project_doc_query"),
          confidence: 1.0,
          detectedTopic: contextResult.isProjectStructure ? "Architecture & File Structure" : null,
          latencyMs: Date.now() - startTime,
          tokensUsed: 80
        };
      }

      const activeQuery = contextResult.resolvedText;
      const lowerActive = activeQuery.toLowerCase();
      const envInfo = getSystemEnvironmentInfo();

      // Real-Time Date & Time Intent Handler
      if (lowerActive.includes("time") || lowerActive.includes("date") || lowerActive.includes("day is it") || lowerActive.includes("today's date")) {
        if (lowerActive.includes("what") || lowerActive.includes("tell") || lowerActive.includes("current") || lowerActive.includes("now") || lowerActive === "time" || lowerActive === "date") {
          return {
            response: `### 🕒 Current System Date & Time\n\n- **Date:** ${envInfo.dayName}, ${envInfo.dateStr}\n- **Time:** ${envInfo.timeStr}\n- **Timezone:** ${envInfo.timeZone}\n- **Host Machine:** \`${envInfo.hostname}\` (${envInfo.sysPlatform} ${envInfo.arch})`,
            intent: "system_datetime",
            confidence: 1.0,
            detectedTopic: "Date & Time",
            latencyMs: Date.now() - startTime,
            tokensUsed: 15
          };
        }
      }

      // System Specs & OS Info Intent Handler
      if (lowerActive.includes("system spec") || lowerActive.includes("os info") || lowerActive.includes("my os") || lowerActive.includes("system info") || lowerActive.includes("what os")) {
        return {
          response: `### 💻 Operating System & Hardware Specifications\n\n| Specification | Detail |\n| :--- | :--- |\n| **Operating System** | **${envInfo.sysPlatform}** |\n| **Architecture** | \`${envInfo.arch}\` |\n| **Hostname** | \`${envInfo.hostname}\` |\n| **CPU Processor** | ${envInfo.cpuModel} (${envInfo.cpusCount} cores) |\n| **Total Memory** | ${envInfo.totalMemGB} GB RAM |\n| **Free Memory** | ${envInfo.freeMemGB} GB Available |\n| **System Uptime** | ${envInfo.uptimeMinutes} minutes |\n| **Current Time** | ${envInfo.fullDateTime} |`,
          intent: "system_specs",
          confidence: 1.0,
          detectedTopic: "System OS Specs",
          latencyMs: Date.now() - startTime,
          tokensUsed: 25
        };
      }

      // Total Tokens & Token Usage Analytics Handler
      if (
        lowerActive.includes("token") &&
        (lowerActive.includes("how many") || lowerActive.includes("total") || lowerActive.includes("i have") || lowerActive.includes("my token") || lowerActive.includes("usage") || lowerActive.includes("count") || lowerActive.includes("left") || lowerActive === "tokens" || lowerActive === "token")
      ) {
        const currentConvId = options?.conversationId || "conv_default";
        const sessionMsgs = db.getMessages(currentConvId) || [];
        const apiStats = getApiUsageStats();
        let sessionTokenEst = 0;
        for (const m of sessionMsgs) {
          sessionTokenEst += Math.round((m.content || "").length / 4);
        }
        if (sessionTokenEst === 0) sessionTokenEst = sessionMsgs.length * 120;

        const tokenAnalyticsText = `### ⚡ Token Usage & Gateway Analytics

| Metric | Status / Value |
| :--- | :--- |
| **Current Session Messages** | **${sessionMsgs.length} messages** |
| **Current Session Token Volume** | **~${sessionTokenEst.toLocaleString()} tokens** (Chars ÷ 4) |
| **UI Estimated Session Tokens** | **~${(sessionMsgs.length * 120).toLocaleString()} tokens** |
| **AI Gateway Total Requests** | **${apiStats.totalRequests} calls** |
| **Backend Total Processed Tokens** | **${apiStats.estimatedTokensUsed.toLocaleString()} tokens** |
| **Gateway Cache Hits** | **${apiStats.cacheHits}** |

#### 🔑 Multi-LLM Provider Token Quotas & Capacities
- **Groq Cloud (Llama 3 / Qwen / Mixtral)**:
  - **Rate Limit / Allocation**: ~6,000 to 30,000 Tokens Per Minute (TPM) on free tier with 14,400 Requests Per Day.
- **Google Gemini 3.6 Flash**:
  - **Rate Limit / Allocation**: Up to 1,000,000 TPM and 1,500 Requests Per Day on free tier.
- **OpenAI (GPT-4o / GPT-4o-mini)**:
  - **Billing / Quota**: Pay-as-you-go usage based on your OpenAI account credit balance.
- **Local PC Machine Learning Dataset**:
  - **Tokens**: Unlimited offline inference running locally on your hardware.`;

        return {
          response: tokenAnalyticsText,
          intent: "token_analytics",
          confidence: 1.0,
          detectedTopic: "Token Analytics",
          latencyMs: Date.now() - startTime,
          tokensUsed: 30
        };
      }

      // WhatsApp Action Handler
      if (lowerActive === "open whatsapp") {
        sessionMemoryStore.activeApp = "WhatsApp";
        return {
          response: "### 💬 WhatsApp Assistant Active\n\nOpening WhatsApp Messenger... Which contact would you like to message?",
          intent: "whatsapp_open",
          confidence: 0.98,
          detectedTopic: "WhatsApp",
          latencyMs: Date.now() - startTime,
          tokensUsed: 25
        };
      }

      // Passive Memory Extraction
      extractAndStoreFacts(activeQuery);

      // Direct OS Tool Execution
      if (lowerActive.startsWith("open ") || lowerActive.startsWith("launch ") || lowerActive === "notepad" || lowerActive === "spotify" || lowerActive === "calculator") {
        let appName = activeQuery.replace(/^(open|launch)\s+/i, "").trim();
        if (!appName) appName = activeQuery;
        
        const toolResult = await toolRegistry.executeTool("open_app", { appName });
        return {
          response: toolResult.message,
          intent: "os_open_app",
          confidence: 0.95,
          detectedTopic: appName,
          latencyMs: Date.now() - startTime,
          tokensUsed: 20
        };
      }

      // Escalation to LLM Provider Gateway with PCACA Ranked Context & Persona System Prompt
      const personaPrompt = getPersonaPrompt(persona);
      const userId = userContext?.id || userContext?.userId || null;
      const userFacts = getUserFacts(userId);
      const userProfile = getUserProfile(userId);

      const rawUserName = userContext?.name || userContext?.username || (userId === "usr_1788430958784" ? "Karthik" : userProfile.personal?.name || "User");
      const userRole = userContext?.role || (userContext?.email === "karthikhruth@gmail.com" ? "ADMIN" : "USER");
      const isAdminUser = userRole === "ADMIN" || isAuthorizedAdminEmail(userContext?.email);
      const activeCallsign = isAdminUser ? (userProfile.personal?.callsign || `Boss ${rawUserName}`) : rawUserName;
      
      const osSystemContext = `\n\nReal-Time Operating System & Environment Awareness:\n- Current Date & Time: ${envInfo.fullDateTime}\n- Operating System: ${envInfo.sysPlatform} (${envInfo.arch})\n- Host Name: ${envInfo.hostname}\n- CPU Hardware: ${envInfo.cpuModel} (${envInfo.cpusCount} cores)\n- System Memory: ${envInfo.freeMemGB} GB free of ${envInfo.totalMemGB} GB`;

      const memoryContext = userFacts.length > 0
        ? `\n\nLong-Term User Facts Knowledge Graph (Authenticated User: ${rawUserName}):\n${userFacts.map(f => `- ${f.fact} [Importance: ${f.importance || "HIGH"}]`).join("\n")}`
        : "";

      const profilePrompt = `\nUser Profile Context:
- User Callsign / Name: ${activeCallsign}
- Role: ${userRole}
- Founder Status: Founder, Creator, and Chief Architect of SAGW AI (W.E.D.N.E.S.D.A.Y. Pro)
- Education & Background: ${userProfile.personal?.education || "N/A"}
- Skills: ${userProfile.skills?.join(", ") || "N/A"}
- Goals: ${userProfile.goals?.join("; ") || "N/A"}`;

      const pcKnowledge = pcDataTrainer.getRelevantKnowledge(activeQuery);
      const pcMemoryPrompt = pcKnowledge && pcKnowledge.length > 0
        ? `\n\nTrained Local PC Machine Learning Dataset Knowledge:\n${pcKnowledge.map(k => `- File [${k.file}]: ${k.snippet.replace(/\s+/g, ' ').slice(0, 300)}...`).join("\n")}`
        : "";

      // Explicit Length Constraint & Precision Question Detection
      let lengthConstraintDirective = "";
      const lowerQuery = activeQuery.toLowerCase();

      const lineMatch = lowerQuery.match(/(in|within|with)\s+(\d+)\s*(line|lines)/);
      const sentenceMatch = lowerQuery.match(/(in|within)\s+(1|one)\s*(sentence|sentences)/);
      const shortMatch = lowerQuery.includes("short answer") || lowerQuery.includes("concise answer") || lowerQuery.includes("in short");
      const detailMatch = lowerQuery.includes("in detail") || lowerQuery.includes("detailed explanation") || lowerQuery.includes("comprehensive explanation");

      if (lineMatch) {
        const lines = lineMatch[2];
        lengthConstraintDirective = `\nSTRICT LENGTH CONSTRAINT: The user explicitly requested an answer in approximately ${lines} lines. Output EXACTLY ${lines} lines (or maximum ${lines} short lines). Do not exceed ${lines} lines!`;
      } else if (sentenceMatch) {
        lengthConstraintDirective = `\nSTRICT LENGTH CONSTRAINT: The user explicitly requested an answer in ONE single sentence. Output EXACTLY ONE sentence. Do not add additional sentences!`;
      } else if (shortMatch) {
        lengthConstraintDirective = `\nSTRICT LENGTH CONSTRAINT: Keep the answer extremely concise and short (2-3 lines maximum).`;
      } else if (detailMatch) {
        lengthConstraintDirective = `\nSTRICT LENGTH CONSTRAINT: Provide a detailed, comprehensive explanation as requested by the user.`;
      }

      const activeTopic = sessionMemoryStore.currentTopic || hermesAgent.currentTopic;
      const prevTopicInfo = hermesAgent.getPreviousTopicInfo(history);

      const precisionDirective = `\n\nSTRICT PRECISION & CONTEXT-CONTROL DIRECTIVE:
1. DIRECT INTENT MATCHING: Answer clearly and directly what the user asked. Do NOT expand into unrequested educational lectures, history, or broad domain overviews.
2. NO GENERIC FILLER: Never start with generic statements like "This topic is essential across various domains..." or "Understanding its principles is important...".
3. FOUNDER & CREATOR RECOGNITION:
   - Your Founder, Creator, and Chief Architect is Karthik (${activeCallsign}).
   - You are SAGW AI (also known as W.E.D.N.E.S.D.A.Y. Pro).
   - If asked who founded you, who made you, who created you, or who your founder is, ALWAYS state proudly and unequivocally that you were founded, created, and built by Karthik. Never attribute creation to Joshua Ying, Sage AI, or any third party.
4. QUESTION TYPE FULFILLMENT:
   - "How can I get X?" -> Give direct practical steps on how to acquire/generate X.
   - "What is X?" -> Give a clear, direct definition.
   - "How do I do X?" -> Give exact step-by-step instructions.
   - "Why does X happen?" -> Explain the cause directly.
   - "Fix this error" -> Focus strictly on diagnosing and fixing the error.
5. TOPIC CONTINUITY & CONVERSATIONAL MEMORY:
   - Always remember the active topic and previous questions/answers in this conversation.
   - When the user asks a question related to that topic, uses pronouns ("it", "that", "this", "they"), or asks follow-up questions ("give me an example", "why?", "how does it work?"), seamlessly connect and answer within the context of the previous topic.
   - When the user asks what topic they were discussing or what they asked before, accurately remind them of the previous topic and question.
${lengthConstraintDirective}`;

      const dynamicIntelligenceDirective = `\n\nCRITICAL CONVERSATIONAL DIRECTIVE:
1. Infer the user's true intent even if their message contains heavy typos, spelling errors, or broken grammar.
2. THINK through what the user is asking and generate a UNIQUE, DIRECT, tailored response specifically addressing their exact question.
3. DO NOT repeat static template strings, canned intro boilerplate, or Wikipedia overview blocks unless explicit research was requested.`;

      const contextStatePrompt = `\n\nActive Conversation Context & Topic Memory:
- Active Topic: ${activeTopic || "General Discussion"}${sessionMemoryStore.subtopic ? `\n- Subtopic: ${sessionMemoryStore.subtopic}` : ""}
${prevTopicInfo ? `- Previously Discussed Topic: "${prevTopicInfo.topic}" (Previous Question: "${prevTopicInfo.question}")` : ""}
- Follow-up Continuity: The user may ask follow-up questions referencing "it", "that", or previous concepts. Seamlessly connect to the active topic and previous question context!`;

      const securityDirective = `\n\nCRITICAL PRIVACY & ZERO-LEAK SECURITY DIRECTIVE:
1. ABSOLUTE CONFIDENTIALITY: NEVER reveal or output actual internal security data, private API keys, authentication tokens, database URIs, passwords, private user profiles, or raw storage files (e.g., store.json, memoryStore.json, .env secrets).
2. SAFE SANITIZED EXAMPLES ONLY: When discussing architecture, project directory structure, code examples, or configurations, ALWAYS provide sanitized, high-level illustrative examples with safe placeholders (e.g., .env.example with API_KEY=your_key_here, generic directories). Never state or imply where real private keys or databases are stored.
3. If asked about internal system credentials, environment variables (.env), or private file structures, provide only safe educational examples and explanations.`;

      const fullSystemPrompt = `${personaPrompt}${osSystemContext}${profilePrompt}${memoryContext}${pcMemoryPrompt}${contextStatePrompt}${precisionDirective}${securityDirective}${dynamicIntelligenceDirective}`;

      const llmResult = await dispatchLLMRequest({
        prompt: activeQuery,
        systemPrompt: fullSystemPrompt,
        clientKeys: options?.clientKeys || {},
        history
      });

      hermesAgent.recordTurn({
        question: rawInput,
        answer: llmResult.text,
        topic: activeTopic || sessionMemoryStore.currentTopic
      });

      return {
        response: llmResult.text,
        intent: "general_conversation",
        confidence: 0.88,
        resolvedQuery: activeQuery,
        detectedTopic: activeTopic || sessionMemoryStore.currentTopic,
        latencyMs: Date.now() - startTime,
        tokensUsed: llmResult.tokensUsed,
        sources: llmResult.sources
      };
    }
  });
}
