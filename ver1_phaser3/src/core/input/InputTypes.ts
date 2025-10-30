import Phaser from 'phaser';

/**
 * Phân loại input mà game sử dụng:
 * - Digital: các nút on/off (Space, Shift, button gamepad, nút ảo mobile).
 * - Analog: vector liên tục (WASD/arrow, joystick, virtual stick) dùng cho movement.
 * - Pointer: toạ độ con trỏ (chuột trên desktop hoặc ngón tay trên mobile) – phục vụ aim / HUD.
 * Các struct phía dưới mô tả cấu hình và state tương ứng.
 */
export type InputAction = string;

/**
 * Loại action hỗ trợ.
 * - 'digital': dạng on/off (trigger).
 * - 'analog': vector 2D (ví dụ joystick, WASD).
 * - 'pointer': vị trí trỏ chuột/ touch.
 */
export type ActionType = 'digital' | 'analog' | 'pointer';

/**
 * Cấu hình cho action digital (trigger).
 */
export interface DigitalActionConfig {
  type: 'digital';
  keyboard?: string[]; // key names (e.g., 'SPACE', 'SHIFT', 'Q')
}

/**
 * Cấu hình cho action analog: map các phím cho trục X/Y
 * và áp dụng deadzone nếu cần.
 */
export interface AnalogActionConfig {
  type: 'analog';
  keyboard?: {
    positiveX?: string[];
    negativeX?: string[];
    positiveY?: string[];
    negativeY?: string[];
  };
  deadzone?: number;
}

/**
 * Cấu hình cho action pointer – hiện chỉ cần flag type.
 */
export interface PointerActionConfig {
  type: 'pointer';
}

/**
 * Union cho mọi kiểu config.
 */
export type ActionConfig = DigitalActionConfig | AnalogActionConfig | PointerActionConfig;

/**
 * State trả về cho action digital (pressed/justPressed...).
 */
export interface DigitalState {
  type: 'digital';
  pressed: boolean;
  justPressed: boolean;
  justReleased: boolean;
}

/**
 * State analog: vector đã normalise, vector raw và magnitude.
 */
export interface AnalogState {
  type: 'analog';
  vector: Phaser.Math.Vector2;
  raw: Phaser.Math.Vector2;
  magnitude: number;
}

/**
 * State pointer: toạ độ màn hình, world và pointer gốc.
 */
export interface PointerState {
  type: 'pointer';
  screen: Phaser.Math.Vector2;
  world: Phaser.Math.Vector2;
  pointer: Phaser.Input.Pointer;
}

/**
 * Union state cho các action.
 */
export type ActionState = DigitalState | AnalogState | PointerState;
