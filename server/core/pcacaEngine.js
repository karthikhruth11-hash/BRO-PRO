import { getUserFacts, getUserProfile, getProjectProfile, getAllProjects } from "./memoryStore.js";

// PCACA — Persistent Contextual Autoregressive Conversation Architecture
// 3-Layer Universal Engine Implementation

export class ConversationStateManager {
  constructor() {
    this.sessionState = {
      conversationId: `conv-${Date.now()}`,
      userId: "user-boss",
      sessionId: `sess-${Date.now()}`,
      currentTopic: null,
      subtopic: null,
      previousTopics: [],
      activeEntity: null,
      activeEntitiesList: [],
      userIntent: "GENERAL",
      currentTask: null,
      pendingTasks: [],
      completedTasks: [],
      recentMessages: [],
      importantContext: [],
      longTermMemoryRefs: [],
      activeThreadId: "default",
      threads: {}
    };
  }

  getState() {
    return this.sessionState;
  }

  updateTopic(newTopic) {
    if (newTopic && newTopic !== this.sessionState.currentTopic) {
      if (this.sessionState.currentTopic) {
        this.sessionState.previousTopics.push(this.sessionState.currentTopic);
      }
      this.sessionState.currentTopic = newTopic;
      this.sessionState.activeEntity = newTopic;
      if (!this.sessionState.activeEntitiesList.includes(newTopic)) {
        this.sessionState.activeEntitiesList.push(newTopic);
      }
    }
  }

  addMessage(role, content, resolvedQuery = null) {
    this.sessionState.recentMessages.push({
      role,
      content,
      resolvedQuery: resolvedQuery || content,
      timestamp: new Date().toISOString()
    });
    if (this.sessionState.recentMessages.length > 20) {
      this.sessionState.recentMessages.shift();
    }
  }

  updateTask(taskName, status = "ACTIVE") {
    this.sessionState.currentTask = { taskName, status, updatedAt: new Date().toISOString() };
  }

  // Universal Pronoun & References Resolver
  resolvePronounEntity(pLower) {
    const pronouns = ["it", "this", "that", "they", "them", "him", "her", "there", "same one", "previous one", "first one", "second one", "the above"];
    const isPronounQuery = pronouns.some(p => pLower === p || pLower.startsWith(`${p} `) || pLower.endsWith(` ${p}`));

    if (isPronounQuery) {
      return this.sessionState.activeEntity || this.sessionState.currentTopic;
    }
    return null;
  }
}

export const globalStateManager = new ConversationStateManager();

// 1. Context Retrieval Engine
export function retrieveContext(query, sessionState) {
  const userFacts = getUserFacts();
  const userProfile = getUserProfile();
  const projects = getAllProjects();

  return {
    rawQuery: query,
    recentHistory: sessionState.recentMessages.slice(-6),
    currentTopic: sessionState.currentTopic,
    subtopic: sessionState.subtopic,
    activeEntity: sessionState.activeEntity,
    previousTopics: sessionState.previousTopics.slice(-3),
    activeTask: sessionState.currentTask,
    userFacts: userFacts.slice(-10),
    userProfile,
    projects
  };
}

// 2. Context Ranking Engine
export function rankAndPrioritizeContext(retrievedContext) {
  const rankedSources = [];

  if (retrievedContext.currentTopic) {
    rankedSources.push({ type: "CURRENT_TOPIC", weight: 1.0, data: retrievedContext.currentTopic });
  }

  if (retrievedContext.activeEntity) {
    rankedSources.push({ type: "ACTIVE_ENTITY", weight: 0.95, data: retrievedContext.activeEntity });
  }

  if (retrievedContext.activeTask) {
    rankedSources.push({ type: "ACTIVE_TASK", weight: 0.9, data: retrievedContext.activeTask });
  }

  if (retrievedContext.recentHistory && retrievedContext.recentHistory.length > 0) {
    rankedSources.push({ type: "RECENT_MESSAGES", weight: 0.85, data: retrievedContext.recentHistory });
  }

  if (retrievedContext.userFacts && retrievedContext.userFacts.length > 0) {
    rankedSources.push({ type: "PERSISTENT_FACTS", weight: 0.75, data: retrievedContext.userFacts });
  }

  return {
    optimizedPromptContext: rankedSources.map(s => `[${s.type} (Weight: ${s.weight})]: ${JSON.stringify(s.data)}`).join("\n"),
    rankedSources
  };
}

// 3. Response Validator
export function validateResponse(text, intent) {
  if (!text || text.trim().length === 0) {
    return { isValid: false, reason: "EMPTY_RESPONSE", sanitizedText: "I'm here for you, Boss! What would you like to discuss or work on?" };
  }

  let clean = text.trim();

  // Strip raw execution artifacts & debug code
  clean = clean.replace(/Execute quick tool:\s*/gi, "");

  return {
    isValid: true,
    reason: "VALIDATED",
    sanitizedText: clean
  };
}

// 4. PCACA Controller Loop: RECEIVE -> UNDERSTAND -> RETRIEVE -> BUILD -> INFER -> GENERATE -> VALIDATE -> RESPOND -> UPDATE STATE
export async function executePCACACycle({ query, intentHandler }) {
  // Step 1: RECEIVE & UNDERSTAND
  const rawQuery = (query || "").trim();

  // Step 2: RETRIEVE CONTEXT
  const state = globalStateManager.getState();
  const retrievedContext = retrieveContext(rawQuery, state);

  // Step 3: RANK & BUILD CONTEXT
  const rankedContext = rankAndPrioritizeContext(retrievedContext);

  // Step 4: INFER & GENERATE (Autoregressive Engine via Intent Handler)
  const rawResult = await intentHandler(rawQuery, rankedContext, state);

  // Step 5: VALIDATE
  const validation = validateResponse(rawResult.response, rawResult.intent);

  // Step 6: UPDATE STATE & REMEMBER RELEVANT INFORMATION
  globalStateManager.addMessage("user", rawQuery, rawResult.resolvedQuery || rawQuery);
  globalStateManager.addMessage("assistant", validation.sanitizedText);
  if (rawResult.detectedTopic) {
    globalStateManager.updateTopic(rawResult.detectedTopic);
  }

  // Step 7: RESPOND
  return {
    success: true,
    response: validation.sanitizedText,
    intent: rawResult.intent || "PCACA_PROCESSED",
    confidence: rawResult.confidence || 0.95,
    provider: "JARVIS",
    latencyMs: rawResult.latencyMs || 0,
    tokensUsed: rawResult.tokensUsed || 0,
    pcacaState: {
      sessionState: globalStateManager.getState(),
      rankedSourcesCount: rankedContext.rankedSources.length
    }
  };
}
