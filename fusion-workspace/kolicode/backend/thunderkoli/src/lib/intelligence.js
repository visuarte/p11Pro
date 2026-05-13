/**
 * THUNDER INTEL ENGINE
 * Capa de Inteligencia Rígida (Deep NLP) optimizada para Mac M1.
 * Utiliza modelos cuantizados para minimizar el uso de RAM.
 */

const { pipeline } = require('@huggingface/transformers');
const natural = require('natural');

class ThunderIntelligence {
  constructor() {
    this.sentimentPipe = null;
    this.nerPipe = null;
    this.tokenizer = new natural.WordTokenizer();
    this.isLoaded = false;
    this.isInitializing = false;
  }

  /**
   * Inicializa los modelos de forma perezosa (Lazy Loading)
   */
  async init() {
    if (this.isLoaded || this.isInitializing) return;
    this.isInitializing = true;
    
    console.log('[Intelligence] 📡 Descargando/Cargando modelos optimizados (M1 compatible)...');
    
    try {
      // Modelo de Sentimiento (Multilingüe, muy ligero ~40MB)
      this.sentimentPipe = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-multilingual-cased-sentiments-student');
      
      // Modelo de NER (Entidades - Personas, Orgs, Loc, Misc ~80MB)
      this.nerPipe = await pipeline('token-classification', 'Xenova/bert-base-multilingual-cased-ner-hrl');
      
      this.isLoaded = true;
      console.log('[Intelligence] ✅ Modelos Deep NLP cargados con éxito.');
    } catch (err) {
      console.error('[Intelligence] ❌ Error cargando modelos:', err);
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Analiza un texto y devuelve un reporte de diagnóstico
   */
  async analyze(text) {
    if (!text || text.trim().length < 2) return null;
    
    if (!this.isLoaded) await this.init();

    const startTime = Date.now();
    const results = {
      sentiment: { label: 'NEUTRAL', score: 0 },
      entities: [],
      confidence: 0,
      processingTime: 0
    };

    try {
      // 1. Análisis de Sentimiento
      if (this.sentimentPipe) {
        const [sentiment] = await this.sentimentPipe(text);
        results.sentiment = {
          label: this.mapSentiment(sentiment.label),
          score: sentiment.score
        };
      }

      // 2. Extración de Entidades (NER)
      if (this.nerPipe) {
        const entities = await this.nerPipe(text);
        results.entities = this.groupEntities(entities);
      }

      // 3. Cálculo de Confianza (Heurística basada en longitud y acierto de modelos)
      results.confidence = results.sentiment.score;
      results.processingTime = Date.now() - startTime;

    } catch (err) {
      console.error('[Intelligence] Error en inferencia:', err);
    }

    return results;
  }

  mapSentiment(label) {
    // Mapear etiquetas del modelo a un formato amigable
    const l = label.toLowerCase();
    if (l.includes('positive')) return 'POSITIVE';
    if (l.includes('negative')) return 'NEGATIVE';
    return 'NEUTRAL';
  }

  groupEntities(entities) {
    // Agrupar tokens de NER para formar palabras completas
    if (!entities || entities.length === 0) return [];
    
    const groups = [];
    let current = null;

    for (const ent of entities) {
      if (ent.entity.startsWith('B-')) {
        if (current) groups.push(current);
        current = { 
          word: ent.word.replace('##', ''), 
          type: ent.entity.split('-')[1], 
          score: ent.score 
        };
      } else if (ent.entity.startsWith('I-') && current) {
        current.word += ent.word.startsWith('##') ? ent.word.replace('##', '') : ' ' + ent.word;
      }
    }
    if (current) groups.push(current);

    // Filtrar por confianza y limpiar ruido
    return groups
      .filter(g => g.score > 0.7 && g.word.length > 2)
      .map(g => `${g.word} (${g.type})`);
  }
}

// Singleton pattern
const instance = new ThunderIntelligence();
module.exports = instance;
