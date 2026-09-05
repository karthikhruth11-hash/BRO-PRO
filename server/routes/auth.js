import express from "express";
import { db } from "../data/db.js";

const router = express.Router();

// Get current user session
router.get("/me", (req, res) => {
  const users = db.read().users || [];
  const user = users[0] || { id: "usr_default", name: "Demo User", email: "user@example.com" };
  res.json({ success: true, user });
});

// Login endpoint
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: "Email is required" });
  }

  const users = db.read().users || [];
  let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    user = {
      id: "usr_" + Date.now(),
      name: email.split("@")[0],
      email: email,
      createdDate: new Date().toISOString()
    };
    const data = db.read();
    data.users.push(user);
    db.write(data);
  }

  res.json({
    success: true,
    token: "token_" + Date.now(),
    user
  });
});

// Register endpoint
router.post("/register", (req, res) => {
  const { name, email } = req.body;
  if (!email || !name) {
    return res.status(400).json({ success: false, error: "Name and email are required" });
  }

  const data = db.read();
  const existing = data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.json({ success: true, token: "token_" + Date.now(), user: existing });
  }

  const user = {
    id: "usr_" + Date.now(),
    name,
    email,
    createdDate: new Date().toISOString()
  };
  data.users.push(user);
  db.write(data);

  res.json({
    success: true,
    token: "token_" + Date.now(),
    user
  });
});

// Logout endpoint
router.post("/logout", (req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
});

export default router;
