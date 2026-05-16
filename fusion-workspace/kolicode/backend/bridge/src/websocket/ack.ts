export function safeAck<T>(
  callback: unknown,
  payload: T
): void {
  if (typeof callback === 'function') {
    callback(payload);
  }
}
