import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MEMORY_FILE = path.join(__dirname, "../data/memoryStore.json");

// Ensure data directory exists
const dataDir = path.dirname(MEMORY_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function loadMemory() {
  if (!fs.existsSync(MEMORY_FILE)) {
    const initial = {
      userProfile: {
        personal: {
          callsign: "Boss",
          name: "Karthik",
          education: "Computer Science & Engineering",
          background: "AI Systems & Full-Stack Web Development"
        },
        skills: ["JavaScript (ES6+)", "React.js", "Node.js / Express", "Python", "AI Agent Systems", "TailwindCSS / Vanilla CSS"],
        learning: ["Persistent Memory Architecture", "Multi-LLM Synthesis", "Autonomous AI Agents"],
        goals: ["Build World-Class Next-Gen BRO AI Assistant", "Master Deep Research & Conversational Memory Systems"],
        preferences: {
          communicationStyle: "Structured, Direct & High-Precision",
          themeStyle: "Modern Dark Glassmorphism",
          outputPreference: "Markdown Tables, Clear Headings, Zero Filler"
        }
      },
      projects: {
        "bro_ai_pro": {
          projectName: "BRO AI Pro (Wednesday AI)",
          aliases: ["wednesday", "bro ai", "advanced pro project"],
          description: "High-end next-generation AI assistant with multi-LLM ensemble, persistent context memory, and OS tool integration.",
          purpose: "Personal AI companion & productive agent assistant",
          technologies: ["React", "Vite", "Node.js", "Express", "LLM APIs (Groq, OpenAI, Gemini)"],
          architecture: "Client-Server API Gateway with Session Memory & Local OS Exec",
          features: ["Multi-Persona Console", "Persistent 5-Layer Memory", "WhatsApp Action Cards", "Interactive SVG Charts", "Wikipedia Deep Research"],
          completedWork: "Implemented multi-turn context linking, typo corrector, and exact topic image generator",
          status: "Active & Deployable",
          lastUpdated: new Date().toISOString()
        }
      },
      documents: [
        {
          id: "doc-1",
          docName: "BRO AI Architecture Specification",
          topic: "AI Agent Design",
          summary: "Complete blueprint for 5-layer persistent memory, emotion engine, and provider gateway",
          keyConcepts: ["Persistent Memory", "LLM Ensemble", "Action Cards"],
          findings: "Ensemble routing delivers 10x higher precision than single model",
          createdAt: new Date().toISOString()
        }
      ],
      userFacts: [
        { id: "1", fact: "User preferred callsign is Boss", importance: "CRITICAL", tag: "preference", createdAt: new Date().toISOString() },
        { id: "2", fact: "Working on ADVANCED PRO PROJECT (BRO AI Pro)", importance: "CRITICAL", tag: "project", createdAt: new Date().toISOString() }
      ],
      sessions: []
    };
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(initial, null, 2), "utf8");
    return initial;
  }
  try {
    const raw = fs.readFileSync(MEMORY_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    return { userProfile: {}, projects: {}, documents: [], userFacts: [], sessions: [] };
  }
}

function saveMemory(data) {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2), "utf8");
}

export function getUserFacts(userId = null) {
  const data = loadMemory();
  const facts = data.userFacts || [];
  if (userId) {
    return facts.filter(f => f.userId === userId || !f.userId);
  }
  return facts;
}

export function getUserProfile(userId = null) {
  const data = loadMemory();
  if (userId && data.userProfiles && data.userProfiles[userId]) {
    return data.userProfiles[userId];
  }
  return data.userProfile || {};
}

export function getProjectProfile(projectName) {
  if (!projectName) return null;
  const data = loadMemory();
  const projects = data.projects || {};
  const lower = projectName.toLowerCase();

  for (const key in projects) {
    const p = projects[key];
    if (key.toLowerCase() === lower || p.projectName?.toLowerCase().includes(lower)) {
      return p;
    }
    if (p.aliases && p.aliases.some(a => a.toLowerCase().includes(lower))) {
      return p;
    }
  }
  return null;
}

export function getAllProjects() {
  const data = loadMemory();
  return data.projects || {};
}

export function updateProjectProfile(projectName, projectDetails) {
  const data = loadMemory();
  if (!data.projects) data.projects = {};
  
  const key = projectName.toLowerCase().replace(/[^a-z0-9]/g, "_");
  const existing = data.projects[key] || {};
  
  data.projects[key] = {
    ...existing,
    ...projectDetails,
    projectName: projectDetails.projectName || existing.projectName || projectName,
    lastUpdated: new Date().toISOString()
  };

  saveMemory(data);
  return data.projects[key];
}

export function addDocumentMemory(docData) {
  const data = loadMemory();
  if (!data.documents) data.documents = [];

  const newDoc = {
    id: `doc-${Date.now()}`,
    ...docData,
    createdAt: new Date().toISOString()
  };

  data.documents.push(newDoc);
  saveMemory(data);
  return newDoc;
}

export function addUserFact(fact, importance = "HIGH", tag = "general", userId = null) {
  const data = loadMemory();
  if (!data.userFacts) data.userFacts = [];

  const exists = data.userFacts.some(f => f.fact.toLowerCase() === fact.toLowerCase() && (userId ? f.userId === userId : true));
  if (exists) return null;

  const newFact = {
    id: Date.now().toString(),
    userId: userId || "guest_default",
    fact,
    importance,
    tag,
    createdAt: new Date().toISOString()
  };
  data.userFacts.push(newFact);
  saveMemory(data);
  return newFact;
}

export function removeUserFact(factId, userId = null) {
  const data = loadMemory();
  const initialCount = data.userFacts.length;
  data.userFacts = data.userFacts.filter(f => {
    if (userId && f.userId && f.userId !== userId) return true;
    return f.id !== factId && f.fact.toLowerCase() !== factId.toLowerCase();
  });
  saveMemory(data);
  return data.userFacts.length < initialCount;
}

export function clearAllFacts(userId = null) {
  const data = loadMemory();
  if (userId) {
    data.userFacts = data.userFacts.filter(f => f.userId && f.userId !== userId);
  } else {
    data.userFacts = [];
  }
  saveMemory(data);
  return true;
}

export function extractAndStoreFacts(userMessage, userId = null) {
  if (!userMessage) return;
  const lower = userMessage.toLowerCase();
  
  if (lower.includes("my name is ")) {
    const name = userMessage.split(/my name is /i)[1]?.split(".")[0]?.split(",")[0];
    if (name) addUserFact(`User's name is ${name.trim()}`, "CRITICAL", "identity", userId);
  } else if (lower.includes("i am working on ")) {
    const proj = userMessage.split(/i am working on /i)[1]?.split(".")[0];
    if (proj) {
      addUserFact(`Active project: ${proj.trim()}`, "HIGH", "project", userId);
      updateProjectProfile(proj.trim(), { description: `Active project declared by user: ${proj.trim()}` });
    }
  } else if (lower.includes("i prefer ")) {
    const pref = userMessage.split(/i prefer /i)[1]?.split(".")[0];
    if (pref) addUserFact(`Preference: ${pref.trim()}`, "MEDIUM", "preference", userId);
  }
}

export function getFormattedUserProfile() {
  const profile = getUserProfile();
  const facts = getUserFacts();
  const projects = getAllProjects();

  const personal = profile.personal || {};
  const skills = profile.skills || [];
  const learning = profile.learning || [];
  const goals = profile.goals || [];
  const prefs = profile.preferences || {};

  const projectList = Object.values(projects).map(p => `- **${p.projectName}**: ${p.description} (Tech: ${p.technologies?.join(", ") || "N/A"})`).join("\n");

  return `### 👤 Personal Intelligence Profile & Journey Report

#### 📌 1. Identity & Background (Confirmed Facts)
- **Callsign / Name**: **${personal.callsign || personal.name || "Boss"}**
- **Education**: ${personal.education || "Computer Science & Engineering"}
- **Professional Focus**: ${personal.background || "AI Systems & Full-Stack Web Architecture"}

---

#### 💻 2. Core Skills & Technical Expertise
${skills.map(s => `- 🔹 ${s}`).join("\n")}

---

#### 🎯 3. Active Learning Journey & Goals
- **Current Learning Subjects**:
${learning.map(l => `  - 📚 ${l}`).join("\n")}
- **Primary Strategic Goals**:
${goals.map(g => `  - 🚀 ${g}`).join("\n")}

---

#### 🛠️ 4. Persistent Project Profiles (Layer 4 Memory)
${projectList || "No external projects saved yet."}

---

#### 💡 5. User Preferences & Operating Style
- **Communication Style**: ${prefs.communicationStyle || "Structured, Direct & High-Precision"}
- **UI Design Style**: ${prefs.themeStyle || "Modern Dark Glassmorphism"}
- **Output Standard**: ${prefs.outputPreference || "Markdown Tables, Clear Headings, Zero Filler"}`;
}
