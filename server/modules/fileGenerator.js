import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, WidthType, BorderStyle } from "docx";
import * as XLSX from "xlsx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GENERATED_DIR = path.join(__dirname, "..", "uploads", "generated");

// Ensure output directory exists
if (!fs.existsSync(GENERATED_DIR)) {
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
}

/**
 * Intelligent parser to extract headings, paragraphs, bullet points, and tables from markdown/text
 */
export function parseContentToStructuredBlocks(rawText) {
  if (!rawText) return { title: "BRO AI Report", blocks: [], tables: [] };

  // Normalize compact markdown tables and whitespace
  let preprocessed = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  // If text starts with non-table intro followed by table
  const firstPipe = preprocessed.indexOf("|");
  if (firstPipe > 0) {
    const prefix = preprocessed.slice(0, firstPipe).trim();
    const rest = preprocessed.slice(firstPipe).trim();
    if (prefix && rest) {
      preprocessed = prefix + "\n\n" + rest;
    }
  }

  // If text ends with non-table note
  const lastPipe = preprocessed.lastIndexOf("|");
  if (lastPipe > 0 && lastPipe < preprocessed.length - 1) {
    const tablePart = preprocessed.slice(0, lastPipe + 1).trim();
    const suffix = preprocessed.slice(lastPipe + 1).trim();
    if (suffix) {
      preprocessed = tablePart + "\n\n" + suffix;
    }
  }

  // Split compact consecutive pipe rows e.g. "| cell | | next |" -> "|\n|"
  preprocessed = preprocessed.replace(/\|\s*\|\s*[-:]+/g, "|\n|---");
  preprocessed = preprocessed.replace(/\|\s*\|\s*/g, "|\n| ");

  const lines = preprocessed.split("\n");
  const blocks = [];
  const tables = [];
  let currentTable = [];
  let detectedTitle = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      if (currentTable.length > 0) {
        blocks.push({ type: "table", rows: currentTable });
        tables.push(currentTable);
        currentTable = [];
      }
      continue;
    }

    // Check for table rows (pipe separated | col1 | col2 | or col1 | col2)
    const isSeparator = /^\|?(\s*[-:]+\s*\|?)+$/.test(trimmed);
    const hasPipe = trimmed.includes("|");

    if (hasPipe) {
      if (isSeparator) {
        continue;
      }
      const rawCells = trimmed.split("|");
      if (trimmed.startsWith("|")) rawCells.shift();
      if (trimmed.endsWith("|")) rawCells.pop();
      const cells = rawCells.map(c => c.trim().replace(/\*\*/g, ""));
      if (cells.length >= 2) {
        currentTable.push(cells);
        continue;
      }
    }

    if (currentTable.length > 0) {
      blocks.push({ type: "table", rows: currentTable });
      tables.push(currentTable);
      currentTable = [];
    }

    // Check for Headings
    if (trimmed.startsWith("# ")) {
      const text = trimmed.replace(/^#\s+/, "").replace(/\*\*/g, "");
      if (!detectedTitle) detectedTitle = text;
      blocks.push({ type: "h1", text });
    } else if (trimmed.startsWith("## ")) {
      const text = trimmed.replace(/^##\s+/, "").replace(/\*\*/g, "");
      if (!detectedTitle) detectedTitle = text;
      blocks.push({ type: "h2", text });
    } else if (trimmed.startsWith("### ")) {
      const text = trimmed.replace(/^###\s+/, "").replace(/\*\*/g, "");
      blocks.push({ type: "h3", text });
    } else if (trimmed.startsWith("#### ")) {
      const text = trimmed.replace(/^####\s+/, "").replace(/\*\*/g, "");
      blocks.push({ type: "h4", text });
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || /^\d+\.\s+/.test(trimmed)) {
      const text = trimmed.replace(/^([-*]|\d+\.)\s+/, "");
      blocks.push({ type: "bullet", text });
    } else {
      blocks.push({ type: "paragraph", text: trimmed });
    }
  }

  if (currentTable.length > 0) {
    blocks.push({ type: "table", rows: currentTable });
    tables.push(currentTable);
  }

  return {
    title: detectedTitle || "BRO AI Document Report",
    blocks,
    tables
  };
}

/**
 * Format bytes to readable string (e.g. 14.5 KB)
 */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "1 KB";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/**
 * Clean filename slug
 */
function sanitizeFilename(name, ext, customFilename = null) {
  if (customFilename) {
    const cleaned = customFilename.replace(/[^a-zA-Z0-9._-]/g, "_");
    if (cleaned.toLowerCase().endsWith(`.${ext}`)) return cleaned;
    return `${cleaned}.${ext}`;
  }
  let base = (name || "bro_ai_document")
    .toLowerCase()
    .replace(/^(sure_thing|here_is|heres|of_course|certainly)[_-]+/i, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 45);
  return `${base || "document"}_${Date.now()}.${ext}`;
}

/**
 * 1. Generate PDF Document using PDFKit
 */
export async function generatePDFDocument({ title, content, customFilename = null, metadata = {} }) {
  return new Promise((resolve, reject) => {
    try {
      const structured = parseContentToStructuredBlocks(content);
      const docTitle = title || structured.title || "BRO AI Document Export";
      const filename = sanitizeFilename(docTitle, "pdf", customFilename);
      const filePath = path.join(GENERATED_DIR, filename);

      const doc = new PDFDocument({
        margin: 50,
        size: "A4",
        info: {
          Title: docTitle,
          Author: "BRO AI (W.E.D.N.E.S.D.A.Y. Pro)",
          Creator: "BRO AI On-Demand Engine"
        }
      });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Top Accent Banner
      doc.rect(50, 40, doc.page.width - 100, 4).fill("#0284c7");
      doc.moveDown(1.5);

      // Title
      doc.fillColor("#0f172a")
        .fontSize(22)
        .font("Helvetica-Bold")
        .text(docTitle, { align: "left" });

      // Subtitle / Date
      const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      doc.fillColor("#64748b")
        .fontSize(10)
        .font("Helvetica")
        .text(`Generated by BRO AI Assistant  •  ${dateStr}`, { align: "left" });

      doc.moveDown(1);
      doc.strokeColor("#e2e8f0").lineWidth(1).moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
      doc.moveDown(1.2);

      // Render structured blocks
      for (const block of structured.blocks) {
        // Avoid rendering title twice if it matched docTitle
        if (block.text === docTitle && (block.type === "h1" || block.type === "h2")) continue;

        if (block.type === "h1") {
          doc.moveDown(0.8);
          doc.fillColor("#0369a1").fontSize(16).font("Helvetica-Bold").text(block.text);
          doc.moveDown(0.3);
        } else if (block.type === "h2") {
          doc.moveDown(0.6);
          doc.fillColor("#0284c7").fontSize(14).font("Helvetica-Bold").text(block.text);
          doc.moveDown(0.2);
        } else if (block.type === "h3" || block.type === "h4") {
          doc.moveDown(0.5);
          doc.fillColor("#0f172a").fontSize(12).font("Helvetica-Bold").text(block.text);
          doc.moveDown(0.2);
        } else if (block.type === "bullet") {
          doc.fillColor("#334155").fontSize(10.5).font("Helvetica");
          doc.text(`•  ${block.text.replace(/\*\*/g, "")}`, { indent: 12, lineGap: 3 });
        } else if (block.type === "paragraph") {
          if (doc.y + 35 > doc.page.height - 50) {
            doc.addPage();
          }
          doc.fillColor("#334155").fontSize(10.5).font("Helvetica");
          doc.text(block.text.replace(/\*\*/g, ""), { lineGap: 3 });
          doc.moveDown(0.5);
        } else if (block.type === "table" && block.rows.length > 0) {
          doc.moveDown(0.5);
          const colCount = block.rows[0].length;
          const tableWidth = doc.page.width - 100;
          const colWidth = tableWidth / Math.max(1, colCount);

          block.rows.forEach((row, rIdx) => {
            const isHeader = rIdx === 0;

            // Check if row exceeds page height and add page if needed
            if (doc.y + 30 > doc.page.height - 50) {
              doc.addPage();
              // Repeat header row on new page for visual continuity
              if (!isHeader && block.rows.length > 0) {
                const hRow = block.rows[0];
                const hY = doc.y;
                doc.rect(50, hY, tableWidth, 20).fill("#f1f5f9");
                hRow.forEach((cell, cIdx) => {
                  doc.fillColor("#0f172a")
                    .fontSize(9.5)
                    .font("Helvetica-Bold")
                    .text(cell, 55 + cIdx * colWidth, hY + 4, {
                      width: colWidth - 10,
                      ellipsis: true
                    });
                });
                doc.y = hY + 22;
                doc.strokeColor("#e2e8f0").lineWidth(0.5).moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
              }
            }

            const startY = doc.y;

            // Header background
            if (isHeader) {
              doc.rect(50, startY, tableWidth, 20).fill("#f1f5f9");
            }

            row.forEach((cell, cIdx) => {
              doc.fillColor(isHeader ? "#0f172a" : "#334155")
                .fontSize(isHeader ? 9.5 : 9)
                .font(isHeader ? "Helvetica-Bold" : "Helvetica")
                .text(cell, 55 + cIdx * colWidth, startY + 4, {
                  width: colWidth - 10,
                  ellipsis: true
                });
            });

            doc.y = startY + (isHeader ? 22 : 18);
            doc.strokeColor("#e2e8f0").lineWidth(0.5).moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
          });
          doc.moveDown(0.8);
        }
      }

      // Page numbers on footers
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.fillColor("#94a3b8")
          .fontSize(8.5)
          .font("Helvetica")
          .text(`Page ${i + 1} of ${range.count}  •  Confidential & Verified by BRO AI`, 50, doc.page.height - 35, {
            align: "center",
            width: doc.page.width - 100
          });
      }

      doc.end();

      writeStream.on("finish", () => {
        const stats = fs.statSync(filePath);
        resolve({
          success: true,
          format: "pdf",
          filename,
          filePath,
          sizeBytes: stats.size,
          sizeFormatted: formatFileSize(stats.size),
          title: docTitle
        });
      });

      writeStream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * 2. Generate Word Document (.docx) using docx
 */
export async function generateWordDocument({ title, content, customFilename = null, metadata = {} }) {
  const structured = parseContentToStructuredBlocks(content);
  const docTitle = title || structured.title || "BRO AI Document Export";
  const filename = sanitizeFilename(docTitle, "docx", customFilename);
  const filePath = path.join(GENERATED_DIR, filename);

  const docChildren = [];

  // Title
  docChildren.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.LEFT,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: docTitle,
          bold: true,
          size: 32,
          color: "0F172A",
          font: "Calibri"
        })
      ]
    })
  );

  // Subtitle
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  docChildren.push(
    new Paragraph({
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: `Generated by BRO AI Personal Assistant  •  ${dateStr}`,
          italics: true,
          size: 18,
          color: "64748B",
          font: "Calibri"
        })
      ]
    })
  );

  // Body Blocks
  for (const block of structured.blocks) {
    if (block.text === docTitle && (block.type === "h1" || block.type === "h2")) continue;

    if (block.type === "h1") {
      docChildren.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 },
          children: [new TextRun({ text: block.text, bold: true, size: 26, color: "0284C7", font: "Calibri" })]
        })
      );
    } else if (block.type === "h2") {
      docChildren.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
          children: [new TextRun({ text: block.text, bold: true, size: 22, color: "0369A1", font: "Calibri" })]
        })
      );
    } else if (block.type === "h3" || block.type === "h4") {
      docChildren.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 160, after: 80 },
          children: [new TextRun({ text: block.text, bold: true, size: 20, color: "0F172A", font: "Calibri" })]
        })
      );
    } else if (block.type === "bullet") {
      docChildren.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 60 },
          children: [new TextRun({ text: block.text.replace(/\*\*/g, ""), size: 20, color: "334155", font: "Calibri" })]
        })
      );
    } else if (block.type === "paragraph") {
      docChildren.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: block.text.replace(/\*\*/g, ""), size: 20, color: "334155", font: "Calibri" })]
        })
      );
    } else if (block.type === "table" && block.rows.length > 0) {
      const tableRows = block.rows.map((row, rIdx) => {
        const isHeader = rIdx === 0;
        return new TableRow({
          tableHeader: isHeader,
          children: row.map(cell => {
            return new TableCell({
              shading: isHeader ? { fill: "F1F5F9" } : undefined,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: cell,
                      bold: isHeader,
                      size: isHeader ? 19 : 18,
                      color: isHeader ? "0F172A" : "334155",
                      font: "Calibri"
                    })
                  ]
                })
              ]
            });
          })
        });
      });

      docChildren.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: tableRows
        })
      );
      docChildren.push(new Paragraph({ spacing: { after: 160 } }));
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docChildren
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filePath, buffer);
  const stats = fs.statSync(filePath);

  return {
    success: true,
    format: "word",
    filename,
    filePath,
    sizeBytes: stats.size,
    sizeFormatted: formatFileSize(stats.size),
    title: docTitle
  };
}

/**
 * 3. Generate Excel Spreadsheet (.xlsx) using SheetJS
 */
export async function generateExcelSpreadsheet({ title, content, rawRows = null, customFilename = null, metadata = {} }) {
  const structured = parseContentToStructuredBlocks(content || "");
  const docTitle = title || structured.title || "BRO AI Data Sheet";
  const filename = sanitizeFilename(docTitle, "xlsx", customFilename);
  const filePath = path.join(GENERATED_DIR, filename);

  let sheetData = [];

  if (Array.isArray(rawRows) && rawRows.length > 0) {
    sheetData = rawRows;
  } else if (structured.tables.length > 0) {
    // If structured markdown tables exist, take the first/main table
    sheetData = structured.tables[0];
  } else {
    // Extract structured lines (e.g. "Rahul|21A01" or "Name: Rahul, Roll: 21A01" or bullet points)
    const lines = (content || "").split("\n").map(l => l.trim()).filter(Boolean);
    const parsedRows = [];

    lines.forEach(line => {
      // Pipe separated
      if (line.includes("|")) {
        const parts = line.split("|").map(p => p.trim()).filter(Boolean);
        if (!line.includes("---")) parsedRows.push(parts);
      } else if (line.includes("\t")) {
        parsedRows.push(line.split("\t").map(p => p.trim()));
      } else if (line.includes(",")) {
        parsedRows.push(line.split(",").map(p => p.trim()));
      } else if (line.includes(":") && !line.startsWith("http")) {
        const [k, ...rest] = line.split(":");
        parsedRows.push([k.trim(), rest.join(":").trim()]);
      } else {
        parsedRows.push([line.replace(/^[-*]\s+/, "")]);
      }
    });

    sheetData = parsedRows.length > 0 ? parsedRows : [["Data Item"], ["No structured data specified"]];
  }

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Set intelligent column widths
  if (sheetData.length > 0) {
    const colWidths = [];
    const maxCols = Math.max(...sheetData.map(r => r.length));
    for (let c = 0; c < maxCols; c++) {
      let maxLen = 12;
      sheetData.forEach(row => {
        const cell = row[c];
        if (cell) {
          maxLen = Math.max(maxLen, String(cell).length + 3);
        }
      });
      colWidths.push({ wch: Math.min(maxLen, 45) });
    }
    ws["!cols"] = colWidths;
  }

  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, filePath);
  const stats = fs.statSync(filePath);

  return {
    success: true,
    format: "excel",
    filename,
    filePath,
    sizeBytes: stats.size,
    sizeFormatted: formatFileSize(stats.size),
    title: docTitle
  };
}

/**
 * Universal dispatcher for file generation
 */
export async function generateOnDemandFile({ format, title, content, rawRows = null, customFilename = null, metadata = {} }) {
  switch (format.toLowerCase()) {
    case "pdf":
      return await generatePDFDocument({ title, content, customFilename, metadata });
    case "word":
    case "docx":
    case "doc":
      return await generateWordDocument({ title, content, customFilename, metadata });
    case "excel":
    case "xlsx":
    case "spreadsheet":
    case "sheet":
      return await generateExcelSpreadsheet({ title, content, rawRows, customFilename, metadata });
    default:
      throw new Error(`Unsupported file format: ${format}. Supported formats are pdf, word (docx), and excel (xlsx).`);
  }
}
