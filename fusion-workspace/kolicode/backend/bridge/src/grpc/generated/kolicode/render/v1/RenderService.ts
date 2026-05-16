// Original file: ../../shared/proto/render.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type { RenderRequest as _kolicode_render_v1_RenderRequest, RenderRequest__Output as _kolicode_render_v1_RenderRequest__Output } from '../../../kolicode/render/v1/RenderRequest';
import type { RenderResponse as _kolicode_render_v1_RenderResponse, RenderResponse__Output as _kolicode_render_v1_RenderResponse__Output } from '../../../kolicode/render/v1/RenderResponse';

export interface RenderServiceClient extends grpc.Client {
  RenderAsset(argument: _kolicode_render_v1_RenderRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_kolicode_render_v1_RenderResponse__Output>): grpc.ClientUnaryCall;
  RenderAsset(argument: _kolicode_render_v1_RenderRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_kolicode_render_v1_RenderResponse__Output>): grpc.ClientUnaryCall;
  RenderAsset(argument: _kolicode_render_v1_RenderRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_kolicode_render_v1_RenderResponse__Output>): grpc.ClientUnaryCall;
  RenderAsset(argument: _kolicode_render_v1_RenderRequest, callback: grpc.requestCallback<_kolicode_render_v1_RenderResponse__Output>): grpc.ClientUnaryCall;
  renderAsset(argument: _kolicode_render_v1_RenderRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_kolicode_render_v1_RenderResponse__Output>): grpc.ClientUnaryCall;
  renderAsset(argument: _kolicode_render_v1_RenderRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_kolicode_render_v1_RenderResponse__Output>): grpc.ClientUnaryCall;
  renderAsset(argument: _kolicode_render_v1_RenderRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_kolicode_render_v1_RenderResponse__Output>): grpc.ClientUnaryCall;
  renderAsset(argument: _kolicode_render_v1_RenderRequest, callback: grpc.requestCallback<_kolicode_render_v1_RenderResponse__Output>): grpc.ClientUnaryCall;
  
}

export interface RenderServiceHandlers extends grpc.UntypedServiceImplementation {
  RenderAsset: grpc.handleUnaryCall<_kolicode_render_v1_RenderRequest__Output, _kolicode_render_v1_RenderResponse>;
  
}

export interface RenderServiceDefinition extends grpc.ServiceDefinition {
  RenderAsset: MethodDefinition<_kolicode_render_v1_RenderRequest, _kolicode_render_v1_RenderResponse, _kolicode_render_v1_RenderRequest__Output, _kolicode_render_v1_RenderResponse__Output>
}
