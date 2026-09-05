import express from "express";
import { processUserIntent } from "../core/intentRouter.js";
import { db } from "../data/db.js";
import { authManager } from "../modules/authManager.js";

const router = express.Router();

const getAuthUserFromReq = (req) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return null;
  try {
    const data = authManager.read();
    const session = data.sessions.find(s => s.token === token);
    if (!session) return null;
    return data.users.find(u => u.id === session.userId) || null;
  } catch (e) {
    return null;
  }
};

// Fetch all conversations
router.get("/conversations", (req, res) => {
  try {
    const authUser = getAuthUserFromReq(req);
    const userId = authUser ? authUser.id : "usr_default";
    const conversations = db.getConversations(userId);
    res.json({ success: true, conversations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new conversation
router.post("/conversations", (req, res) => {
  try {
    const authUser = getAuthUserFromReq(req);
    const userId = authUser ? authUser.id : "usr_default";
    const { title } = req.body;
    const conv = db.createConversation(title || "New Conversation", userId);
    res.json({ success: true, conversation: conv });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Rename conversation
router.put("/conversations/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const conv = db.updateConversation(id, title);
    res.json({ success: true, conversation: conv });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete conversation
router.delete("/conversations/:id", (req, res) => {
  try {
    const { id } = req.params;
    db.deleteConversation(id);
    res.json({ success: true, message: "Conversation deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get messages for a conversation
router.get("/conversations/:id/messages", (req, res) => {
  try {
    const { id } = req.params;
    const messages = db.getMessages(id);
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Standard non-streaming POST endpoint
router.post("/", async (req, res) => {
  try {
    const { message, conversationId, persona, options } = req.body;
    const authUser = getAuthUserFromReq(req);
    const currentConvId = conversationId || "conv_default";
    
    // Store user message
    db.addMessage(currentConvId, "user", message);

    // Process AI response
    const result = await processUserIntent({ message, persona, options: { ...options, userContext: authUser } });

    // Store AI response
    db.addMessage(currentConvId, "assistant", result.response, {
      toolUsed: result.toolUsed,
      sources: result.sources
    });

    res.json(result);
  } catch (err) {
    console.error("Error processing /api/chat intent:", err);
    res.status(500).json({
      success: false,
      response: "An internal server error occurred while processing your request.",
      error: err.message
    });
  }
});

// SSE Real-time Streaming POST endpoint
router.post("/stream", async (req, res) => {
  const { message, conversationId, persona, options, attachments } = req.body;
  const authUser = getAuthUserFromReq(req);
  const currentConvId = conversationId || "conv_default";

  // Set SSE Headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    // Send Thinking status chunk
    res.write(`data: ${JSON.stringify({ type: "status", status: "thinking", message: "Analyzing prompt & context..." })}\n\n`);

    // Store user message in DB
    db.addMessage(currentConvId, "user", message, { attachments });

    // Get previous messages for conversation context
    const history = db.getMessages(currentConvId).slice(-6);

    // Process full response from engine
    const fullResult = await processUserIntent({
      message,
      persona,
      options: { ...options, history, attachments, userContext: authUser }
    });

    const fullResponseText = fullResult.response || "No response generated.";

    // Progressive streaming chunks to user
    res.write(`data: ${JSON.stringify({ type: "status", status: "generating", message: "Streaming response..." })}\n\n`);

    const chunkSize = Math.max(3, Math.floor(fullResponseText.length / 25));
    let index = 0;

    while (index < fullResponseText.length) {
      const chunk = fullResponseText.slice(index, index + chunkSize);
      index += chunkSize;
      res.write(`data: ${JSON.stringify({ type: "chunk", text: chunk })}\n\n`);
      // Brief interval to emulate natural streaming typing
      await new Promise((r) => setTimeout(r, 20));
    }

    // Save final response into DB
    db.addMessage(currentConvId, "assistant", fullResponseText, {
      toolUsed: fullResult.toolUsed,
      sources: fullResult.sources
    });

    // Send Done event
    res.write(`data: ${JSON.stringify({ type: "done", fullText: fullResponseText, sources: fullResult.sources })}\n\n`);
    res.end();
  } catch (err) {
    console.error("Streaming error:", err);
    res.write(`data: ${JSON.stringify({ type: "error", error: err.message })}\n\n`);
    res.end();
  }
});

export default router;
