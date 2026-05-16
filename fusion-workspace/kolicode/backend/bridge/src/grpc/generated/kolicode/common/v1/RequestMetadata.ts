// Original file: ../../shared/proto/common.proto


export interface RequestMetadata {
  'requestId'?: (string);
  'sessionId'?: (string);
  'userId'?: (string);
  'traceId'?: (string);
  'labels'?: ({[key: string]: string});
}

export interface RequestMetadata__Output {
  'requestId': (string);
  'sessionId': (string);
  'userId': (string);
  'traceId': (string);
  'labels': ({[key: string]: string});
}
