// Original file: ../../shared/proto/diagnostic.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type { DiagnosticCapture as _kolicode_diagnostic_v1_DiagnosticCapture, DiagnosticCapture__Output as _kolicode_diagnostic_v1_DiagnosticCapture__Output } from '../../../kolicode/diagnostic/v1/DiagnosticCapture';
import type { DiagnosticCaptureAck as _kolicode_diagnostic_v1_DiagnosticCaptureAck, DiagnosticCaptureAck__Output as _kolicode_diagnostic_v1_DiagnosticCaptureAck__Output } from '../../../kolicode/diagnostic/v1/DiagnosticCaptureAck';

export interface DiagnosticServiceClient extends grpc.Client {
  CaptureDiagnostic(argument: _kolicode_diagnostic_v1_DiagnosticCapture, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_kolicode_diagnostic_v1_DiagnosticCaptureAck__Output>): grpc.ClientUnaryCall;
  CaptureDiagnostic(argument: _kolicode_diagnostic_v1_DiagnosticCapture, metadata: grpc.Metadata, callback: grpc.requestCallback<_kolicode_diagnostic_v1_DiagnosticCaptureAck__Output>): grpc.ClientUnaryCall;
  CaptureDiagnostic(argument: _kolicode_diagnostic_v1_DiagnosticCapture, options: grpc.CallOptions, callback: grpc.requestCallback<_kolicode_diagnostic_v1_DiagnosticCaptureAck__Output>): grpc.ClientUnaryCall;
  CaptureDiagnostic(argument: _kolicode_diagnostic_v1_DiagnosticCapture, callback: grpc.requestCallback<_kolicode_diagnostic_v1_DiagnosticCaptureAck__Output>): grpc.ClientUnaryCall;
  captureDiagnostic(argument: _kolicode_diagnostic_v1_DiagnosticCapture, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_kolicode_diagnostic_v1_DiagnosticCaptureAck__Output>): grpc.ClientUnaryCall;
  captureDiagnostic(argument: _kolicode_diagnostic_v1_DiagnosticCapture, metadata: grpc.Metadata, callback: grpc.requestCallback<_kolicode_diagnostic_v1_DiagnosticCaptureAck__Output>): grpc.ClientUnaryCall;
  captureDiagnostic(argument: _kolicode_diagnostic_v1_DiagnosticCapture, options: grpc.CallOptions, callback: grpc.requestCallback<_kolicode_diagnostic_v1_DiagnosticCaptureAck__Output>): grpc.ClientUnaryCall;
  captureDiagnostic(argument: _kolicode_diagnostic_v1_DiagnosticCapture, callback: grpc.requestCallback<_kolicode_diagnostic_v1_DiagnosticCaptureAck__Output>): grpc.ClientUnaryCall;
  
}

export interface DiagnosticServiceHandlers extends grpc.UntypedServiceImplementation {
  CaptureDiagnostic: grpc.handleUnaryCall<_kolicode_diagnostic_v1_DiagnosticCapture__Output, _kolicode_diagnostic_v1_DiagnosticCaptureAck>;
  
}

export interface DiagnosticServiceDefinition extends grpc.ServiceDefinition {
  CaptureDiagnostic: MethodDefinition<_kolicode_diagnostic_v1_DiagnosticCapture, _kolicode_diagnostic_v1_DiagnosticCaptureAck, _kolicode_diagnostic_v1_DiagnosticCapture__Output, _kolicode_diagnostic_v1_DiagnosticCaptureAck__Output>
}
