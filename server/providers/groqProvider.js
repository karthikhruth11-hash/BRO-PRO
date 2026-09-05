import { BaseProvider } from "./baseProvider.js";

export class GroqProvider extends BaseProvider {
  constructor(apiKey = null) {
    super("Groq");
    this.apiKey = apiKey;
    this.models = ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "groq/compound"];
  }

  getApiKey() {
    return this.apiKey || process.env.GROQ_API_KEY;
  }

  async isAvailable() {
    const key = this.getApiKey();
    return Boolean(key && key.startsWith("gsk_"));
  }

  async discoverModels() {
    return this.models.map(m => ({ name: m, provider: "groq" }));
  }

  async generate({ prompt, systemPrompt, model = "openai/gpt-oss-120b", temperature = 0.7 }) {
    const key = this.getApiKey();
    if (!key) throw new Error("Groq API key not configured");

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [
          ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
          { role: "user", content: prompt }
        ],
        temperature
      })
    });

    if (!res.ok) {
      throw new Error(`Groq API error status ${res.status}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    return {
      text,
      provider: `Groq (${model})`,
      model,
      usage: data.usage?.total_tokens || 0
    };
  }
}

export const groqProvider = new GroqProvider();
