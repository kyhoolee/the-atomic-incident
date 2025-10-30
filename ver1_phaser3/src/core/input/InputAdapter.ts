import Phaser from 'phaser';

import {
  ActionConfig,
  ActionState,
  AnalogActionConfig,
  AnalogState,
  DigitalActionConfig,
  DigitalState,
  PointerState
} from './InputTypes';

type Handler = (state: ActionState) => void;

interface RegisteredAction {
  config: ActionConfig;
  handlers: Set<Handler>;
  keyboard?: KeyboardBinding;
}

interface KeyboardBinding {
  keys?: Phaser.Input.Keyboard.Key[];
  positiveX?: Phaser.Input.Keyboard.Key[];
  negativeX?: Phaser.Input.Keyboard.Key[];
  positiveY?: Phaser.Input.Keyboard.Key[];
  negativeY?: Phaser.Input.Keyboard.Key[];
}

export class InputAdapter {
  private scene?: Phaser.Scene;
  private actions = new Map<string, RegisteredAction>();
  private pointerVec = new Phaser.Math.Vector2();
  private worldVec = new Phaser.Math.Vector2();
  private injectedAnalog = new Map<string, Phaser.Math.Vector2>();

  init(scene: Phaser.Scene): void {
    this.scene = scene;
  }

  registerAction(action: string, config: ActionConfig): void {
    if (!this.scene) throw new Error('InputAdapter.init(scene) must be called before registerAction');

    const existing = this.actions.get(action);
    const registered: RegisteredAction = existing ?? {
      config,
      handlers: new Set()
    };
    registered.config = config;
    registered.handlers.clear();

    if (config.type === 'digital') {
      registered.keyboard = this.buildDigitalBinding(config);
    } else if (config.type === 'analog') {
      registered.keyboard = this.buildAnalogBinding(config);
    }

    this.actions.set(action, registered);
  }

  on(action: string, handler: Handler): () => void {
    const registered = this.actions.get(action);
    if (!registered) throw new Error(`Action ${action} not registered`);
    registered.handlers.add(handler);
    return () => this.off(action, handler);
  }

  off(action: string, handler: Handler): void {
    this.actions.get(action)?.handlers.delete(handler);
  }

  update(_delta: number): void {
    if (!this.scene) return;

    for (const [action, registered] of this.actions.entries()) {
      if (registered.handlers.size === 0) continue;
      const config = registered.config;

      let state: ActionState | null = null;
      if (config.type === 'digital') {
        state = this.computeDigitalState(registered);
      } else if (config.type === 'analog') {
        state = this.computeAnalogState(action, registered, config);
      } else if (config.type === 'pointer') {
        state = this.computePointerState();
      }

      if (state) {
        for (const handler of registered.handlers) {
          handler(state);
        }
      }
    }
  }

  destroy(): void {
    this.injectedAnalog.clear();
    for (const registered of this.actions.values()) {
      registered.handlers.clear();
      if (registered.keyboard) {
        const keys = [
          ...(registered.keyboard.keys ?? []),
          ...(registered.keyboard.positiveX ?? []),
          ...(registered.keyboard.negativeX ?? []),
          ...(registered.keyboard.positiveY ?? []),
          ...(registered.keyboard.negativeY ?? [])
        ];
        keys.forEach((key) => key.destroy());
      }
    }
    this.actions.clear();
    this.injectedAnalog.clear();
    this.scene = undefined;
  }

  setAnalog(action: string, vector: Phaser.Math.Vector2 | null): void {
    if (!vector || vector.lengthSq() === 0) {
      this.injectedAnalog.delete(action);
    } else {
      this.injectedAnalog.set(action, vector.clone());
    }
  }

  private buildDigitalBinding(config: DigitalActionConfig): KeyboardBinding {
    if (!this.scene) throw new Error('Scene not initialised');
    const keyboard = this.scene.input.keyboard;
    if (!keyboard) {
      console.warn('[InputAdapter] Keyboard plugin unavailable, digital action disabled');
      return { keys: [] };
    }
    const keys = (config.keyboard ?? []).map((code) => keyboard.addKey(this.resolveKeyCode(code)));
    return { keys };
  }

  private buildAnalogBinding(config: AnalogActionConfig): KeyboardBinding {
    if (!this.scene) throw new Error('Scene not initialised');
    const keyboard = this.scene.input.keyboard;
    if (!keyboard) {
      console.warn('[InputAdapter] Keyboard plugin unavailable, analog action disabled');
      return {};
    }
    const binding: KeyboardBinding = {};
    const mapKeys = (list?: string[]) => list?.map((code) => keyboard.addKey(this.resolveKeyCode(code))) ?? [];
    binding.positiveX = mapKeys(config.keyboard?.positiveX);
    binding.negativeX = mapKeys(config.keyboard?.negativeX);
    binding.positiveY = mapKeys(config.keyboard?.positiveY);
    binding.negativeY = mapKeys(config.keyboard?.negativeY);
    return binding;
  }

  private computeDigitalState(registered: RegisteredAction): DigitalState {
    const keys = registered.keyboard?.keys ?? [];
    const pressed = keys.some((key) => key.isDown);
    const justPressed = keys.some((key) => Phaser.Input.Keyboard.JustDown(key));
    const justReleased = keys.some((key) => Phaser.Input.Keyboard.JustUp(key));
    return { type: 'digital', pressed, justPressed, justReleased };
  }

  private computeAnalogState(action: string, registered: RegisteredAction, config: AnalogActionConfig): AnalogState {
    const injected = this.injectedAnalog.get(action);
    if (injected) {
      const rawInjected = injected.clone();
      const vectorInjected = rawInjected.clone();
      let magnitudeInjected = vectorInjected.length();
      const deadzone = config.deadzone ?? 0;
      if (magnitudeInjected > 0) {
        if (magnitudeInjected < deadzone) {
          vectorInjected.set(0, 0);
          magnitudeInjected = 0;
        } else {
          vectorInjected.normalize();
        }
      }
      return { type: 'analog', vector: vectorInjected, raw: rawInjected, magnitude: magnitudeInjected };
    }

    const binding = registered.keyboard ?? {};
    const axisX = this.computeAxis(binding.positiveX, binding.negativeX);
    const axisY = this.computeAxis(binding.positiveY, binding.negativeY);
    const raw = new Phaser.Math.Vector2(axisX, axisY);
    const vector = raw.clone();
    const deadzone = config.deadzone ?? 0;
    let magnitude = vector.length();
    if (magnitude > 0) {
      if (magnitude < deadzone) {
        vector.set(0, 0);
        magnitude = 0;
      } else {
        vector.normalize();
      }
    }
    return { type: 'analog', vector, raw, magnitude };
  }

  private computePointerState(): PointerState {
    if (!this.scene) throw new Error('Scene not initialised');
    const pointer = this.scene.input.activePointer;
    this.pointerVec.set(pointer.x, pointer.y);
    this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y, this.worldVec);
    return {
      type: 'pointer',
      screen: this.pointerVec.clone(),
      world: this.worldVec.clone(),
      pointer
    };
  }

  private computeAxis(positive?: Phaser.Input.Keyboard.Key[], negative?: Phaser.Input.Keyboard.Key[]): number {
    let value = 0;
    if (positive?.some((key) => key.isDown)) value += 1;
    if (negative?.some((key) => key.isDown)) value -= 1;
    return value;
  }

  private resolveKeyCode(name: string): number {
    const keyCodes = Phaser.Input.Keyboard.KeyCodes as Record<string, number>;
    const upper = name.toUpperCase();
    if (keyCodes[upper] !== undefined) return keyCodes[upper];
    if (upper.length === 1) {
      const charCode = upper.charCodeAt(0);
      if (charCode >= 65 && charCode <= 90) {
        return charCode;
      }
    }
    console.warn(`[InputAdapter] Unknown key code '${name}', defaulting to SPACE`);
    return Phaser.Input.Keyboard.KeyCodes.SPACE;
  }
}
