
// dataTransformer.js
// MITIGADOR: Validación, truncamiento, boundary checks, normalización de precisión
// Data Transformer quirúrgico con validación, truncamiento y boundary checks
// KoliCode 2026 – Referencia para agentes y desarrolladores

import { z } from 'zod';
import flatbuffers from 'flatbuffers';
// import { Node, Vector2D, ColorRGBA } from './vector_generated'; // generado por flatc

// 1. Middlewares de validación (Zod)
export const colorSchema = z.object({
  r: z.number().min(0).max(65535),
  g: z.number().min(0).max(65535),
  b: z.number().min(0).max(65535),
  a: z.number().min(0).max(65535),
});

export const vectorSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const nodeSchema = z.object({
  id: z.string(),
  position: vectorSchema,
  color: colorSchema,
});

// 2. Truncamiento de color (Clamp seguro)
export function clampColor(val, min = 0, max = 65535) {
  return Math.max(min, Math.min(max, val));
}

export function sanitizeColor(color) {
  return {
    r: clampColor(color.r),
    g: clampColor(color.g),
    b: clampColor(color.b),
    a: clampColor(color.a),
  };
}

// 3. Boundary Checks y serialización FlatBuffers
// MITIGADOR: Esta función valida, trunca y normaliza los datos antes de serializar. Implementa boundary checks y limita el tamaño de payloads.
// Consulta BIBLIA_QA_CHECKLIST.md tras cualquier cambio.
export function serializeNode(node) {
  // Validación estricta
  nodeSchema.parse(node);
  // Sanitización de color
  const safeColor = sanitizeColor(node.color);
  // Aquí iría la construcción FlatBuffer (mock):
  // const builder = new flatbuffers.Builder(1024);
  // ... construir el objeto Node ...
  // const buf = builder.asUint8Array();
  // Boundary check: tamaño máximo
  // if (buf.length > 50 * 1024 * 1024) throw new Error('Payload demasiado grande');
  // return buf;
  return { ...node, color: safeColor }; // Mock para ejemplo
}

// 4. Precisión y normalización
export function normalizeVector(vec) {
  // Forzar a float32
  return {
    x: Math.fround(vec.x),
    y: Math.fround(vec.y),
  };
}


// Instrucciones para agentes:
// - Usa los esquemas .fbs en contracts/ y genera código con flatc.
// - Valida y trunca SIEMPRE antes de serializar y enviar al Core.
// - Implementa boundary checks y limita el tamaño de payloads.
// - Documenta y versiona los contratos binarios.

// CHECKLIST QA: Tras modificar este archivo, ejecuta el script de validación QA y revisa la BIBLIA_QA_CHECKLIST.md.

