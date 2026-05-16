// Original file: ../../shared/proto/bridge.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type { GetBridgeStateRequest as _kolicode_bridge_v1_GetBridgeStateRequest, GetBridgeStateRequest__Output as _kolicode_bridge_v1_GetBridgeStateRequest__Output } from '../../../kolicode/bridge/v1/GetBridgeStateRequest';
import type { GetBridgeStateResponse as _kolicode_bridge_v1_GetBridgeStateResponse, GetBridgeStateResponse__Output as _kolicode_bridge_v1_GetBridgeStateResponse__Output } from '../../../kolicode/bridge/v1/GetBridgeStateResponse';
import type { HealthCheckRequest as _kolicode_common_v1_HealthCheckRequest, HealthCheckRequest__Output as _kolicode_common_v1_HealthCheckRequest__Output } from '../../../kolicode/common/v1/HealthCheckRequest';
import type { HealthCheckResponse as _kolicode_common_v1_HealthCheckResponse, HealthCheckResponse__Output as _kolicode_common_v1_HealthCheckResponse__Output } from '../../../kolicode/common/v1/HealthCheckResponse';

export interface BridgeControlServiceClient extends grpc.Client {
  CheckHealth(argument: _kolicode_common_v1_HealthCheckRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_kolicode_common_v1_HealthCheckResponse__Output>): grpc.ClientUnaryCall;
  CheckHealth(argument: _kolicode_common_v1_HealthCheckRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_kolicode_common_v1_HealthCheckResponse__Output>): grpc.ClientUnaryCall;
  CheckHealth(argument: _kolicode_common_v1_HealthCheckRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_kolicode_common_v1_HealthCheckResponse__Output>): grpc.ClientUnaryCall;
  CheckHealth(argument: _kolicode_common_v1_HealthCheckRequest, callback: grpc.requestCallback<_kolicode_common_v1_HealthCheckResponse__Output>): grpc.ClientUnaryCall;
  checkHealth(argument: _kolicode_common_v1_HealthCheckRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_kolicode_common_v1_HealthCheckResponse__Output>): grpc.ClientUnaryCall;
  checkHealth(argument: _kolicode_common_v1_HealthCheckRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_kolicode_common_v1_HealthCheckResponse__Output>): grpc.ClientUnaryCall;
  checkHealth(argument: _kolicode_common_v1_HealthCheckRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_kolicode_common_v1_HealthCheckResponse__Output>): grpc.ClientUnaryCall;
  checkHealth(argument: _kolicode_common_v1_HealthCheckRequest, callback: grpc.requestCallback<_kolicode_common_v1_HealthCheckResponse__Output>): grpc.ClientUnaryCall;
  
  GetBridgeState(argument: _kolicode_bridge_v1_GetBridgeStateRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_kolicode_bridge_v1_GetBridgeStateResponse__Output>): grpc.ClientUnaryCall;
  GetBridgeState(argument: _kolicode_bridge_v1_GetBridgeStateRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_kolicode_bridge_v1_GetBridgeStateResponse__Output>): grpc.ClientUnaryCall;
  GetBridgeState(argument: _kolicode_bridge_v1_GetBridgeStateRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_kolicode_bridge_v1_GetBridgeStateResponse__Output>): grpc.ClientUnaryCall;
  GetBridgeState(argument: _kolicode_bridge_v1_GetBridgeStateRequest, callback: grpc.requestCallback<_kolicode_bridge_v1_GetBridgeStateResponse__Output>): grpc.ClientUnaryCall;
  getBridgeState(argument: _kolicode_bridge_v1_GetBridgeStateRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_kolicode_bridge_v1_GetBridgeStateResponse__Output>): grpc.ClientUnaryCall;
  getBridgeState(argument: _kolicode_bridge_v1_GetBridgeStateRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_kolicode_bridge_v1_GetBridgeStateResponse__Output>): grpc.ClientUnaryCall;
  getBridgeState(argument: _kolicode_bridge_v1_GetBridgeStateRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_kolicode_bridge_v1_GetBridgeStateResponse__Output>): grpc.ClientUnaryCall;
  getBridgeState(argument: _kolicode_bridge_v1_GetBridgeStateRequest, callback: grpc.requestCallback<_kolicode_bridge_v1_GetBridgeStateResponse__Output>): grpc.ClientUnaryCall;
  
}

export interface BridgeControlServiceHandlers extends grpc.UntypedServiceImplementation {
  CheckHealth: grpc.handleUnaryCall<_kolicode_common_v1_HealthCheckRequest__Output, _kolicode_common_v1_HealthCheckResponse>;
  
  GetBridgeState: grpc.handleUnaryCall<_kolicode_bridge_v1_GetBridgeStateRequest__Output, _kolicode_bridge_v1_GetBridgeStateResponse>;
  
}

export interface BridgeControlServiceDefinition extends grpc.ServiceDefinition {
  CheckHealth: MethodDefinition<_kolicode_common_v1_HealthCheckRequest, _kolicode_common_v1_HealthCheckResponse, _kolicode_common_v1_HealthCheckRequest__Output, _kolicode_common_v1_HealthCheckResponse__Output>
  GetBridgeState: MethodDefinition<_kolicode_bridge_v1_GetBridgeStateRequest, _kolicode_bridge_v1_GetBridgeStateResponse, _kolicode_bridge_v1_GetBridgeStateRequest__Output, _kolicode_bridge_v1_GetBridgeStateResponse__Output>
}
