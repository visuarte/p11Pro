import type * as grpc from '@grpc/grpc-js';
import type { EnumTypeDefinition, MessageTypeDefinition } from '@grpc/proto-loader';

import type { RenderServiceClient as _kolicode_render_v1_RenderServiceClient, RenderServiceDefinition as _kolicode_render_v1_RenderServiceDefinition } from './kolicode/render/v1/RenderService';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new(...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  kolicode: {
    common: {
      v1: {
        Empty: MessageTypeDefinition
        HealthCheckRequest: MessageTypeDefinition
        HealthCheckResponse: MessageTypeDefinition
        HealthStatus: EnumTypeDefinition
        RequestMetadata: MessageTypeDefinition
      }
    }
    render: {
      v1: {
        RenderOptions: MessageTypeDefinition
        RenderRequest: MessageTypeDefinition
        RenderResponse: MessageTypeDefinition
        RenderService: SubtypeConstructor<typeof grpc.Client, _kolicode_render_v1_RenderServiceClient> & { service: _kolicode_render_v1_RenderServiceDefinition }
      }
    }
  }
}

