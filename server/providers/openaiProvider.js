import { BaseProvider } from "./baseProvider.js";

export class OpenAIProvider extends BaseProvider {
  constructor(apiKey = null) {
    super("OpenAI");
    this.apiKey = apiKey;
    this.model = "gpt-4o-mini";
  }

  getApiKey() {
    return this.apiKey || process.env.OPENAI_API_KEY;
  }

  async isAvailable() {
    const key = this.getApiKey();
    return Boolean(key && key.startsWith("sk-"));
  }

  async discoverModels() {
    return [{ name: "gpt-4o-mini", provider: "openai" }, { name: "gpt-4o", provider: "openai" }];
  }

  async generate({ prompt, systemPrompt, model = "gpt-4o-mini", temperature = 0.7 }) {
    const key = this.getApiKey();
    if (!key) throw new Error("OpenAI API key not configured");

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
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
      throw new Error(`OpenAI API error status ${res.status}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    return {
      text,
      provider: `OpenAI (${model})`,
      model,
      usage: data.usage?.total_tokens || 0
    };
  }
}

export const openaiProvider = new OpenAIProvider();
