import Color from "../../helpers/color";
import HealthBar from "./components/health-bar.js";
import TargetingComp from "./components/targeting-component";
import DashAttackComp from "./components/dash-attack-component";
import { debugShape } from "../../helpers/sprite-utilities";
import { ENEMY_INFO, ENEMY_TYPES } from "./enemy-info";
import ProjectileAttackComponent from "./components/projectile-attack-component";
import SplitOnDeathComponent from "./components/split-on-death-component";
import EnemySpawnIndicator from "./enemy-spawn-indicator";
import BossDashComponent from "./components/boss-dash-component";
import { EnemyHitLogic, WeakSpotHitLogic } from "./enemy-hit-logic";
import logger from "../../helpers/logger";

const ANIM = {
  MOVE: "MOVE",
  HIT: "HIT",
  DEATH: "DEATH"
};

/**
 * Đối tượng enemy - mở rộng từ Phaser.Sprite 
 */
export default class Enemy extends Phaser.Sprite {
  /**
   * Khởi tạo 1 enemy theo type + position 
   * @param {*} game 
   * @param {*} type 
   * @param {*} position 
   * @param {*} enemyGroup 
   */
  static MakeEnemyType(game, type, position, enemyGroup) {
    const info = ENEMY_INFO[type] || {};
    const key = info.key || "";
    const enemy = new Enemy(game, "assets", key, position, enemyGroup, type, {
      health: info.health,
      speed: info.speed,
      visionRadius: null,
      collisionPoints: info.collisionPoints || [],
      animated: info.animated,
      numMoveFrames: info.moveFrames
    });
    return enemy;
  }

  /**
   * Khởi tạo vị trí sinh enemy - vị trí này sẽ tạo ra animation sau đó rồi mới sinh ra enemy
   * @param {*} game 
   * @param {*} type 
   * @param {*} position 
   * @param {*} enemyGroup 
   * @param {*} spawnTime 
   */
  static SpawnWithIndicator(game, type, position, enemyGroup, spawnTime = 3000) {
    const indicator = new EnemySpawnIndicator(game, position.x, position.y, spawnTime);
    enemyGroup.add(indicator);
    // Khi kết thúc thì thực hiện đúng một lần việc sinh enemy theo đúng type + position 
    indicator.onFinished.addOnce(() => Enemy.MakeEnemyType(game, type, position, enemyGroup));
  }

  constructor(
    game,
    key,
    frame,
    position,
    enemyGroup,
    type,
    {
      animated = true,
      health = 100,
      color = 0xffffff,
      speed = 100,
      visionRadius = 200,
      collisionPoints = [],
      numMoveFrames = 16
    } = {}
  ) {
    // Khởi tạo thông tin Sprite của enemy - với hình ảnh tương ứng 
    super(game, position.x, position.y, key, animated ? `${frame}/move_00` : frame);
    this.anchor.set(0.5);

    // Danh sách các logic của 1 enemy - thường gồm 2 loại logic chính - 
    // 1. Logic EnemyHitLogic 
    // 2. Logic TargetingComp
    this._components = [];
    this.type = type;
    this.baseScale = 1;

    // Khởi tạo logic của từng loại enemy 
    switch (this.type) {
      // 1. Loại truy đuổi 
      case ENEMY_TYPES.FOLLOWING: {
        this._hitLogic = new EnemyHitLogic(this);
        this._components.push(new TargetingComp(this, speed, visionRadius));
        break;
      }
      // 2. Loại chạy nhanh 
      case ENEMY_TYPES.DASHING: {
        this._hitLogic = new EnemyHitLogic(this);
        const targeting = new TargetingComp(this, speed, visionRadius);
        const dash = new DashAttackComp(this, 2 * speed, targeting);
        this._components.push(targeting, dash);
        break;
      }
      // 3. Loại bắn đạn 
      case ENEMY_TYPES.PROJECTILE: {
        this._hitLogic = new EnemyHitLogic(this);
        const targeting = new TargetingComp(this, speed, visionRadius);
        const projectile = new ProjectileAttackComponent(this, targeting);
        this._components.push(targeting, projectile);
        break;
      }
      // 4. Loại chia nhỏ 
      case ENEMY_TYPES.DIVIDING: {
        this._hitLogic = new EnemyHitLogic(this);
        const targeting = new TargetingComp(this, speed * 3 / 4, visionRadius);
        const splitOnDeath = new SplitOnDeathComponent(this, targeting, this.onDie);
        this._components.push(targeting, splitOnDeath);
        this.baseScale = 1.25;
        break;
      }
      // 5. Loại đã bị chia nhỏ 
      case ENEMY_TYPES.DIVIDING_SMALL: {
        this._hitLogic = new EnemyHitLogic(this);
        const targeting = new TargetingComp(this, speed, visionRadius);
        this._components.push(targeting);
        this.baseScale = 0.75;
        break;
      }
      // 6. Loại có giáp 
      case ENEMY_TYPES.TANK: {
        this._hitLogic = new WeakSpotHitLogic(this);
        const targeting = new TargetingComp(this, speed, visionRadius);
        const dash = new BossDashComponent(this, 2 * speed, targeting, collisionPoints);
        this._components.push(targeting, dash);
        break;
      }
      // 7. Mặc định - thực ra là invalid - vẫn gán 1 logic mặc định 
      default: {
        logger.log("Invalid enemy type specified, using default Targeting Component!");
        this._hitLogic = new EnemyHitLogic(this);
        this._components.push(new TargetingComp(this, speed, visionRadius));
        break;
      }
    }

    /**
    * The scale of this DisplayObject. A scale of 1:1 represents the DisplayObject
    * at its default size. A value of 0.5 would scale this DisplayObject by half, and so on.
    * 
    * The value of this property does not reflect any scaling happening further up the display list.
    * To obtain that value please see the `worldScale` property.
    * 
    * scale: Phaser.Point;
    */
    this.scale.setTo(this.baseScale);

    // Add this enemy to the Enemies group.
    // Đưa enemy vào group 
    enemyGroup.addEnemy(this);
    this.enemyGroup = enemyGroup;

    // tạo color cho enemy 
    const colorObj = color instanceof Color ? color : new Color(color);
    this.tint = colorObj.getRgbColorInt();

    // Tạo thanh thông báo health cho enemy 
    const cx = 0;
    const cy = this.height / 2 + 4;
    const fg = game.globals.groups.foreground; // Temp fix: move health above the shadows
    this._healthBar = new HealthBar(game, this, fg, cx, cy, 20, 4);
    this._healthBar.initHealth(health);

    // Animations
    // Xử lý các loại animation tương ứng 
    const genFrameNames = Phaser.Animation.generateFrameNames;
    const moveFrames = animated
      ? genFrameNames(`${frame}/move_`, 0, numMoveFrames - 1, "", 2)
      : [frame];

    const hitFrames = animated ? genFrameNames(`${frame}/hit_`, 0, 15, "", 2) : [frame];

    const deathFrames = animated ? genFrameNames(`${frame}/death_`, 0, 15, "", 2) : [frame];

    this.animations.add(ANIM.MOVE, moveFrames, 24, true);

    this.animations.add(ANIM.HIT, hitFrames, 64, false).onComplete.add(() => {
      this.animations.play(ANIM.MOVE);
    }, this);

    this.animations.add(ANIM.DEATH, deathFrames, 64, false).onComplete.add(() => {
      this.destroy();
    });

    // Sound fx
    // sound lúc trúng đạn 
    this._hitSound = this.game.globals.soundManager.add("fx/squish-impact-faster", 5);
    // sound lúc ngỏm 
    this._deathSound = this.game.globals.soundManager.add("fx/squish");

    // hình dạng polygon để check collision 
    const points = collisionPoints.map(p => ({
      x: (p[0] - 0.5) * this.width,
      y: (p[1] - 0.5) * this.height
    }));
    game.physics.sat.add.gameObject(this).setPolygon(points);

    // Spawn animation
    // Animation lúc sinh ra 
    this.scale.setTo(this.baseScale * 0.5, this.baseScale * 0.5);
    this.animations.play(ANIM.MOVE);
    this.game.make
      .tween(this.scale)
      .to({ x: this.baseScale * 1.4, y: this.baseScale * 1.4 }, 100, Phaser.Easing.Bounce.In)
      .to({ x: this.baseScale, y: this.baseScale }, 150, Phaser.Easing.Quadratic.Out)
      .start();

    // Set the isDead flag.
    this.isDead = false;
  }

  /**
   * Logic khi trúng đạn - tùy loại đạn, loại enemy sẽ có logic khi trúng đạn khác nhau 
   * @param {*} projectile 
   * @param {*} damage 
   */
  attemptHit(projectile, damage) {
    // Gọi logic-hit tùy biến thực hiện 
    return this._hitLogic.attemptHit(damage, projectile);
  }

  /**
   * Logic khi nhận trừ damage 
   * @param {*} damage 
   * @param {*} projectile 
   */
  takeDamage(damage, projectile) {
    if (this.isDead) return false;

    // Cập nhật lại thanh health-bar
    const newHealth = this._healthBar.incrementHealth(-damage);
    // this._flashFilter.startFlash();
    // TODO(rex): Play the flash animation frames.
    if (newHealth <= 0) {
      if (projectile && projectile.body) {
        // TODO: handle player dash
        const angle = Math.atan2(projectile.body.velocity.y, projectile.body.velocity.x);
        this.enemyGroup.emitDeathParticles(projectile.position, angle);
      }
      this.die();
      this._deathSound.play();
      this.animations.play(ANIM.DEATH);
      return true;
    }
    this.animations.play(ANIM.HIT);
    this._hitSound.play();
    return false;
  }

  update() {
    if (this.isDead) 
      return;
    // Hit logic nằm riêng so với các logic khác
    this._hitLogic.update();
    // Khi một enemy được update nghĩa là gọi tất cả các logic components được cập nhật 
    // Logic trúng đạn, logic tấn công, logic truy đuổi, ...
    for (const component of this._components) 
      component.update();
    // Gọi super.update - cập nhật các logic về sprite 
    super.update();
  }

  die() {
    this.isDead = true;
    // If this is an Amoeba, with a SplitOnDeath component, activate the splitOnDeath method.
    // Gọi riêng logic của SplitOnDeathComponent thực hiện logic 
    if (this.type === ENEMY_TYPES.DIVIDING) {
      const splitComponent = this._components.find(c => {
        return c instanceof SplitOnDeathComponent;
      });
      if (splitComponent) splitComponent.splitOnDeath();
    }
    this.body.destroy();
  }

  postUpdate(...args) {
    // Post updates are where movement physics are applied. We want all post updates to finish
    // BEFORE placing extracting the sprite's position
    super.postUpdate(...args);
    // Now extract sprite position and apply it to the group
    this._healthBar.updatePosition();
  }

  destroy(...args) {
    this.game.tweens.removeFrom(this);
    this.game.tweens.removeFrom(this.scale);
    this._healthBar.destroy();
    for (const component of this._components) component.destroy();
    super.destroy(...args);
  }
}
