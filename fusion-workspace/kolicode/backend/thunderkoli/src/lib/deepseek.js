/**
 * Cliente para interactuar con la API oficial de DeepSeek (Cloud)
 * Compatible con OpenAI API
 */
class DeepSeekClient {
  constructor(apiKey, model = 'deepseek-chat') {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = 'https://api.deepseek.com';
  }

  async generate(prompt, system = '') {
    if (!this.apiKey) throw new Error('DeepSeek API Key no configurada.');

    console.log(`[DeepSeek Cloud] Petición enviada al modelo ${this.model}...`);
    
    // Timeout de 45 segundos para no bloquear el sistema
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: prompt }
          ],
          stream: false
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Error en DeepSeek API: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (err) {
      console.error('[DeepSeek Client Error]', err);
      throw err;
    }
  }

  /**
   * Valida si una API Key es correcta enviando un prompt mínimo
   */
  static async validateKey(apiKey) {
    const tester = new DeepSeekClient(apiKey);
    try {
      await tester.generate('ping', 'Responde solo "pong"');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

module.exports = DeepSeekClient;
