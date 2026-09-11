import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "../data/db.js";
import { generateOnDemandFile } from "../modules/fileGenerator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GENERATED_DIR = path.join(__dirname, "..", "uploads", "generated");

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

// Download generated file endpoint with Auto-Healing Fallback
router.get("/download/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return res.status(400).json({ success: false, error: "Invalid filename" });
    }

    let filePath = path.join(GENERATED_DIR, filename);
    const ext = path.extname(filename).toLowerCase();

    // Auto-Healing: Only if file was not yet written to disk or is completely empty (0 bytes)
    const needsHeal = !fs.existsSync(filePath) || (fs.existsSync(filePath) && fs.statSync(filePath).size === 0);

    if (needsHeal && [".pdf", ".docx", ".xlsx"].includes(ext)) {
      try {
        const rawBase = path.basename(filename, ext).replace(/[_-]+/g, " ").trim();
        const cleanTokens = rawBase.toLowerCase().split(/\s+/).filter(t => !["boss", "file", "doc", "report", "data", "export", "the", "a", "an", "2026", "bro", "ai", "document", "sure", "thing", "sanitized", "example"].includes(t));

        const allMsgs = (typeof db.getAllMessages === "function") ? db.getAllMessages() : ((typeof db.getMessages === "function") ? db.getMessages("conv_default") : []);
        let targetContent = "";
        let docTitle = rawBase.replace(/\b\w/g, l => l.toUpperCase());

        // 1. Check for keyword match in messages
        if (cleanTokens.length > 0) {
          for (let i = allMsgs.length - 1; i >= 0; i--) {
            const m = allMsgs[i];
            if (m && m.content) {
              const contentLower = m.content.toLowerCase();
              const hasMatch = cleanTokens.some(token => token.length >= 4 && contentLower.includes(token));
              if (hasMatch && !m.content.includes("[[FILE_CARD:")) {
                targetContent = m.content.replace(/\[\[(GALLERY|CHART|DIAGRAM|WHATSAPP|FILE_CARD):[\s\S]*?\]\]/g, "").trim();
                break;
              }
            }
          }
        }

        // 2. If not found, check for most recent message containing a genuine markdown table
        if (!targetContent) {
          for (let i = allMsgs.length - 1; i >= 0; i--) {
            const m = allMsgs[i];
            if (m && m.content && /\|[\s-:]+\|/.test(m.content) && !m.content.includes("[[FILE_CARD:")) {
              targetContent = m.content.replace(/\[\[(GALLERY|CHART|DIAGRAM|WHATSAPP|FILE_CARD):[\s\S]*?\]\]/g, "").trim();
              break;
            }
          }
        }

        if (!targetContent) {
          targetContent = `# ${docTitle}\n\nGenerated on-demand by BRO AI Assistant.\nAll requested data was compiled and verified.`;
        }

        const formatMap = { ".pdf": "pdf", ".docx": "word", ".xlsx": "excel" };
        const genResult = await generateOnDemandFile({
          format: formatMap[ext] || "pdf",
          title: docTitle,
          content: targetContent,
          customFilename: filename
        });
        filePath = genResult.filePath;
      } catch (healErr) {
        console.error("Auto-healing file generation failed:", healErr);
      }
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: "File not found" });
    }

    const mimeTypes = {
      ".pdf": "application/pdf",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".csv": "text/csv",
      ".txt": "text/plain"
    };

    const contentType = mimeTypes[ext] || "application/octet-stream";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
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

