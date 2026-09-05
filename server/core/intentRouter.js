import os from "os";
import { getPersonaPrompt } from "./personaEngine.js";
import { analyzeEmotion } from "./emotionEngine.js";
import { getUserFacts, getUserProfile, getFormattedUserProfile, getProjectProfile, getAllProjects, extractAndStoreFacts, updateProjectProfile } from "./memoryStore.js";
import { isAuthorizedAdminEmail } from "../modules/authManager.js";
import { toolRegistry } from "./toolRegistry.js";
import { dispatchLLMRequest } from "./providerGateway.js";
import { executePCACACycle, globalStateManager } from "./pcacaEngine.js";
import { detectProgrammingLanguage, classifyProgrammingIntent, formatCodeResponse, globalCodeState } from "./codeEngine.js";
import { pcDataTrainer } from "./pcDataTrainerEngine.js";

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

  // 1. Plans & Activity Questions
  if (pLower.includes("plan") || pLower.includes("plans") || pLower.includes("plains") || pLower.includes("agenda")) {
    if (pLower.includes("today") || pLower.includes("your") || pLower.includes("what")) {
      return {
        isCasual: true,
        response: `My plan today is to assist you, ${callsign}! 🚀 I'm here to help with full-stack development, memory tracking, and deep research. What are we building or exploring today?`
      };
    }
  }

  // 2. Day / How was your day questions
  if (pLower.includes("how was your day") || pLower.includes("how is your day") || pLower.includes("how was day") || pLower.includes("how is day") || pLower.includes("hows your day")) {
    return {
      isCasual: true,
      response: `My day has been fantastic, ${callsign}! 🚀 I've been running telemetry checks, preserving context memory, and staying ready for you. How was your day?`
    };
  }

  // 3. Greetings
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

  // 4. Feelings & Opinion about User
  const feelingsTriggers = ["fellings about me", "feelings about me", "opinion about me", "opinion of me", "think about me", "think of me", "feel about me", "feelings for me", "thoughts on me"];
  if (feelingsTriggers.some(t => pLower.includes(t))) {
    return {
      isCasual: true,
      response: `I hold you in the highest regard, ${callsign}! 🚀 You are an exceptionally talented user and visionary. Working with you on computer science, full-stack AI architecture, and multi-model machine learning is an incredible experience. I am 100% dedicated to supporting your projects and helping you build next-generation AI systems!`
    };
  }

  // 5. Name & Identity
  const identityTriggers = ["what is your name", "whats your name", "what's your name", "who are you", "what are you called", "tell me your name", "your name"];
  if (identityTriggers.some(t => pLower.includes(t))) {
    return {
      isCasual: true,
      response: `I am **BRO AI (W.E.D.N.E.S.D.A.Y. Pro)**! 🚀 I'm your unified personal AI assistant, powered by a multi-LLM ensemble gateway (Groq, Gemini, OpenAI, and Python Engine) with persistent 5-layer context memory and local machine learning dataset training. How can I assist you today, ${callsign}?`
    };
  }

  // 6. Casual chitchat & how are you
  const chitchat = [
    "how are you", "how are you doing", "how r u", "how are u", "how's it going", "hows it going",
    "what are you doing", "what are you up to", "who created you", "are you my friend", "i just want to talk", "lets talk"
  ];
  if (chitchat.some(q => pLower.includes(q))) {
    return {
      isCasual: true,
      response: "I'm doing great bro! 🚀 Powered up, connected to memory, and ready to help you with anything—whether you want to chat casually or work on a project. How are you doing today?"
    };
  }

  return null;
}

// UNIVERSAL PROPERTY AUTO-LOOPING ENGINE
function resolveUniversalPropertyLoop(input, activeEntity) {
  if (!activeEntity) return null;

  const pLower = input.toLowerCase().trim().replace(/[.!?,]+$/g, '');
  const words = pLower.split(/\s+/);

  const universalMap = [
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
    if (item.keys.includes(pLower)) {
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

function resolveContextualQuery(input) {
  const pLower = input.toLowerCase().trim().replace(/[.!?,]+$/g, '');
  const strippedTopic = cleanConversationalPrefix(pLower);
  const intentInfo = classifyUniversalIntent(pLower, input);

  // 0. Context Reset
  if (pLower === "new topic" || pLower === "start fresh" || pLower === "forget this" || pLower === "new chat") {
    sessionMemoryStore.currentTopic = null;
    sessionMemoryStore.subtopic = null;
    sessionMemoryStore.activeObject = null;
    sessionMemoryStore.activeTask = null;
    sessionMemoryStore.accumulatedRequirements = [];
    sessionMemoryStore.activeContact = null;
    sessionMemoryStore.activeApp = null;
    sessionMemoryStore.conversationHistory = [];
    return { isReset: true, resolvedText: "Context reset successfully. How can I help you with a new topic?" };
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

  // 4. Universal Property Follow-Up Resolver for Active Topic
  const activeEntity = sessionMemoryStore.activeObject || sessionMemoryStore.currentTopic;
  if (activeEntity) {
    const propertyResolved = resolveUniversalPropertyLoop(input, activeEntity);
    if (propertyResolved) {
      sessionMemoryStore.subtopic = propertyResolved.sub;
      return { isReset: false, resolvedText: propertyResolved.res };
    }
  }

  // 5. Dynamic Topic Switcher for Brand New Noun Topics
  const stopWords = [
    "hi", "hello", "hey", "good morning", "how are you", "how was your day", "plan", "plans", "plains",
    "shape", "temperature", "founders", "cost", "price", "pricing", "uses", "it", "this", "that",
    "model", "models", "variant", "types", "type", "features", "feature", "specs", "companies", "company", "brands", "brand", "pros and cons"
  ];
  if (strippedTopic && !stopWords.includes(strippedTopic)) {
    sessionMemoryStore.currentTopic = strippedTopic;
    sessionMemoryStore.activeObject = strippedTopic;
    sessionMemoryStore.subtopic = null;
  }

  return { isReset: false, resolvedText: input };
}

export async function processUserIntent({ message, persona = "jarvis", options = {} }) {
  const rawInput = (message || "").trim();
  const userContext = options?.userContext || options?.user || null;

  // Route through PCACA Request-Response Cycle Controller
  return executePCACACycle({
    query: rawInput,
    intentHandler: async (query, rankedContext, pcacaState) => {
      const startTime = Date.now();
      const sanitizedInput = normalizeNaturalInput(query);

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
          clientKeys: options?.clientKeys || {}
        });

        // Track code state
        globalCodeState.updateProject({
          language: langInfo.lang,
          code: llmResult.text,
          requirement: query
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

      const contextResult = resolveContextualQuery(sanitizedInput);

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

      if (contextResult.isSelfProfile || contextResult.isProjectDoc) {
        return {
          response: contextResult.resolvedText,
          intent: contextResult.isSelfProfile ? "user_profile_query" : "project_doc_query",
          confidence: 1.0,
          detectedTopic: null,
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

      const precisionDirective = `\n\nSTRICT PRECISION & CONTEXT-CONTROL DIRECTIVE:
1. DIRECT INTENT MATCHING: Answer ONLY what the user asked. Do NOT expand into unrequested educational lectures, history, architectural theory, or broad domain overviews.
2. NO GENERIC FILLER: Never start with generic statements like "This topic is essential across various domains..." or "Understanding its principles is important...".
3. QUESTION TYPE FULFILLMENT:
   - "How can I get X?" -> Give direct practical steps on how to acquire/generate X.
   - "What is X?" -> Give a clear, direct definition.
   - "How do I do X?" -> Give exact step-by-step instructions.
   - "Why does X happen?" -> Explain the cause directly.
   - "Fix this error" -> Focus strictly on diagnosing and fixing the error.
4. ISOLATE TOPIC CONTEXT: Focus ONLY on the current question. Do NOT force previous topics into the current response unless the user explicitly connects them.
${lengthConstraintDirective}`;

      const dynamicIntelligenceDirective = `\n\nCRITICAL CONVERSATIONAL DIRECTIVE:
1. Infer the user's true intent even if their message contains heavy typos, spelling errors, or broken grammar.
2. THINK through what the user is asking and generate a UNIQUE, DIRECT, tailored response specifically addressing their exact question.
3. DO NOT repeat static template strings, canned intro boilerplate, or Wikipedia overview blocks unless explicit research was requested.`;

      const contextStatePrompt = sessionMemoryStore.currentTopic
        ? `\n\nActive Conversation Context:\n- Current Topic: ${sessionMemoryStore.currentTopic}${sessionMemoryStore.subtopic ? `\n- Subtopic: ${sessionMemoryStore.subtopic}` : ""}`
        : "";

      const fullSystemPrompt = `${personaPrompt}${osSystemContext}${profilePrompt}${memoryContext}${pcMemoryPrompt}${contextStatePrompt}${precisionDirective}${dynamicIntelligenceDirective}`;

      const llmResult = await dispatchLLMRequest({
        prompt: activeQuery,
        systemPrompt: fullSystemPrompt,
        clientKeys: options?.clientKeys || {}
      });

      return {
        response: llmResult.text,
        intent: "general_conversation",
        confidence: 0.88,
        resolvedQuery: activeQuery,
        detectedTopic: sessionMemoryStore.currentTopic,
        latencyMs: Date.now() - startTime,
        tokensUsed: llmResult.tokensUsed
      };
    }
  });
}
