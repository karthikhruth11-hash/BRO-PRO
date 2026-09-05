export class BaseProvider {
  constructor(name) {
    this.name = name;
  }

  async isAvailable() {
    return false;
  }

  async discoverModels() {
    return [];
  }

  async generate({ prompt, systemPrompt, tools, temperature = 0.7, maxTokens, stream = false }) {
    throw new Error(`generate() method not implemented for provider ${this.name}`);
  }
}
