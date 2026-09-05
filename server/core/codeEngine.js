// JARVIS — UNIVERSAL PROGRAMMING & CODE GENERATION ENGINE (15-Section Architecture)

export class CodeProjectStateManager {
  constructor() {
    this.activeProject = {
      language: null,
      framework: null,
      activeCode: null,
      functionNames: [],
      requirements: [],
      history: []
    };
  }

  getProject() {
    return this.activeProject;
  }

  updateProject({ language, framework, code, requirement }) {
    if (language) this.activeProject.language = language;
    if (framework) this.activeProject.framework = framework;
    if (code) this.activeProject.activeCode = code;
    if (requirement) this.activeProject.requirements.push(requirement);

    this.activeProject.history.push({
      language: this.activeProject.language,
      code: this.activeProject.activeCode,
      timestamp: new Date().toISOString()
    });
  }
}

export const globalCodeState = new CodeProjectStateManager();

// 1. Universal Semantic Language Identifier
export function detectProgrammingLanguage(input) {
  const pLower = input.toLowerCase().trim();

  const langAliases = [
    { keys: ["cpp", "c++", "c plus plus"], lang: "cpp", ext: "cpp" },
    { keys: ["c program", "c code", "in c", "using c"], lang: "c", ext: "c" },
    { keys: ["python", "py", "flask", "django", "fastapi"], lang: "python", ext: "py" },
    { keys: ["java", "jdk", "spring"], lang: "java", ext: "java" },
    { keys: ["javascript", "js", "node", "nodejs"], lang: "javascript", ext: "js" },
    { keys: ["typescript", "ts"], lang: "typescript", ext: "ts" },
    { keys: ["react", "jsx"], lang: "jsx", ext: "jsx" },
    { keys: ["c#", "csharp", ".net"], lang: "csharp", ext: "cs" },
    { keys: ["go", "golang"], lang: "go", ext: "go" },
    { keys: ["rust", "rs"], lang: "rust", ext: "rs" },
    { keys: ["html", "css", "html css"], lang: "html", ext: "html" },
    { keys: ["sql", "query", "mysql", "postgres"], lang: "sql", ext: "sql" },
    { keys: ["bash", "shell", "sh"], lang: "bash", ext: "sh" },
    { keys: ["powershell", "ps1"], lang: "powershell", ext: "ps1" },
    { keys: ["php"], lang: "php", ext: "php" },
    { keys: ["ruby"], lang: "ruby", ext: "rb" },
    { keys: ["swift"], lang: "swift", ext: "swift" },
    { keys: ["kotlin"], lang: "kotlin", ext: "kt" },
    { keys: ["dart", "flutter"], lang: "dart", ext: "dart" }
  ];

  for (const item of langAliases) {
    if (item.keys.some(k => pLower.includes(k))) {
      return item;
    }
  }

  // Fallback to active project language if conversation is ongoing
  const activeProj = globalCodeState.getProject();
  if (activeProj.language) {
    return { lang: activeProj.language, ext: activeProj.language };
  }

  return { lang: "python", ext: "py" };
}

// 2. Universal Programming Intent Classifier
export function classifyProgrammingIntent(input) {
  const pLower = input.toLowerCase().trim();

  // Explicit Explanation Request (no code block needed)
  if (pLower.startsWith("explain ") || pLower.startsWith("tell me about ") || pLower.startsWith("how does ")) {
    if (!pLower.includes("code") && !pLower.includes("write") && !pLower.includes("example") && !pLower.includes("program")) {
      return { intent: "CODE_EXPLANATION", needsCode: false };
    }
  }

  // Run Guidance
  if (pLower.includes("how do i run") || pLower.includes("how to run") || pLower.includes("how to execute")) {
    return { intent: "RUN_GUIDANCE", needsCode: false };
  }

  // Conversion Request
  if (pLower.includes("convert") || pLower.includes("translate to") || pLower.includes("switch to")) {
    return { intent: "CODE_CONVERSION", needsCode: true };
  }

  // Code Triggers
  const codeTriggers = [
    "write", "create", "make", "give me", "generate", "code", "program", "script",
    "implement", "build", "calculator", "login", "factorial", "add two numbers", "sort",
    "fibonacci", "function", "class", "algorithm", "array", "string", "loop", "api",
    "app", "page", "game", "query", "crud", "form", "button", "component", "example",
    "python", "java", "javascript", "typescript", "c++", "cpp", "html", "css", "sql", "golang", "rust"
  ];

  if (codeTriggers.some(t => pLower.includes(t))) {
    return { intent: "CODE_GENERATION", needsCode: true };
  }

  return { intent: "GENERAL_PROGRAMMING", needsCode: false };
}

// 3. Clean Code Response Formatter (Zero Boilerplate Research Cards)
export function formatCodeResponse({ intro, code, lang, explanation, runGuide, expectedOutput }) {
  let markdown = `${intro || "Here is the requested implementation:"}\n\n`;

  markdown += `\`\`\`${lang || "text"}\n${code.trim()}\n\`\`\`\n\n`;

  if (explanation) {
    markdown += `### 💡 Explanation\n${explanation}\n\n`;
  }

  if (runGuide) {
    markdown += `### ⚙️ How to Run\n${runGuide}\n\n`;
  }

  if (expectedOutput) {
    markdown += `### 💻 Expected Output\n\`\`\`\n${expectedOutput}\n\`\`\`\n`;
  }

  return markdown.trim();
}
