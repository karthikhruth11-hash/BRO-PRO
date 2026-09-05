// Approved executables and shell command prefixes for system safety
export const ALLOWED_EXECUTABLES = {
  notepad: { command: "notepad.exe", desc: "Text Editor" },
  spotify: { command: "spotify.exe", desc: "Music Player" },
  whatsapp: { command: "whatsapp.exe", desc: "Messenger" },
  calculator: { command: "calc.exe", desc: "System Calculator" },
  browser: { command: "start https://google.com", desc: "Web Browser" },
  vscode: { command: "code", desc: "VS Code Editor" },
  terminal: { command: "start cmd", desc: "Windows Command Prompt" }
};

export const ALLOWED_SHELL_PATTERNS = [
  /^echo\s+/i,
  /^dir\s*/i,
  /^tasklist\s*/i,
  /^systeminfo\s*/i,
  /^ipconfig\s*/i,
  /^node -v$/i,
  /^npm -v$/i,
  /^git status$/i
];

export function isCommandAllowed(rawCmd) {
  if (!rawCmd || typeof rawCmd !== "string") return false;
  const cleanCmd = rawCmd.trim();
  
  // Check exact executable alias match
  if (ALLOWED_EXECUTABLES[cleanCmd.toLowerCase()]) return true;
  
  // Check shell pattern regex match
  return ALLOWED_SHELL_PATTERNS.some((pattern) => pattern.test(cleanCmd));
}
