// Original file: ../../shared/proto/engine.proto


export interface EngineResponse {
  'success'?: (boolean);
  'operation'?: (string);
  'message'?: (string);
  'payload'?: (Buffer | Uint8Array | string);
  'metadata'?: ({[key: string]: string});
}

export interface EngineResponse__Output {
  'success': (boolean);
  'operation': (string);
  'message': (string);
  'payload': (Buffer);
  'metadata': ({[key: string]: string});
}
