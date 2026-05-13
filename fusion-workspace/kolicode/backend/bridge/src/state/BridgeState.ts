import { logger } from '../utils/logger';

/**
 * Bridge state machine
 * Tracks the current state of the Bridge service
 */
export type BridgeStateType =
  | 'IDLE'
  | 'AUTHENTICATING'
  | 'PROCESSING_VECTOR'
  | 'COMPUTING_COLOR'
  | 'AUDITING'
  | 'COMPLETED'
  | 'ERROR';

export interface BridgeStateInfo {
  current: BridgeStateType;
  previousState?: BridgeStateType;
  transitionTime: Date;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

/**
 * State machine for Bridge orchestration
 * Manages state transitions and validates allowed transitions
 */
export class BridgeState {
  private state: BridgeStateInfo;
  private stateHistory: BridgeStateInfo[] = [];
  private readonly maxHistorySize = 100;

  // Allowed transitions
  private readonly transitions: Record<BridgeStateType, BridgeStateType[]> = {
    IDLE: ['AUTHENTICATING', 'PROCESSING_VECTOR', 'ERROR'],
    AUTHENTICATING: ['IDLE', 'PROCESSING_VECTOR', 'ERROR'],
    PROCESSING_VECTOR: ['COMPUTING_COLOR', 'AUDITING', 'COMPLETED', 'ERROR'],
    COMPUTING_COLOR: ['AUDITING', 'COMPLETED', 'ERROR'],
    AUDITING: ['COMPLETED', 'ERROR'],
    COMPLETED: ['IDLE'],
    ERROR: ['IDLE'],
  };

  constructor() {
    this.state = {
      current: 'IDLE',
      transitionTime: new Date(),
    };
    this.recordState();
  }

  /**
   * Transition to a new state if allowed
   */
  public transition(
    newState: BridgeStateType,
    metadata?: Record<string, unknown>
  ): boolean {
    const allowedTransitions = this.transitions[this.state.current];

    if (!allowedTransitions.includes(newState)) {
      logger.warn({
        message: 'Invalid state transition attempted',
        from: this.state.current,
        to: newState,
        allowedTransitions,
      });
      return false;
    }

    const previousState = this.state.current;
    this.state = {
      current: newState,
      previousState,
      transitionTime: new Date(),
      metadata,
    };

    logger.info({
      message: 'Bridge state transition',
      from: previousState,
      to: newState,
      metadata,
    });

    this.recordState();
    return true;
  }

  /**
   * Set error state with message
   */
  public setError(errorMessage: string): void {
    const previousState = this.state.current;
    this.state = {
      current: 'ERROR',
      previousState,
      transitionTime: new Date(),
      errorMessage,
    };

    logger.error({
      message: 'Bridge error state set',
      previousState,
      errorMessage,
    });

    this.recordState();
  }

  /**
   * Reset to IDLE state
   */
  public reset(): void {
    const previousState = this.state.current;
    this.state = {
      current: 'IDLE',
      previousState,
      transitionTime: new Date(),
    };

    logger.info({
      message: 'Bridge state reset',
      previousState,
    });

    this.recordState();
  }

  /**
   * Get current state info
   */
  public getCurrentState(): BridgeStateInfo {
    return { ...this.state };
  }

  /**
   * Get current state name
   */
  public getState(): BridgeStateType {
    return this.state.current;
  }

  /**
   * Get state history
   */
  public getHistory(): BridgeStateInfo[] {
    return [...this.stateHistory];
  }

  /**
   * Check if Bridge is ready for new work
   */
  public isReady(): boolean {
    return this.state.current === 'IDLE' || this.state.current === 'COMPLETED';
  }

  /**
   * Check if Bridge is in error state
   */
  public isError(): boolean {
    return this.state.current === 'ERROR';
  }

  /**
   * Record state in history
   */
  private recordState(): void {
    this.stateHistory.push({ ...this.state });

    // Keep only last N entries
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory = this.stateHistory.slice(-this.maxHistorySize);
    }
  }
}

export default BridgeState;

