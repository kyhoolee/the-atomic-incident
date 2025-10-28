import physicsShapes from "./physics";

/**
 * Thông tin về các loại enemy 
 */
export const ENEMY_TYPES = {
  // 1. Loại enemy to - có thể split ra thành các enemy giống hệt nhưng nhỏ hơn 
  DIVIDING: "DIVIDING",
  // 2. Loại enemy nhỏ - split ra từ enemy to 
  DIVIDING_SMALL: "DIVIDING_SMALL",
  // 3. Loại enemy chuyên đuổi 
  FOLLOWING: "FOLLOWING",
  // 4. Loại enemy có thể chạy nhanh 
  DASHING: "DASHING",
  // 5. Loại enemy có giáp 
  TANK: "TANK",
  // 6. Loại enemy bắn đạn 
  PROJECTILE: "PROJECTILE"
};

/**
 * Collection of info about the different enemies - asset key & collision polygon points for now.
 * Width & height are just used to make collision points relative. 
 * Points should be in clockwise order (as viewed in photoshop).
 */
export const ENEMY_INFO = {
  DIVIDING: {
    animated: true,
    health: 100,
    speed: 160,
    moveFrames: 16,
    key: "enemies/splitting_large",
    collisionPoints: physicsShapes["DIVIDING"]
  },
  DIVIDING_SMALL: {
    animated: true,
    health: 100,
    speed: 160,
    moveFrames: 16,
    key: "enemies/splitting_small",
    collisionPoints: physicsShapes["DIVIDING_SMALL"]
  },
  FOLLOWING: {
    animated: true,
    health: 100,
    speed: 160,
    moveFrames: 16,
    key: "enemies/tracking_small",
    collisionPoints: physicsShapes["FOLLOWING"]
  },
  TANK: {
    animated: true,
    health: 150,
    speed: 100,
    moveFrames: 16,
    key: "enemies/mini_boss_charging",
    collisionPoints: physicsShapes["TANK"]
  },
  DASHING: {
    animated: true,
    health: 100,
    speed: 160,
    moveFrames: 16,
    key: "enemies/charging",
    collisionPoints: physicsShapes["DASHING"]
  },
  PROJECTILE: {
    animated: true,
    health: 100,
    speed: 160,
    moveFrames: 16,
    key: "enemies/shooting",
    collisionPoints: physicsShapes["PROJECTILE"]
  }
};
