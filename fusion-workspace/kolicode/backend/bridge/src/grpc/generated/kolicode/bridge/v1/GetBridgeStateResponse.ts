// Original file: ../../shared/proto/bridge.proto

import type { BridgeLifecycleState as _kolicode_bridge_v1_BridgeLifecycleState, BridgeLifecycleState__Output as _kolicode_bridge_v1_BridgeLifecycleState__Output } from '../../../kolicode/bridge/v1/BridgeLifecycleState';
import type { Long } from '@grpc/proto-loader';

export interface GetBridgeStateResponse {
  'currentState'?: (_kolicode_bridge_v1_BridgeLifecycleState);
  'previousState'?: (_kolicode_bridge_v1_BridgeLifecycleState);
  'transitionTimeMs'?: (number | string | Long);
  'errorMessage'?: (string);
  'metadata'?: ({[key: string]: string});
}

export interface GetBridgeStateResponse__Output {
  'currentState': (_kolicode_bridge_v1_BridgeLifecycleState__Output);
  'previousState': (_kolicode_bridge_v1_BridgeLifecycleState__Output);
  'transitionTimeMs': (string);
  'errorMessage': (string);
  'metadata': ({[key: string]: string});
}
