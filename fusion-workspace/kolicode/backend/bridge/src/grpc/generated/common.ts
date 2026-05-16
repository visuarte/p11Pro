import type * as grpc from '@grpc/grpc-js';
import type { EnumTypeDefinition, MessageTypeDefinition } from '@grpc/proto-loader';


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
  }
}

