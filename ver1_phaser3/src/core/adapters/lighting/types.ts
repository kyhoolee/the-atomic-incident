export interface LightingConfig {
  width?: number;
  height?: number;
  walls?: any[];
  shadowOpacity?: number;
  debug?: boolean;
}

export interface LightRegistrationOptions {
  position?: { x: number; y: number };
  radius?: number;
  color?: number;
  intensity?: number;
  flicker?: boolean;
}
