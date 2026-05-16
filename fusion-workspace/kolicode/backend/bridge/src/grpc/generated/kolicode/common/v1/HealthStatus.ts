// Original file: ../../shared/proto/common.proto

export const HealthStatus = {
  HEALTH_STATUS_UNSPECIFIED: 'HEALTH_STATUS_UNSPECIFIED',
  HEALTH_STATUS_HEALTHY: 'HEALTH_STATUS_HEALTHY',
  HEALTH_STATUS_DEGRADED: 'HEALTH_STATUS_DEGRADED',
  HEALTH_STATUS_UNHEALTHY: 'HEALTH_STATUS_UNHEALTHY',
} as const;

export type HealthStatus =
  | 'HEALTH_STATUS_UNSPECIFIED'
  | 0
  | 'HEALTH_STATUS_HEALTHY'
  | 1
  | 'HEALTH_STATUS_DEGRADED'
  | 2
  | 'HEALTH_STATUS_UNHEALTHY'
  | 3

export type HealthStatus__Output = typeof HealthStatus[keyof typeof HealthStatus]
