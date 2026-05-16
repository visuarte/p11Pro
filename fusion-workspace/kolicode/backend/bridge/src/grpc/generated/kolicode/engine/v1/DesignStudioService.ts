// Original file: ../../shared/proto/engine.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type { EngineRequest as _kolicode_engine_v1_EngineRequest, EngineRequest__Output as _kolicode_engine_v1_EngineRequest__Output } from '../../../kolicode/engine/v1/EngineRequest';
import type { EngineResponse as _kolicode_engine_v1_EngineResponse, EngineResponse__Output as _kolicode_engine_v1_EngineResponse__Output } from '../../../kolicode/engine/v1/EngineResponse';
import type { HealthCheckRequest as _kolicode_common_v1_HealthCheckRequest, HealthCheckRequest__Output as _kolicode_common_v1_HealthCheckRequest__Output } from '../../../kolicode/common/v1/HealthCheckRequest';
import type { HealthCheckResponse as _kolicode_common_v1_HealthCheckResponse, HealthCheckResponse__Output as _kolicode_common_v1_HealthCheckResponse__Output } from '../../../kolicode/common/v1/HealthCheckResponse';
import type { RenderRequest as _kolicode_render_v1_RenderRequest, RenderRequest__Output as _kolicode_render_v1_RenderRequest__Output } from '../../../kolicode/render/v1/RenderRequest';
import type { RenderResponse as _kolicode_render_v1_RenderResponse, RenderResponse__Output as _kolicode_render_v1_RenderResponse__Output } from '../../../kolicode/render/v1/RenderResponse';

export interface DesignStudioServiceClient extends grpc.Client {
  CheckHealth(argument: _kolicode_common_v1_HealthCheckRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_kolicode_common_v1_HealthCheckResponse__Output>): grpc.ClientUnaryCall;
  CheckHealth(argument: _kolicode_common_v1_HealthCheckRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_kolicode_common_v1_HealthCheckResponse__Output>): grpc.ClientUnaryCall;
  CheckHealth(argument: _kolicode_common_v1_HealthCheckRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_kolicode_common_v1_HealthCheckResponse__Output>): grpc.ClientUnaryCall;
  CheckHealth(argument: _kolicode_common_v1_HealthCheckRequest, callback: grpc.requestCallback<_kolicode_common_v1_HealthCheckResponse__Output>): grpc.ClientUnaryCall;
  checkHealth(argument: _kolicode_common_v1_HealthCheckRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_kolicode_common_v1_HealthCheckResponse__Output>): grpc.ClientUnaryCall;
  checkHealth(argument: _kolicode_common_v1_HealthCheckRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_kolicode_common_v1_HealthCheckResponse__Output>): grpc.ClientUnaryCall;
  checkHealth(argument: _kolicode_common_v1_HealthCheckRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_kolicode_common_v1_HealthCheckResponse__Output>): grpc.ClientUnaryCall;
  checkHealth(argument: _kolicode_common_v1_HealthCheckRequest, callback: grpc.requestCallback<_kolicode_common_v1_HealthCheckResponse__Output>): grpc.ClientUnaryCall;
  
  ExecuteOperation(argument: _kolicode_engine_v1_EngineRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_kolicode_engine_v1_EngineResponse__Output>): grpc.ClientUnaryCall;
  ExecuteOperation(argument: _kolicode_engine_v1_EngineRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_kolicode_engine_v1_EngineResponse__Output>): grpc.ClientUnaryCall;
  ExecuteOperation(argument: _kolicode_engine_v1_EngineRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_kolicode_engine_v1_EngineResponse__Output>): grpc.ClientUnaryCall;
  ExecuteOperation(argument: _kolicode_engine_v1_EngineRequest, callback: grpc.requestCallback<_kolicode_engine_v1_EngineResponse__Output>): grpc.ClientUnaryCall;
  executeOperation(argument: _kolicode_engine_v1_EngineRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_kolicode_engine_v1_EngineResponse__Output>): grpc.ClientUnaryCall;
  executeOperation(argument: _kolicode_engine_v1_EngineRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_kolicode_engine_v1_EngineResponse__Output>): grpc.ClientUnaryCall;
  executeOperation(argument: _kolicode_engine_v1_EngineRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_kolicode_engine_v1_EngineResponse__Output>): grpc.ClientUnaryCall;
  executeOperation(argument: _kolicode_engine_v1_EngineRequest, callback: grpc.requestCallback<_kolicode_engine_v1_EngineResponse__Output>): grpc.ClientUnaryCall;
  
  RenderAsset(argument: _kolicode_render_v1_RenderRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_kolicode_render_v1_RenderResponse__Output>): grpc.ClientUnaryCall;
  RenderAsset(argument: _kolicode_render_v1_RenderRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_kolicode_render_v1_RenderResponse__Output>): grpc.ClientUnaryCall;
  RenderAsset(argument: _kolicode_render_v1_RenderRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_kolicode_render_v1_RenderResponse__Output>): grpc.ClientUnaryCall;
  RenderAsset(argument: _kolicode_render_v1_RenderRequest, callback: grpc.requestCallback<_kolicode_render_v1_RenderResponse__Output>): grpc.ClientUnaryCall;
  renderAsset(argument: _kolicode_render_v1_RenderRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_kolicode_render_v1_RenderResponse__Output>): grpc.ClientUnaryCall;
  renderAsset(argument: _kolicode_render_v1_RenderRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_kolicode_render_v1_RenderResponse__Output>): grpc.ClientUnaryCall;
  renderAsset(argument: _kolicode_render_v1_RenderRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_kolicode_render_v1_RenderResponse__Output>): grpc.ClientUnaryCall;
  renderAsset(argument: _kolicode_render_v1_RenderRequest, callback: grpc.requestCallback<_kolicode_render_v1_RenderResponse__Output>): grpc.ClientUnaryCall;
  
}

export interface DesignStudioServiceHandlers extends grpc.UntypedServiceImplementation {
  CheckHealth: grpc.handleUnaryCall<_kolicode_common_v1_HealthCheckRequest__Output, _kolicode_common_v1_HealthCheckResponse>;
  
  ExecuteOperation: grpc.handleUnaryCall<_kolicode_engine_v1_EngineRequest__Output, _kolicode_engine_v1_EngineResponse>;
  
  RenderAsset: grpc.handleUnaryCall<_kolicode_render_v1_RenderRequest__Output, _kolicode_render_v1_RenderResponse>;
  
}

export interface DesignStudioServiceDefinition extends grpc.ServiceDefinition {
  CheckHealth: MethodDefinition<_kolicode_common_v1_HealthCheckRequest, _kolicode_common_v1_HealthCheckResponse, _kolicode_common_v1_HealthCheckRequest__Output, _kolicode_common_v1_HealthCheckResponse__Output>
  ExecuteOperation: MethodDefinition<_kolicode_engine_v1_EngineRequest, _kolicode_engine_v1_EngineResponse, _kolicode_engine_v1_EngineRequest__Output, _kolicode_engine_v1_EngineResponse__Output>
  RenderAsset: MethodDefinition<_kolicode_render_v1_RenderRequest, _kolicode_render_v1_RenderResponse, _kolicode_render_v1_RenderRequest__Output, _kolicode_render_v1_RenderResponse__Output>
}
