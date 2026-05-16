import type * as grpc from '@grpc/grpc-js';
import type { EnumTypeDefinition, MessageTypeDefinition } from '@grpc/proto-loader';

import type { BridgeControlServiceClient as _kolicode_bridge_v1_BridgeControlServiceClient, BridgeControlServiceDefinition as _kolicode_bridge_v1_BridgeControlServiceDefinition } from './kolicode/bridge/v1/BridgeControlService';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new(...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  kolicode: {
    bridge: {
      v1: {
        BridgeControlService: SubtypeConstructor<typeof grpc.Client, _kolicode_bridge_v1_BridgeControlServiceClient> & { service: _kolicode_bridge_v1_BridgeControlServiceDefinition }
        BridgeLifecycleState: EnumTypeDefinition
        GetBridgeStateRequest: MessageTypeDefinition
        GetBridgeStateResponse: MessageTypeDefinition
      }
    }
    common: {
      v1: {
        Empty: MessageTypeDefinition
        HealthCheckRequest: MessageTypeDefinition
        HealthCheckResponse: MessageTypeDefinition
        HealthStatus: EnumTypeDefinition
        RequestMetadata: MessageTypeDefinition
      }
    }
  }
}

