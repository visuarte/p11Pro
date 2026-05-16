import path from 'path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import type { Options } from '@grpc/proto-loader';

const PROTO_ROOT = path.resolve(__dirname, '../../../../shared/proto');

const PROTO_LOADER_OPTIONS: Options = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};

export function resolveProtoPath(fileName: string): string {
  return path.join(PROTO_ROOT, fileName);
}

function loadGrpcObject(fileName: string): grpc.GrpcObject {
  const definition = protoLoader.loadSync(resolveProtoPath(fileName), {
    includeDirs: [PROTO_ROOT],
    ...PROTO_LOADER_OPTIONS,
  });

  return grpc.loadPackageDefinition(definition);
}

export function loadBridgeGrpcObject(): grpc.GrpcObject {
  return loadGrpcObject('bridge.proto');
}

export function loadEngineGrpcObject(): grpc.GrpcObject {
  return loadGrpcObject('engine.proto');
}

export function getProtoRoot(): string {
  return PROTO_ROOT;
}
