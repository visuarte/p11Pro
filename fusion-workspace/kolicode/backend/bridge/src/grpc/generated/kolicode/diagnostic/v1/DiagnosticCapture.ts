// Original file: ../../shared/proto/diagnostic.proto

import type { RequestMetadata as _kolicode_common_v1_RequestMetadata, RequestMetadata__Output as _kolicode_common_v1_RequestMetadata__Output } from '../../../kolicode/common/v1/RequestMetadata';
import type { DiagnosticLayer as _kolicode_diagnostic_v1_DiagnosticLayer, DiagnosticLayer__Output as _kolicode_diagnostic_v1_DiagnosticLayer__Output } from '../../../kolicode/diagnostic/v1/DiagnosticLayer';
import type { DiagnosticSeverity as _kolicode_diagnostic_v1_DiagnosticSeverity, DiagnosticSeverity__Output as _kolicode_diagnostic_v1_DiagnosticSeverity__Output } from '../../../kolicode/diagnostic/v1/DiagnosticSeverity';
import type { Long } from '@grpc/proto-loader';

export interface DiagnosticCapture {
  'metadata'?: (_kolicode_common_v1_RequestMetadata | null);
  'layer'?: (_kolicode_diagnostic_v1_DiagnosticLayer);
  'timestampMs'?: (number | string | Long);
  'labels'?: ({[key: string]: string});
  'payload'?: (Buffer | Uint8Array | string);
  'source'?: (string);
  'type'?: (string);
  'severity'?: (_kolicode_diagnostic_v1_DiagnosticSeverity);
  'message'?: (string);
}

export interface DiagnosticCapture__Output {
  'metadata': (_kolicode_common_v1_RequestMetadata__Output | null);
  'layer': (_kolicode_diagnostic_v1_DiagnosticLayer__Output);
  'timestampMs': (string);
  'labels': ({[key: string]: string});
  'payload': (Buffer);
  'source': (string);
  'type': (string);
  'severity': (_kolicode_diagnostic_v1_DiagnosticSeverity__Output);
  'message': (string);
}
