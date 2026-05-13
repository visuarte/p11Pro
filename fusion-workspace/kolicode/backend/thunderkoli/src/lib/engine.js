const ArchitectAgent = require('../agents/architect');
const ExecutorAgent = require('../agents/executor');
const path = require('path');
const fs = require('fs/promises');
const intelligence = require('./intelligence');

class ThunderEngine {
    constructor() {
        this.architect = new ArchitectAgent();
        this.executor = new ExecutorAgent();
        this.vaultPath = path.join(__dirname, '..', 'vault');
    }

    /**
     * Proceso principal de orquestación (El Cerebro)
     */
    async processMission(prompt, options = {}) {
        const { mode = "internal", role = "default", provider = "ollama", apiKey = "", userState = "directo", teamContext = {} } = options;

        // 1. Preparar contexto según el estado del usuario
        const stateContext = {
            ...teamContext,
            userState, // "directo" o "consulta"
            isDirect: userState === "directo"
        };

        // 2. Fase 0: Inteligencia Rígida (Deep NLP / BERT / NER)
        const intelReport = await intelligence.analyze(prompt);
        if (intelReport) {
            console.log(`[Engine] Deep NLP Analysis: Sentiment=${intelReport.sentiment.label} (${(intelReport.sentiment.score * 100).toFixed(0)}%), Entities=[${intelReport.entities.join(', ')}]`);
        }

        // 3. Fase de Arquitectura - Creación del Plan (con Pipeline de 6 pasos)
        console.log(`[Engine] Analyzing Request via Pipeline [State: ${userState}]`);
        const plan = await this.architect.createPlan(prompt, { ...stateContext, intelReport });

        if (!plan || !plan.pipeline) {
            throw new Error('El Engine no recibió un análisis de pipeline válido del Arquitecto.');
        }

        const action = plan.action || "execute";
        let executionResults = [];
        let context = "";
        const executorOptions = { provider, apiKey, userState, pipeline: plan.pipeline };

        // 3. Fase de Decisión de Acción (Paso 6 del Pipeline)
        const steps = plan.steps || [];
        
        if (action === "clarify") {
            console.log(`[Engine] Action: Clarify requested.`);
            return {
                agent: "ThunderKoli Engine v1.6",
                message: `🔍 **Necesito más información**: El análisis detectó ambigüedad. ${plan.meta.goal || "¿Podrías ser más específico con tu petición técnica?"}`,
                pipeline: plan.pipeline,
                context: plan,
                timestamp: new Date().toISOString()
            };
        }

        if (action === "respond" || steps.length === 0) {
            console.log(`[Engine] Action: Direct Response via ${provider}`);
            const directResponse = await this.executor.executeTask({ task: prompt }, "", executorOptions);
            executionResults.push({ task: prompt, result: directResponse });
        } else {
            // Acción: Execute (Misión multi-paso)
            for (const step of steps) {
                console.log(`[Engine] Executing Task ${step.id}: ${step.task}`);
                const result = await this.executor.executeTask(step, context, executorOptions);
                executionResults.push({ task: step.task, result });
                context += `\nAnterior (${step.task}): ${result}`;
            }
            
            // Guardar reporte físico solo en misiones de ejecución
            await this.saveMissionToFile(plan, executionResults);
        }

        // 4. Consolidación de respuesta
        const finalMessage = executionResults.length > 0 
            ? executionResults.map(r => r.result).join("\n\n")
            : "Engine: Misión finalizada sin salida de texto.";

        return {
            agent: "ThunderKoli Engine v1.6",
            message: finalMessage,
            pipeline: plan.pipeline,
            intel: intelReport, // Inyectar pre-análisis para visualización
            context: plan,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Persistencia física de resultados
     */
    async saveMissionToFile(plan, results) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `engine_mission_${timestamp}.md`;
            const filePath = path.join(this.vaultPath, fileName);
            
            let content = `# INFORME DE ENGINE THUNDERKOLI\n`;
            content += `Fecha: ${new Date().toLocaleString()}\n`;
            content += `Objetivo: ${plan.meta.goal}\n\n`;
            content += `## RESULTADOS DE EJECUCIÓN\n\n`;
            
            results.forEach(r => {
                content += `### Tarea: ${r.task}\n${r.result}\n\n`;
            });
            
            content += `--- \nThunderKoli Brain / Persistent Storage Mode`;
            await fs.writeFile(filePath, content, 'utf-8');
            return fileName;
        } catch (err) {
            console.error('[Engine Save Error]', err);
        }
    }
}

module.exports = ThunderEngine;
