// Original file: ../../shared/proto/diagnostic.proto

import type { Long } from '@grpc/proto-loader';

export interface DiagnosticCaptureAck {
  'accepted'?: (boolean);
  'diagnosticId'?: (string);
  'recordedAtMs'?: (number | string | Long);
}

export interface DiagnosticCaptureAck__Output {
  'accepted': (boolean);
  'diagnosticId': (string);
  'recordedAtMs': (string);
}
