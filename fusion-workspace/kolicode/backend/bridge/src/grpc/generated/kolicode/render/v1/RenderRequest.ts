// Original file: ../../shared/proto/render.proto

import type { RequestMetadata as _kolicode_common_v1_RequestMetadata, RequestMetadata__Output as _kolicode_common_v1_RequestMetadata__Output } from '../../../kolicode/common/v1/RequestMetadata';
import type { RenderOptions as _kolicode_render_v1_RenderOptions, RenderOptions__Output as _kolicode_render_v1_RenderOptions__Output } from '../../../kolicode/render/v1/RenderOptions';

export interface RenderRequest {
  'metadata'?: (_kolicode_common_v1_RequestMetadata | null);
  'projectId'?: (string);
  'canvasData'?: (Buffer | Uint8Array | string);
  'options'?: (_kolicode_render_v1_RenderOptions | null);
}

export interface RenderRequest__Output {
  'metadata': (_kolicode_common_v1_RequestMetadata__Output | null);
  'projectId': (string);
  'canvasData': (Buffer);
  'options': (_kolicode_render_v1_RenderOptions__Output | null);
}
