import express from "express";
import { db } from "../data/db.js";

const router = express.Router();

// Get uploaded files list
router.get("/", (req, res) => {
  try {
    const files = db.getFiles();
    res.json({ success: true, files });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Upload/Process file endpoint
router.post("/upload", (req, res) => {
  try {
    const { filename, fileType, content, base64 } = req.body;
    if (!filename) {
      return res.status(400).json({ success: false, error: "Filename is required" });
    }

    const newFile = db.addFile({
      filename,
      fileType: fileType || "document",
      content: content || (base64 ? `[Binary Image Data: ${filename}]` : ""),
      storagePath: `/uploads/${filename}`
    });

    res.json({
      success: true,
      file: newFile
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
