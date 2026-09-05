import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'store.json');

const INITIAL_DATA = {
  users: [
    {
      id: "usr_default",
      name: "Demo User",
      email: "user@example.com",
      createdDate: new Date().toISOString()
    }
  ],
  conversations: [
    {
      id: "conv_default",
      userId: "usr_default",
      title: "Welcome Conversation",
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString()
    }
  ],
  messages: [
    {
      id: "msg_welcome",
      conversationId: "conv_default",
      role: "assistant",
      content: "Hello! I am your **W.E.D.N.E.S.D.A.Y. Pro Personal AI Assistant**. How can I help you today? You can ask general questions, upload files, request web search, ask for code, or generate images!",
      createdDate: new Date().toISOString()
    }
  ],
  files: [],
  memories: [
    {
      id: "mem_1",
      userId: "usr_default",
      content: "Prefers concise, clean code explanations with syntax highlighting.",
      createdDate: new Date().toISOString()
    }
  ],
  team: {
    groupName: "W.E.D.N.E.S.D.A.Y. AI Engineering Team",
    logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80",
    description: "Architects of production-grade personal AI technology, intelligent tool routers, and multimodal human-machine interaction systems.",
    members: [
      {
        id: "m1",
        name: "Karthik",
        role: "Lead AI Architect & Core Developer",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
        skills: ["LLM Orchestration", "Node.js", "React", "System Architecture"],
        github: "https://github.com",
        linkedin: "https://linkedin.com"
      },
      {
        id: "m2",
        name: "Alex Vance",
        role: "Full-Stack & UX Engineer",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
        skills: ["React/Vite", "Tailwind/CSS", "Streaming Interfaces", "Web Speech API"],
        github: "https://github.com",
        linkedin: "https://linkedin.com"
      },
      {
        id: "m3",
        name: "Elena Rostova",
        role: "AI Safety & Multimodal Specialist",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
        skills: ["Vision LLMs", "Document Intelligence", "Tool Routing", "Prompt Engineering"],
        github: "https://github.com",
        linkedin: "https://linkedin.com"
      }
    ]
  }
};

class LocalDB {
  constructor() {
    this.ensureDb();
  }

  ensureDb() {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2));
    }
  }

  read() {
    try {
      this.ensureDb();
      const content = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(content);
    } catch (e) {
      console.error("Error reading database file:", e);
      return INITIAL_DATA;
    }
  }

  write(data) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error("Error writing database file:", e);
    }
  }

  // Conversations
  getConversations(userId = "usr_default") {
    const data = this.read();
    return data.conversations
      .filter(c => c.userId === userId)
      .sort((a, b) => new Date(b.updatedDate) - new Date(a.updatedDate));
  }

  createConversation(title = "New Conversation", userId = "usr_default") {
    const data = this.read();
    const newConv = {
      id: "conv_" + Date.now(),
      userId,
      title,
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString()
    };
    data.conversations.unshift(newConv);
    this.write(data);
    return newConv;
  }

  updateConversation(id, title) {
    const data = this.read();
    const conv = data.conversations.find(c => c.id === id);
    if (conv) {
      conv.title = title;
      conv.updatedDate = new Date().toISOString();
      this.write(data);
    }
    return conv;
  }

  deleteConversation(id) {
    const data = this.read();
    data.conversations = data.conversations.filter(c => c.id !== id);
    data.messages = data.messages.filter(m => m.conversationId !== id);
    this.write(data);
    return true;
  }

  // Messages
  getMessages(conversationId) {
    const data = this.read();
    return data.messages.filter(m => m.conversationId === conversationId);
  }

  addMessage(conversationId, role, content, meta = {}) {
    const data = this.read();
    const newMsg = {
      id: "msg_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      conversationId,
      role,
      content,
      meta,
      createdDate: new Date().toISOString()
    };
    data.messages.push(newMsg);
    
    // Update conversation timestamp
    const conv = data.conversations.find(c => c.id === conversationId);
    if (conv) {
      conv.updatedDate = new Date().toISOString();
    }
    
    this.write(data);
    return newMsg;
  }

  // Files
  getFiles(userId = "usr_default") {
    const data = this.read();
    return data.files.filter(f => f.userId === userId);
  }

  addFile(fileData) {
    const data = this.read();
    const newFile = {
      id: "file_" + Date.now(),
      userId: fileData.userId || "usr_default",
      filename: fileData.filename,
      fileType: fileData.fileType,
      storagePath: fileData.storagePath || "",
      content: fileData.content || "",
      createdDate: new Date().toISOString()
    };
    data.files.push(newFile);
    this.write(data);
    return newFile;
  }

  // Memories
  getMemories(userId = "usr_default") {
    const data = this.read();
    return data.memories.filter(m => m.userId === userId);
  }

  addMemory(content, userId = "usr_default") {
    const data = this.read();
    const newMem = {
      id: "mem_" + Date.now(),
      userId,
      content,
      createdDate: new Date().toISOString()
    };
    data.memories.push(newMem);
    this.write(data);
    return newMem;
  }

  deleteMemory(id) {
    const data = this.read();
    data.memories = data.memories.filter(m => m.id !== id);
    this.write(data);
    return true;
  }

  // Team Configuration
  getTeam() {
    const data = this.read();
    return data.team || INITIAL_DATA.team;
  }

  updateTeam(teamData) {
    const data = this.read();
    data.team = teamData;
    this.write(data);
    return data.team;
  }
}

export const db = new LocalDB();
