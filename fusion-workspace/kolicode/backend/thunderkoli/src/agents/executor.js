const OllamaClient = require('../lib/ollama');
const DeepSeekClient = require('../lib/deepseek');

class ExecutorAgent {
  constructor() {
    this.localClient = new OllamaClient('deepseek-coder:1.3b'); // Default local
  }

  async executeTask(step, context = '', options = { provider: 'ollama' }) {
    const pipeline = options.pipeline || {};
    const systemPrompt = `
      Eres el EJECUTOR de ThunderKoli. Tu tarea es cumplir una misión específica desglosada por el Arquitecto.
      
      ESTADO ACTUAL: ${options.userState || 'directo'}
      DIAGNÓSTICO DEL PIPELINE:
      - Intención: ${pipeline.intent || 'No definida'}
      - Meta: ${pipeline.goal || 'No definida'}
      - Contexto: ${pipeline.context || 'No definido'}
      
      Reglas de Respuesta:
      - Si ESTADO == "directo": Responde de forma ultra-breve y técnica.
      - Si ESTADO == "consulta": Sé descriptivo y explica tu proceso.
      
      Misión actual: ${step.task}
      Contexto previo: ${context}
      
      Responde de forma técnica y precisa.
    `;

    try {
      if (options.provider === 'deepseek' && options.apiKey) {
        const cloudClient = new DeepSeekClient(options.apiKey);
        return await cloudClient.generate(step.task, systemPrompt);
      } else {
        return await this.localClient.generate(step.task, systemPrompt);
      }
    } catch (err) {
      console.error('[Executor Error]', err);
      return `Error al ejecutar la tarea: ${step.task} (${err.message})`;
    }
  }
}

module.exports = ExecutorAgent;
