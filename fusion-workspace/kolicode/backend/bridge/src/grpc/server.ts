import * as grpc from '@grpc/grpc-js';
import type { ServerUnaryCall, sendUnaryData } from '@grpc/grpc-js';
import type { BridgeStateInfo, BridgeStateType } from '../state/BridgeState';
import { type BridgeState } from '../state/BridgeState';
import { logger } from '../utils/logger';
import { loadBridgeGrpcObject } from './proto-loader';

type UntypedServiceDefinition = grpc.UntypedServiceImplementation &
  grpc.ServiceDefinition;

interface HealthCheckRequestMessage {
  service?: string;
}

interface HealthCheckResponseMessage {
  status: string;
  service: string;
  message: string;
  timestamp_ms: string;
  details: Record<string, string>;
}

interface GetBridgeStateRequestMessage {
  metadata?: Record<string, unknown>;
}

interface GetBridgeStateResponseMessage {
  current_state: string;
  previous_state: string;
  transition_time_ms: string;
  error_message: string;
  metadata: Record<string, string>;
}

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

function stringifyMetadata(
  metadata?: Record<string, unknown>
): Record<string, string> {
  if (!metadata) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [key, String(value)])
  );
}

function mapBridgeState(state?: BridgeStateType): string {
  switch (state) {
    case 'IDLE':
      return 'BRIDGE_LIFECYCLE_STATE_IDLE';
    case 'AUTHENTICATING':
      return 'BRIDGE_LIFECYCLE_STATE_AUTHENTICATING';
    case 'PROCESSING_VECTOR':
      return 'BRIDGE_LIFECYCLE_STATE_PROCESSING_VECTOR';
    case 'COMPUTING_COLOR':
      return 'BRIDGE_LIFECYCLE_STATE_COMPUTING_COLOR';
    case 'AUDITING':
      return 'BRIDGE_LIFECYCLE_STATE_AUDITING';
    case 'COMPLETED':
      return 'BRIDGE_LIFECYCLE_STATE_COMPLETED';
    case 'ERROR':
      return 'BRIDGE_LIFECYCLE_STATE_ERROR';
    default:
      return 'BRIDGE_LIFECYCLE_STATE_UNSPECIFIED';
  }
}

function mapHealthStatus(state: BridgeStateInfo): string {
  if (state.current === 'ERROR') {
    return 'HEALTH_STATUS_UNHEALTHY';
  }

  if (state.current === 'COMPLETED' || state.current === 'IDLE') {
    return 'HEALTH_STATUS_HEALTHY';
  }

  return 'HEALTH_STATUS_DEGRADED';
}

function buildHealthResponse(
  request: HealthCheckRequestMessage | undefined,
  bridgeState: BridgeState
): HealthCheckResponseMessage {
  const state = bridgeState.getCurrentState();

  return {
    status: mapHealthStatus(state),
    service: request?.service || 'bridge',
    message: state.errorMessage || `Bridge state: ${state.current}`,
    timestamp_ms: String(Date.now()),
    details: {
      current_state: state.current,
      previous_state: state.previousState || 'UNKNOWN',
    },
  };
}

function buildBridgeStateResponse(
  state: BridgeStateInfo
): GetBridgeStateResponseMessage {
  return {
    current_state: mapBridgeState(state.current),
    previous_state: mapBridgeState(state.previousState),
    transition_time_ms: String(state.transitionTime.getTime()),
    error_message: state.errorMessage || '',
    metadata: stringifyMetadata(state.metadata),
  };
}

export interface BridgeGrpcServerHandle {
  server: grpc.Server;
  port: number;
  forceShutdown: () => void;
  tryShutdown: () => Promise<void>;
}

export async function createBridgeGrpcServer(
  bridgeState: BridgeState
): Promise<BridgeGrpcServerHandle> {
  const grpcObject = loadBridgeGrpcObject();
  const versionedPackage = getNestedValue<Record<string, unknown>>(grpcObject, [
    'kolicode',
    'bridge',
    'v1',
  ]);
  const BridgeControlService = getNestedValue<{
    service: UntypedServiceDefinition;
  }>(versionedPackage, ['BridgeControlService']);
  const serviceDefinition = BridgeControlService.service;

  const server = new grpc.Server();

  server.addService(serviceDefinition, {
    CheckHealth(
      call: ServerUnaryCall<HealthCheckRequestMessage, HealthCheckResponseMessage>,
      callback: sendUnaryData<HealthCheckResponseMessage>
    ) {
      callback(null, buildHealthResponse(call.request, bridgeState));
    },
    GetBridgeState(
      call: ServerUnaryCall<
        GetBridgeStateRequestMessage,
        GetBridgeStateResponseMessage
      >,
      callback: sendUnaryData<GetBridgeStateResponseMessage>
    ) {
      callback(null, buildBridgeStateResponse(bridgeState.getCurrentState()));
    },
  });

  const port = parseInt(process.env.GRPC_BRIDGE_PORT || '50051', 10);
  const host = process.env.GRPC_BRIDGE_HOST || '0.0.0.0';
  const bindAddress = `${host}:${port}`;

  await new Promise<number>((resolve, reject) => {
    server.bindAsync(
      bindAddress,
      grpc.ServerCredentials.createInsecure(),
      (error, boundPort) => {
        if (error) {
          reject(error);
          return;
        }

        server.start();
        resolve(boundPort);
      }
    );
  });

  logger.info({
    message: 'Bridge gRPC server started',
    bindAddress,
  });

  return {
    server,
    port,
    forceShutdown: () => server.forceShutdown(),
    tryShutdown: () =>
      new Promise<void>((resolve, reject) => {
        server.tryShutdown((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      }),
  };
}
