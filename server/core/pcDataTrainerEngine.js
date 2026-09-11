import fs from "fs";
import path from "path";

class PCDataTrainerEngine {
  constructor() {
    this.datasetPath = path.join(process.cwd(), "server", "data", "pc_ml_dataset.json");
    this.memoryIndex = {
      totalDocuments: 0,
      totalWordsIndexed: 0,
      lastTrainedAt: null,
      knowledgeBlocks: []
    };
    this.loadDataset();
  }

  loadDataset() {
    try {
      if (fs.existsSync(this.datasetPath)) {
        const raw = fs.readFileSync(this.datasetPath, "utf-8");
        this.memoryIndex = JSON.parse(raw);
      }
    } catch (e) {
      console.error("Failed to load PC ML Dataset:", e.message);
    }
  }

  saveDataset() {
    try {
      const dir = path.dirname(this.datasetPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.datasetPath, JSON.stringify(this.memoryIndex, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to save PC ML Dataset:", e.message);
    }
  }

  async trainFromDirectory(dirPath = process.cwd()) {
    const validExtensions = [".js", ".jsx", ".ts", ".tsx", ".py", ".json", ".md", ".txt", ".html", ".css"];
    const EXCLUDED_DIRS = new Set([
      "node_modules", "dist", "build", "data", "security", "uploads",
      ".git", ".vscode", ".dist", ".vercel"
    ]);
    const SENSITIVE_FILE_PATTERNS = [
      /\.env/i,
      /store\.json/i,
      /memoryStore\.json/i,
      /auth_db\.json/i,
      /pc_ml_dataset\.json/i,
      /package-lock\.json/i,
      /secret/i,
      /credential/i,
      /token/i,
      /password/i,
      /key\./i,
      /\.pem$/i,
      /\.cert$/i
    ];

    let filesIndexed = 0;
    let wordsCount = 0;
    const blocks = [];

    function scanDir(currentDir, depth = 0) {
      if (depth > 4) return;
      try {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          const entryNameLower = entry.name.toLowerCase();
          if (entry.name.startsWith(".") || EXCLUDED_DIRS.has(entryNameLower)) {
            continue;
          }
          const fullPath = path.join(currentDir, entry.name);
          if (entry.isDirectory()) {
            scanDir(fullPath, depth + 1);
          } else if (entry.isFile()) {
            if (SENSITIVE_FILE_PATTERNS.some(pat => pat.test(entry.name))) {
              continue;
            }
            const ext = path.extname(entry.name).toLowerCase();
            if (validExtensions.includes(ext)) {
              try {
                const content = fs.readFileSync(fullPath, "utf-8");
                if (content && content.length > 20 && content.length < 50000) {
                  // Ensure no API keys or token strings are indexed
                  if (/gsk_[a-zA-Z0-9_-]{20,}|sk-[a-zA-Z0-9_-]{20,}|AIza[a-zA-Z0-9_-]{30,}|handshake-token/i.test(content)) {
                    continue;
                  }
                  const relativePath = path.relative(process.cwd(), fullPath);
                  const words = content.split(/\s+/).length;
                  filesIndexed++;
                  wordsCount += words;
                  blocks.push({
                    file: relativePath,
                    ext,
                    snippet: content.slice(0, 1000),
                    wordCount: words
                  });
                }
              } catch (err) {
                // Ignore binary/unreadable files
              }
            }
          }
        }
      } catch (err) {
        // Ignore unreadable dirs
      }
    }

    scanDir(dirPath);

    this.memoryIndex = {
      totalDocuments: filesIndexed,
      totalWordsIndexed: wordsCount,
      lastTrainedAt: new Date().toISOString(),
      knowledgeBlocks: blocks.slice(0, 150)
    };

    this.saveDataset();

    return {
      success: true,
      filesIndexed,
      wordsCount,
      lastTrainedAt: this.memoryIndex.lastTrainedAt
    };
  }

  getRelevantKnowledge(query) {
    if (!this.memoryIndex.knowledgeBlocks || this.memoryIndex.knowledgeBlocks.length === 0) {
      return null;
    }

    const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    if (keywords.length === 0) return null;

    const matched = [];
    for (const block of this.memoryIndex.knowledgeBlocks) {
      let score = 0;
      const fileLower = block.file.toLowerCase();
      const snippetLower = block.snippet.toLowerCase();

      for (const kw of keywords) {
        if (fileLower.includes(kw)) score += 5;
        if (snippetLower.includes(kw)) score += 2;
      }

      if (score > 0) {
        matched.push({ ...block, score });
      }
    }

    matched.sort((a, b) => b.score - a.score);
    return matched.slice(0, 3);
  }

  getDatasetSummary() {
    return {
      totalDocuments: this.memoryIndex.totalDocuments,
      totalWordsIndexed: this.memoryIndex.totalWordsIndexed,
      lastTrainedAt: this.memoryIndex.lastTrainedAt
    };
  }
}

export const pcDataTrainer = new PCDataTrainerEngine();
