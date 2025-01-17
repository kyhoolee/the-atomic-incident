import WEAPON_TYPES from "../weapon-types";

const prefix = "weapons/hit/hit_";

const colorMap = {
  [WEAPON_TYPES.SCATTERSHOT]: 0xe3b0bf,
  [WEAPON_TYPES.RAPID_FIRE]: 0xa3bac1,
  [WEAPON_TYPES.PIERCING_SHOT]: 0x79a491,
  [WEAPON_TYPES.HOMING_SHOT]: 0xd2b6dd,
  [WEAPON_TYPES.ROCKET_LAUNCHER]: 0xc4b090,
  [WEAPON_TYPES.FLAMETHROWER]: 0xf3ce98,
  [WEAPON_TYPES.BOUNCING]: 0xbfccde
};

const getColorFromType = type => colorMap[type] || 0xffffff;

// TODO(rex): Make this more flexible.
/**
 * Sprite mô tả cho quá trình va chạm và hủy của viên đạn 
 * Phong cách lập trình ở đây là mỗi Sprite chỉ phục vụ cho 1 loại trạng thái 
 * Khi có thay đổi - event biến đổi xảy ra thì hủy Sprite cũ và chuyển sang Sprite mới hoạt động
 * Ví dụ
 * Sprite-player --> Sprite-gun --> Sprite-projectile khi bắn --> Sprite-projectile-hit đạn khi hủy 
 */
export default class ProjectileHit extends Phaser.Sprite {
  /**
   * @param {Phaser.Game} game - Reference to Phaser.Game.
   * @param {string} key - Key for sprite in asset sheet.
   * @param {string} frame - Frame for sprite in asset sheet.
   * @param {number} x - X coordinate in world position.
   * @param {number} y - Y coordinate in world position.
   * @param {Phaser.Group} parent - Phaser.Group that stores this projectile.
   * @constructor
   */
  constructor(game, x, y, parent, projectile) {
    super(game, x, y, "assets", `${prefix}00`);
    this.anchor.set(0.5);
    parent.add(this);
    this.sendToBack();

    this.tint = getColorFromType(projectile.parent._type);

    const frames = Phaser.Animation.generateFrameNames(prefix, 0, 8, "", 2);
    this.animations.add("bullet-hit", frames, 30, false).onComplete.add(() => this.destroy());
    this.animations.play("bullet-hit");

    this.rotation += game.rnd.integerInRange(0, 90) * (Math.PI / 180) * game.rnd.sign();

    this.alpha = 0.9;
  }

  destroy(...args) {
    super.destroy(...args);
  }
}
