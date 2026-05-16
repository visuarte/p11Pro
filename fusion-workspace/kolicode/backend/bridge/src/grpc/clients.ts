import * as grpc from '@grpc/grpc-js';
import type { ChannelCredentials, Client } from '@grpc/grpc-js';
import { logger } from '../utils/logger';
import { loadEngineGrpcObject } from './proto-loader';

type ServiceClientConstructor = new (
  address: string,
  credentials: ChannelCredentials,
  options?: Record<string, unknown>
) => Client;

function getNestedValue<T>(source: unknown, pathSegments: string[]): T {
  let current: unknown = source;

  for (const segment of pathSegments) {
    if (!current || typeof current !== 'object' || !(segment in current)) {
      throw new Error(`Missing gRPC package segment: ${pathSegments.join('.')}`);
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return current as T;
}

function resolveGrpcTarget(
  envName: string,
  fallbackTarget: string
): string {
  const rawTarget = process.env[envName]?.trim();

  if (!rawTarget) {
    return fallbackTarget;
  }

  return rawTarget.replace(/^grpc:\/\//, '').replace(/^https?:\/\//, '');
}

function createClient(
  ClientConstructor: ServiceClientConstructor,
  target: string
): Client {
  return new ClientConstructor(target, grpc.credentials.createInsecure());
}

export interface EngineGrpcClients {
  thunderkoli: Client;
  universalengine: Client;
  designStudio: Client;
}

export function createEngineGrpcClients(): EngineGrpcClients {
  const grpcObject = loadEngineGrpcObject();
  const versionedPackage = getNestedValue<Record<string, unknown>>(grpcObject, [
    'kolicode',
    'engine',
    'v1',
  ]);

  const ThunderKoliClient = getNestedValue<ServiceClientConstructor>(
    versionedPackage,
    ['ThunderKoliService']
  );
  const UniversalEngineClient = getNestedValue<ServiceClientConstructor>(
    versionedPackage,
    ['UniversalEngineService']
  );
  const DesignStudioClient = getNestedValue<ServiceClientConstructor>(
    versionedPackage,
    ['DesignStudioService']
  );

  const clients = {
    thunderkoli: createClient(
      ThunderKoliClient,
      resolveGrpcTarget('THUNDERKOLI_GRPC_TARGET', '127.0.0.1:50061')
    ),
    universalengine: createClient(
      UniversalEngineClient,
      resolveGrpcTarget('UNIVERSALENGINE_GRPC_TARGET', '127.0.0.1:50062')
    ),
    designStudio: createClient(
      DesignStudioClient,
      resolveGrpcTarget('DESIGN_STUDIO_GRPC_TARGET', '127.0.0.1:50063')
    ),
  };

  logger.info({
    message: 'gRPC engine clients initialized',
    thunderkoliTarget: resolveGrpcTarget(
      'THUNDERKOLI_GRPC_TARGET',
      '127.0.0.1:50061'
    ),
    universalengineTarget: resolveGrpcTarget(
      'UNIVERSALENGINE_GRPC_TARGET',
      '127.0.0.1:50062'
    ),
    designStudioTarget: resolveGrpcTarget(
      'DESIGN_STUDIO_GRPC_TARGET',
      '127.0.0.1:50063'
    ),
  });

  return clients;
}

export async function closeGrpcClients(clients: EngineGrpcClients): Promise<void> {
  await Promise.all(
    Object.values(clients).map(
      (client) =>
        new Promise<void>((resolve) => {
          client.close();
          resolve();
        })
    )
  );
}
