import { z } from 'zod';

// Definición matemática de un Nodo Vectorial
export const NodoVectorialSchema = z.object({
  id: z.string().uuid(),
  tipo: z.enum(['rect', 'ellipse', 'path', 'group']),
  x: z.number().finite(),
  y: z.number().finite(),
  ancho: z.number().positive(),
  alto: z.number().positive(),
  color: z.object({
    r: z.number().int().min(0).max(255),
    g: z.number().int().min(0).max(255),
    b: z.number().int().min(0).max(255),
    a: z.number().min(0).max(1).optional(),
  }),
  children: z.array(z.string().uuid()).optional(),
  locked: z.boolean().optional(),
  // meta: mapping of arbitrary keys to any value -> use string keys and any values
  meta: z.record(z.string(), z.any()).optional(),
});

// Definición matemática de un Ajuste de Color
export const AjusteColorSchema = z.object({
  brillo: z.number().min(-1).max(1),
  contraste: z.number().min(-1).max(1),
  saturacion: z.number().min(-1).max(1),
  gamma: z.number().min(0.1).max(10),
  temperatura: z.number().min(1000).max(12000),
  perfilICC: z.string().optional(),
});

export type NodoVectorial = z.infer<typeof NodoVectorialSchema>;
export type AjusteColor = z.infer<typeof AjusteColorSchema>;
