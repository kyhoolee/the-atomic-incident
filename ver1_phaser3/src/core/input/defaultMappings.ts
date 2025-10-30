import { ActionConfig } from './InputTypes';

export const INPUT_ACTIONS = {
  MOVE: 'move',
  AIM: 'aim',
  FIRE: 'fire',
  DASH: 'dash',
  ABILITY: 'ability',
  GADGET: 'gadget',
  PAUSE: 'pause'
} as const;

export const defaultActionConfigs: Record<string, ActionConfig> = {
  [INPUT_ACTIONS.MOVE]: {
    type: 'analog',
    keyboard: {
      positiveX: ['D', 'RIGHT'],
      negativeX: ['A', 'LEFT'],
      positiveY: ['S', 'DOWN'],
      negativeY: ['W', 'UP']
    },
    deadzone: 0
  },
  [INPUT_ACTIONS.AIM]: {
    type: 'pointer'
  },
  [INPUT_ACTIONS.FIRE]: {
    type: 'digital',
    keyboard: ['SPACE']
  },
  [INPUT_ACTIONS.DASH]: {
    type: 'digital',
    keyboard: ['SHIFT']
  },
  [INPUT_ACTIONS.ABILITY]: {
    type: 'digital',
    keyboard: ['Q']
  },
  [INPUT_ACTIONS.GADGET]: {
    type: 'digital',
    keyboard: ['E']
  },
  [INPUT_ACTIONS.PAUSE]: {
    type: 'digital',
    keyboard: ['ESC']
  }
};
