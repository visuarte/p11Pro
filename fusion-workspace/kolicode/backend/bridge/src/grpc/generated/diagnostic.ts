import type * as grpc from '@grpc/grpc-js';
import type { EnumTypeDefinition, MessageTypeDefinition } from '@grpc/proto-loader';

import type { DiagnosticServiceClient as _kolicode_diagnostic_v1_DiagnosticServiceClient, DiagnosticServiceDefinition as _kolicode_diagnostic_v1_DiagnosticServiceDefinition } from './kolicode/diagnostic/v1/DiagnosticService';

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
    diagnostic: {
      v1: {
        DiagnosticCapture: MessageTypeDefinition
        DiagnosticCaptureAck: MessageTypeDefinition
        DiagnosticLayer: EnumTypeDefinition
        DiagnosticService: SubtypeConstructor<typeof grpc.Client, _kolicode_diagnostic_v1_DiagnosticServiceClient> & { service: _kolicode_diagnostic_v1_DiagnosticServiceDefinition }
        DiagnosticSeverity: EnumTypeDefinition
      }
    }
  }
}

