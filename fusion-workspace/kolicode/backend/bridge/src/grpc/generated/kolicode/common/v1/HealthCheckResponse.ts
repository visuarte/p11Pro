// Original file: ../../shared/proto/common.proto

import type { HealthStatus as _kolicode_common_v1_HealthStatus, HealthStatus__Output as _kolicode_common_v1_HealthStatus__Output } from '../../../kolicode/common/v1/HealthStatus';
import type { Long } from '@grpc/proto-loader';

export interface HealthCheckResponse {
  'status'?: (_kolicode_common_v1_HealthStatus);
  'service'?: (string);
  'message'?: (string);
  'timestampMs'?: (number | string | Long);
  'details'?: ({[key: string]: string});
}

export interface HealthCheckResponse__Output {
  'status': (_kolicode_common_v1_HealthStatus__Output);
  'service': (string);
  'message': (string);
  'timestampMs': (string);
  'details': ({[key: string]: string});
}
