import { BaseProvider } from "./baseProvider.js";

export class GeminiProvider extends BaseProvider {
  constructor(apiKey = null) {
    super("Gemini");
    this.apiKey = apiKey;
    this.model = "gemini-3.6-flash";
  }

  getApiKey() {
    return this.apiKey || process.env.GEMINI_API_KEY;
  }

  async isAvailable() {
    const key = this.getApiKey();
    return Boolean(key && key.length > 10);
  }

  async discoverModels() {
    return [{ name: this.model, provider: "google" }];
  }

  async generate({ prompt, systemPrompt, temperature = 0.7 }) {
    const key = this.getApiKey();
    if (!key) throw new Error("Gemini API key not configured");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${key}`;
    const fullText = systemPrompt ? `[System Directive: ${systemPrompt}]\nUser: ${prompt}` : prompt;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: fullText }] }]
      })
    });

    if (!res.ok) {
      throw new Error(`Gemini API error status ${res.status}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return {
      text,
      provider: `Gemini (${this.model})`,
      model: this.model,
      usage: 0
    };
  }
}

export const geminiProvider = new GeminiProvider();
