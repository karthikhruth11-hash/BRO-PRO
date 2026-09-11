import { toolRegistry } from "../core/toolRegistry.js";

export class HermesAgent {
  constructor() {
    this.enabled = process.env.HERMES_ENABLED !== "false";
    this.topicHistory = []; // Tracks [{ topic, question, answerSnippet, timestamp }]
    this.currentTopic = null;
    this.previousTopic = null;
    this.lastQuestion = null;
    this.lastOpenedApp = null;
  }

  isAgentRequired(prompt) {
    if (!this.enabled || !prompt) return false;
    const pLower = prompt.toLowerCase().trim();

    // 1. Topic & Question Memory Recall Triggers
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
      "earlier question",
      "topic we were discussing",
      "topic we discussed",
      "topic what i ask",
      "topic what i asked"
    ];
    if (memoryTriggers.some(t => pLower.includes(t))) {
      return true;
    }

    // 2. Re-open previous app trigger
    if (
      (pLower.includes("open that app") || pLower.includes("open it again") || pLower.includes("launch it again") || pLower.includes("open the app again")) &&
      this.lastOpenedApp
    ) {
      return true;
    }

    // 3. System & OS Tool Triggers
    const agentTriggers = ["open app", "launch", "run command", "terminal", "execute", "browse", "filesystem", "system tool"];
    return agentTriggers.some(t => pLower.includes(t));
  }

  recordTurn({ question, answer = "", topic = null }) {
    if (!question) return;
    const cleanQ = question.trim();
    this.lastQuestion = cleanQ;

    // Detect or refine topic
    let detectedTopic = topic;
    if (!detectedTopic) {
      detectedTopic = this.extractTopicFromPrompt(cleanQ);
    }

    if (detectedTopic) {
      if (this.currentTopic && this.currentTopic !== detectedTopic) {
        this.previousTopic = this.currentTopic;
      }
      this.currentTopic = detectedTopic;
    }

    const snippet = typeof answer === "string" ? answer.replace(/[#*`_]/g, "").slice(0, 200).trim() : "";
    this.topicHistory.push({
      topic: this.currentTopic || "General Topic",
      question: cleanQ,
      answerSnippet: snippet,
      timestamp: new Date().toISOString()
    });

    if (this.topicHistory.length > 50) {
      this.topicHistory.shift();
    }
  }

  extractTopicFromPrompt(prompt) {
    if (!prompt) return null;
    const pLower = prompt.toLowerCase().trim();

    // Skip casual phrases, memory meta-questions, and follow-up prompts
    const metaWords = [
      "hi", "hello", "hey", "how are you", "what is your name", "who are you", "test", "ok",
      "what was the topic", "previous topic", "what did i ask", "remember", "remind me",
      "full details", "more details", "i want full details", "give full details", "details",
      "tell me more", "tell me details", "explain more", "give more details", "all details",
      "complete details", "more info", "full info", "full story", "what is the story",
      "continue", "what else", "tell me everything", "give example", "explain in detail",
      "i want details", "full rundown", "detailed breakdown", "complete breakdown"
    ];
    if (metaWords.some(w => pLower === w || pLower.startsWith(w + " ") || pLower.endsWith(" " + w) || pLower.includes(w))) return null;

    // Direct topic pattern matching
    const topicPatterns = [
      /(?:tell me about|explain|what is|how does|what are|describe|discuss|guide on|teach me|code for|program for|write code for|show me)\s+([^?.!,]+)/i,
      /(?:topic of|subject of|about)\s+([^?.!,]+)/i
    ];

    for (const pattern of topicPatterns) {
      const match = prompt.match(pattern);
      if (match && match[1]) {
        const candidate = match[1].trim().replace(/^(the|a|an)\s+/i, "");
        if (candidate.length > 2 && candidate.split(/\s+/).length <= 6 && !metaWords.some(w => candidate.toLowerCase().includes(w))) {
          return candidate.charAt(0).toUpperCase() + candidate.slice(1);
        }
      }
    }

    // Noun phrase heuristic: take clean first 3-4 words if informative
    const words = prompt.replace(/[^a-zA-Z0-9\s]/g, "").trim().split(/\s+/);
    if (words.length >= 2 && words.length <= 6) {
      const joined = words.join(" ").toLowerCase();
      if (!metaWords.some(w => joined.includes(w))) {
        return words.join(" ");
      }
    }

    return null;
  }

  getPreviousTopicInfo(history = []) {
    // 1. Search topicHistory backwards for a meaningful prior turn
    if (this.topicHistory.length > 0) {
      for (let i = this.topicHistory.length - 1; i >= 0; i--) {
        const turn = this.topicHistory[i];
        const qLower = turn.question.toLowerCase();
        if (
          !qLower.includes("previous topic") &&
          !qLower.includes("what did i ask") &&
          !qLower.includes("what topic") &&
          !qLower.includes("remember")
        ) {
          return turn;
        }
      }
    }

    // 2. Fallback: Parse passed conversation history
    if (history && history.length > 0) {
      const userMsgs = history.filter(m => m.role === "user");
      for (let i = userMsgs.length - 1; i >= 0; i--) {
        const content = userMsgs[i].content;
        const qLower = content.toLowerCase();
        if (
          !qLower.includes("previous topic") &&
          !qLower.includes("what did i ask") &&
          !qLower.includes("what topic") &&
          !qLower.includes("remember")
        ) {
          const correspondingAssistant = history[history.indexOf(userMsgs[i]) + 1];
          const snippet = correspondingAssistant && correspondingAssistant.content
            ? correspondingAssistant.content.replace(/[#*`_]/g, "").slice(0, 200).trim()
            : "";
          return {
            topic: this.extractTopicFromPrompt(content) || content.slice(0, 40),
            question: content,
            answerSnippet: snippet
          };
        }
      }
    }

    return null;
  }

  async executeAgentTask({ prompt, persona = "jarvis", history = [] }) {
    const pLower = prompt.toLowerCase().trim();

    // 1. Topic & Question Memory Recall
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
      "earlier question",
      "topic we were discussing",
      "topic we discussed",
      "topic what i ask",
      "topic what i asked"
    ];

    if (memoryTriggers.some(t => pLower.includes(t))) {
      const prevTurn = this.getPreviousTopicInfo(history);

      if (prevTurn) {
        return {
          text: `### 🧠 Memory Recall: Previous Topic & Question\n\n- **Previous Topic Discussed:** **${prevTurn.topic}**\n- **What You Asked:** *"${prevTurn.question}"*\n${prevTurn.answerSnippet ? `- **Key Details Discussed:** ${prevTurn.answerSnippet}...\n` : ""}\nI have fully preserved this in our active memory context. You can ask any follow-up question or continue exploring **${prevTurn.topic}**, and I will remember everything we discussed! 🚀`,
          provider: "Hermes Agent (Topic Memory)",
          toolUsed: "topic_memory_recall"
        };
      }

      return {
        text: `### 🧠 Topic & Memory Status\n\nI am actively tracking our conversation! We haven't explored a prior specific topic in this active thread yet. Ask me any question (about programming, science, system tools, etc.), and I will continuously remember the topic, questions, and all follow-up context! 🚀`,
        provider: "Hermes Agent (Topic Memory)",
        toolUsed: "topic_memory_recall"
      };
    }

    // 2. Re-open previous app
    if (
      (pLower.includes("open that app") || pLower.includes("open it again") || pLower.includes("launch it again") || pLower.includes("open the app again")) &&
      this.lastOpenedApp
    ) {
      const toolRes = await toolRegistry.executeTool("open_app", { appName: this.lastOpenedApp });
      return {
        text: toolRes.message || `Hermes Agent reopened ${this.lastOpenedApp}`,
        provider: "Hermes Agent (OS Tool)",
        toolUsed: "open_app"
      };
    }

    // 3. OS Open App Tool
    if (pLower.includes("open ") || pLower.includes("launch ")) {
      let appName = prompt.replace(/^(open|launch)\s+/i, "").trim();
      this.lastOpenedApp = appName;
      this.recordTurn({ question: prompt, topic: `App: ${appName}` });
      const toolRes = await toolRegistry.executeTool("open_app", { appName });
      return {
        text: toolRes.message || `Hermes Agent opened ${appName}`,
        provider: "Hermes Agent (OS Tool)",
        toolUsed: "open_app"
      };
    }

    // 4. System Telemetry Tool
    if (pLower.includes("telemetry") || pLower.includes("system status") || pLower.includes("system stats")) {
      this.recordTurn({ question: prompt, topic: "System Telemetry" });
      const toolRes = await toolRegistry.executeTool("get_system_telemetry", {});
      return {
        text: `### 🖥️ Hermes Agent System Telemetry:\n\`\`\`json\n${JSON.stringify(toolRes, null, 2)}\n\`\`\``,
        provider: "Hermes Agent (Telemetry)",
        toolUsed: "get_system_telemetry"
      };
    }

    return null;
  }
}

export const hermesAgent = new HermesAgent();
