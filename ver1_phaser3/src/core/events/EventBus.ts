import Phaser from 'phaser';

export type EventHandler<T = unknown> = (payload: T) => void;

/**
 * Thin wrapper around Phaser.EventEmitter to provide a consistent event bus API.
 */
export class EventBus {
  private emitter: Phaser.Events.EventEmitter;

  constructor(emitter?: Phaser.Events.EventEmitter) {
    this.emitter = emitter ?? new Phaser.Events.EventEmitter();
  }

  emit<T = unknown>(event: string, payload?: T): void {
    this.emitter.emit(event, payload);
  }

  on<T = unknown>(event: string, handler: EventHandler<T>, context?: any): () => void {
    this.emitter.on(event, handler as EventHandler, context);
    return () => this.off(event, handler, context);
  }

  once<T = unknown>(event: string, handler: EventHandler<T>, context?: any): void {
    this.emitter.once(event, handler as EventHandler, context);
  }

  off<T = unknown>(event: string, handler: EventHandler<T>, context?: any): void {
    this.emitter.off(event, handler as EventHandler, context, false);
  }

  removeAll(event?: string): void {
    if (event) {
      this.emitter.removeAllListeners(event);
    } else {
      this.emitter.removeAllListeners();
    }
  }

  destroy(): void {
    this.removeAll();
  }
}

/**
 * Global event bus for cross-system communication.
 */
export const gameEvents = new EventBus();

/**
 * Helper to create scoped event bus instances (e.g., per scene).
 */
export const createEventBus = (): EventBus => new EventBus();
