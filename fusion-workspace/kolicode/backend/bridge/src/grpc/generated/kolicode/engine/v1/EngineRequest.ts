// Original file: ../../shared/proto/engine.proto

import type { RequestMetadata as _kolicode_common_v1_RequestMetadata, RequestMetadata__Output as _kolicode_common_v1_RequestMetadata__Output } from '../../../kolicode/common/v1/RequestMetadata';

export interface EngineRequest {
  'metadata'?: (_kolicode_common_v1_RequestMetadata | null);
  'operation'?: (string);
  'payload'?: (Buffer | Uint8Array | string);
  'options'?: ({[key: string]: string});
}

export interface EngineRequest__Output {
  'metadata': (_kolicode_common_v1_RequestMetadata__Output | null);
  'operation': (string);
  'payload': (Buffer);
  'options': ({[key: string]: string});
}
