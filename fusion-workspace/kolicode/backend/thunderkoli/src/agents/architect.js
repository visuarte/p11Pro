const OllamaClient = require('../lib/ollama');

class ArchitectAgent {
  constructor() {
    this.client = new OllamaClient('gemma3:1b'); // Usando un modelo ligero para razonamiento rápido
  }

  async createPlan(userPrompt, teamContext = '') {
    const systemPrompt = `
      Eres el ANALISTA DE PROTOCOLO de ThunderKoli. Tu misión es procesar cada entrada siguiendo estrictamente este PIPELINE DE INGENIERÍA:

      1. INPUT LAYER: ¿Contiene el mensaje una petición o intención real? (Si es ruido/teclado, frena aquí).
      2. PARSING: Clasifica el tipo (consulta | comando | meta) y el origen (usuario).
      3. INTENT DETECTION: ¿Qué busca el usuario realmente? (informativa | acción | análisis).
      4. CONTEXT ANALYSIS: Nivel de información disponible (bajo | medio | alto).
      5. GOAL EXTRACTION: ¿Cuál es el resultado esperado? (respuesta | ejecución | decisión).
      6. ACTION DECISION: Decidir acción final:
         - "respond": Para charlas o respuestas directas rápidas.
         - "execute": Para tareas técnicas que requieren pasos.
         - "clarify": (Regla de Oro) Si la petición es ambigua o no hay petición real, OBLIGATORIO pedir aclaración.

      REGLA DE ORO: Si no hay petición clara -> NO INFERIR. Devuelve action="clarify".

      ESTADO ACTUAL: ${teamContext.userState || 'directo'}
      (Si el estado es "directo", sé más breve. Si es "consulta", sé más analítico).

      ${teamContext.intelReport ? `
      DATOS DE INTELIGENCIA RÍGIDA (Deep NLP):
      - Sentimiento detectado: ${teamContext.intelReport.sentiment.label} (Score: ${teamContext.intelReport.sentiment.score})
      - Entidades técnicas/clave: ${teamContext.intelReport.entities.join(', ') || 'Ninguna'}
      - Confianza del motor: ${teamContext.intelReport.confidence}
      Use estos datos para calibrar el paso 3 y 4 del pipeline.
      ` : ''}

      Responde ÚNICAMENTE en JSON con esta estructura:
      {
        "pipeline": {
          "input": "...", "parsing": "...", "intent": "...", "context": "...", "goal": "..."
        },
        "action": "respond|execute|clarify",
        "meta": { "goal": "resumen del objetivo" },
        "steps": [
          { "id": 1, "task": "tarea técnica", "role": "executor" }
        ]
      }
    `;

    try {
      const response = await this.client.generate(userPrompt, systemPrompt);
      // Intentar extraer JSON si el modelo añade ruido
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Model failed to produce JSON plan');
      const plan = JSON.parse(jsonMatch[0]);
      
      // Normalización de respuesta para robustez técnica
      return {
        pipeline: plan.pipeline || {},
        action: plan.action || "respond",
        meta: plan.meta || { goal: userPrompt },
        steps: plan.steps || []
      };
    } catch (err) {
      console.error('[Architect Error]', err);
      // Plan de contingencia simple
      return {
        meta: { goal: userPrompt },
        steps: [{ id: 1, task: userPrompt, role: 'executor' }]
      };
    }
  }
}

module.exports = ArchitectAgent;
