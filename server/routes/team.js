import express from "express";
import { db } from "../data/db.js";

const router = express.Router();

// Get team details
router.get("/", (req, res) => {
  try {
    const team = db.getTeam();
    res.json({ success: true, team });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update team details
router.put("/", (req, res) => {
  try {
    const updated = db.updateTeam(req.body);
    res.json({ success: true, team: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
