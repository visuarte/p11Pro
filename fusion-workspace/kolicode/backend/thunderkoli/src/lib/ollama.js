
class OllamaClient {
  constructor(model = 'deepseek-coder:1.3b', endpoint = 'http://localhost:11434/api/generate') {
    this.model = model;
    this.endpoint = endpoint;
  }

  async generate(prompt, system = '') {
    console.log(`[Ollama] Generating with model ${this.model}...`);
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          system: system,
          stream: false
        })
      });

      if (!response.ok) throw new Error(`Ollama Error: ${response.statusText}`);
      
      const data = await response.json();
      return data.response;
    } catch (err) {
      console.error('[Ollama Client Error]', err);
      throw err;
    }
  }

  async chat(messages, system = '') {
    const chatEndpoint = this.endpoint.replace('/generate', '/chat');
    try {
      const response = await fetch(chatEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          system: system,
          stream: false
        })
      });

      if (!response.ok) throw new Error(`Ollama Chat Error: ${response.statusText}`);
      
      const data = await response.json();
      return data.message.content;
    } catch (err) {
      console.error('[Ollama Chat Error]', err);
      throw err;
    }
  }
}

module.exports = OllamaClient;
