import { NodoVectorialSchema, AjusteColorSchema, NodoVectorial, AjusteColor } from './schema';

// Trunca la precisión de los colores a enteros (0-255) y alpha a 2 decimales
function truncateColor(color: any) {
  return {
    r: Math.max(0, Math.min(255, Math.round(color.r))),
    g: Math.max(0, Math.min(255, Math.round(color.g))),
    b: Math.max(0, Math.min(255, Math.round(color.b))),
    a: color.a !== undefined ? Math.round(color.a * 100) / 100 : undefined,
  };
}

// Middleware: Valida y normaliza datos antes de IPC
export function dataTransformerMiddleware(input: any): NodoVectorial | AjusteColor {
  // Detecta tipo de dato
  if (input && typeof input === 'object' && 'tipo' in input) {
    // Nodo Vectorial
    const parsed = NodoVectorialSchema.safeParse({
      ...input,
      color: truncateColor(input.color),
    });
    if (!parsed.success)
      throw new Error('NodoVectorial inválido: ' + JSON.stringify(parsed.error.issues));
    return parsed.data;
  } else {
    // Ajuste de Color
    const parsed = AjusteColorSchema.safeParse(input);
    if (!parsed.success)
      throw new Error('AjusteColor inválido: ' + JSON.stringify(parsed.error.issues));
    return parsed.data;
  }
}
