import express from "express";
import { db } from "../data/db.js";
import { authManager } from "../modules/authManager.js";

const router = express.Router();

const getAuthUserId = (req) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return "guest_default";
  try {
    const data = authManager.read();
    const session = data.sessions.find(s => s.token === token);
    if (!session) return "guest_default";
    return session.userId;
  } catch (e) {
    return "guest_default";
  }
};

router.get("/facts", (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const memories = db.getMemories(userId);
    res.json({ success: true, facts: memories });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post("/facts", (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { fact, tag, content } = req.body;
    const text = fact || content;
    if (!text) return res.status(400).json({ success: false, message: "Memory content required." });
    const newMemory = db.addMemory(text, userId);
    res.json({ success: true, fact: newMemory });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.delete("/facts/:id", (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { id } = req.params;
    const removed = db.deleteMemory(id, userId);
    res.json({ success: removed, message: removed ? "Memory deleted." : "Memory not found." });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.delete("/facts", (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const data = db.read();
    data.memories = data.memories.filter(m => m.userId !== userId);
    db.write(data);
    res.json({ success: true, message: "All user memories cleared." });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
