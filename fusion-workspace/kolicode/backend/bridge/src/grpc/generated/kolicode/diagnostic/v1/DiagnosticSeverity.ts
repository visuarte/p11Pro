// Original file: ../../shared/proto/diagnostic.proto

export const DiagnosticSeverity = {
  DIAGNOSTIC_SEVERITY_UNSPECIFIED: 'DIAGNOSTIC_SEVERITY_UNSPECIFIED',
  DIAGNOSTIC_SEVERITY_INFO: 'DIAGNOSTIC_SEVERITY_INFO',
  DIAGNOSTIC_SEVERITY_WARN: 'DIAGNOSTIC_SEVERITY_WARN',
  DIAGNOSTIC_SEVERITY_ERROR: 'DIAGNOSTIC_SEVERITY_ERROR',
} as const;

export type DiagnosticSeverity =
  | 'DIAGNOSTIC_SEVERITY_UNSPECIFIED'
  | 0
  | 'DIAGNOSTIC_SEVERITY_INFO'
  | 1
  | 'DIAGNOSTIC_SEVERITY_WARN'
  | 2
  | 'DIAGNOSTIC_SEVERITY_ERROR'
  | 3

export type DiagnosticSeverity__Output = typeof DiagnosticSeverity[keyof typeof DiagnosticSeverity]
