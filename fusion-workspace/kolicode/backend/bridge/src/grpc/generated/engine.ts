import type * as grpc from '@grpc/grpc-js';
import type { EnumTypeDefinition, MessageTypeDefinition } from '@grpc/proto-loader';

import type { DesignStudioServiceClient as _kolicode_engine_v1_DesignStudioServiceClient, DesignStudioServiceDefinition as _kolicode_engine_v1_DesignStudioServiceDefinition } from './kolicode/engine/v1/DesignStudioService';
import type { ThunderKoliServiceClient as _kolicode_engine_v1_ThunderKoliServiceClient, ThunderKoliServiceDefinition as _kolicode_engine_v1_ThunderKoliServiceDefinition } from './kolicode/engine/v1/ThunderKoliService';
import type { UniversalEngineServiceClient as _kolicode_engine_v1_UniversalEngineServiceClient, UniversalEngineServiceDefinition as _kolicode_engine_v1_UniversalEngineServiceDefinition } from './kolicode/engine/v1/UniversalEngineService';
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
    engine: {
      v1: {
        DesignStudioService: SubtypeConstructor<typeof grpc.Client, _kolicode_engine_v1_DesignStudioServiceClient> & { service: _kolicode_engine_v1_DesignStudioServiceDefinition }
        EngineRequest: MessageTypeDefinition
        EngineResponse: MessageTypeDefinition
        ThunderKoliService: SubtypeConstructor<typeof grpc.Client, _kolicode_engine_v1_ThunderKoliServiceClient> & { service: _kolicode_engine_v1_ThunderKoliServiceDefinition }
        UniversalEngineService: SubtypeConstructor<typeof grpc.Client, _kolicode_engine_v1_UniversalEngineServiceClient> & { service: _kolicode_engine_v1_UniversalEngineServiceDefinition }
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

