// Original file: ../../shared/proto/render.proto

import type { Long } from '@grpc/proto-loader';

export interface RenderResponse {
  'assetId'?: (string);
  'data'?: (Buffer | Uint8Array | string);
  'sizeBytes'?: (number | string | Long);
  'checksum'?: (string);
  'format'?: (string);
  'generatedAtMs'?: (number | string | Long);
}

export interface RenderResponse__Output {
  'assetId': (string);
  'data': (Buffer);
  'sizeBytes': (string);
  'checksum': (string);
  'format': (string);
  'generatedAtMs': (string);
}
