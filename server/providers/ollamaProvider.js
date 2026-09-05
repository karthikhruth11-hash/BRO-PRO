import { BaseProvider } from "./baseProvider.js";

export class OllamaProvider extends BaseProvider {
  constructor(baseURL = process.env.OLLAMA_BASE_URL || "http://localhost:11434") {
    super("Ollama");
    this.baseURL = baseURL;
  }

  async isAvailable() {
    try {
      const res = await fetch(`${this.baseURL}/api/tags`, { signal: AbortSignal.timeout(2000) });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  async discoverModels() {
    try {
      const res = await fetch(`${this.baseURL}/api/tags`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) return [];
      const data = await res.json();
      if (!data.models) return [];
      return data.models.map(m => ({
        name: m.name,
        size: m.size,
        modifiedAt: m.modified_at,
        provider: "ollama"
      }));
    } catch (e) {
      return [];
    }
  }

  async generate({ prompt, systemPrompt, model = "llama3", temperature = 0.7 }) {
    try {
      const res = await fetch(`${this.baseURL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [
            ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
            { role: "user", content: prompt }
          ],
          stream: false,
          options: { temperature }
        })
      });

      if (!res.ok) {
        throw new Error(`Ollama API error status ${res.status}`);
      }

      const data = await res.json();
      const text = data.message?.content || "";
      return {
        text,
        provider: `Ollama (${model})`,
        model,
        usage: data.eval_count || 0
      };
    } catch (err) {
      throw new Error(`Ollama generation failed: ${err.message}`);
    }
  }
}

export const ollamaProvider = new OllamaProvider();
