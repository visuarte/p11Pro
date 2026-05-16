// Original file: ../../shared/proto/diagnostic.proto

export const DiagnosticLayer = {
  DIAGNOSTIC_LAYER_UNSPECIFIED: 'DIAGNOSTIC_LAYER_UNSPECIFIED',
  DIAGNOSTIC_LAYER_FRONTEND: 'DIAGNOSTIC_LAYER_FRONTEND',
  DIAGNOSTIC_LAYER_BRIDGE: 'DIAGNOSTIC_LAYER_BRIDGE',
  DIAGNOSTIC_LAYER_ENGINE: 'DIAGNOSTIC_LAYER_ENGINE',
} as const;

export type DiagnosticLayer =
  | 'DIAGNOSTIC_LAYER_UNSPECIFIED'
  | 0
  | 'DIAGNOSTIC_LAYER_FRONTEND'
  | 1
  | 'DIAGNOSTIC_LAYER_BRIDGE'
  | 2
  | 'DIAGNOSTIC_LAYER_ENGINE'
  | 3

export type DiagnosticLayer__Output = typeof DiagnosticLayer[keyof typeof DiagnosticLayer]
