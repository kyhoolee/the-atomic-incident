// MH: if we end up using a component pattern often, we may want to create a BaseComponent class
// that enforces that components have the standard lifecycle methods of update/destroy/etc.

import { arcadeRecursiveCollide } from "../../../helpers/sprite-utilities.js";

/**
 * Class cung cấp các hành vi về việc targeting của enemy 
 */
export default class TargetingComponent {
  constructor(parent, speed, visionRadius = null) {
    // Đối tượng game 
    this.game = parent.game;
    // Parent của component 
    this.parent = parent;
    // Tốc độ 
    this.speed = speed;
    // Có active hay không 
    this.isActive = true;
    // Target là hướng đến chính player 
    this.target = this.game.globals.player;
    // Danh sách enemies 
    this.enemies = this.game.globals.groups.enemies;
    // Bán kính khoảng nhìn 
    this._visionRadius = visionRadius;
    // Quản lý bản đồ 
    this._mapManager = this.game.globals.mapManager;
    // Điều chỉnh độ khó 
    this._difficultyModifier = this.game.globals.difficultyModifier;
  }

  /**
   * Hàm cập nhật của component targeting 
   */
  update() {
    // Nếu không active việc targeting thì set velocity của parent-body là 0 - đứng yên không truy đuổi 
    if (!this.isActive) {
      this.parent.body.velocity.set(0);
      return null;
    }
    // theo dõi việc va chạm giữa enemy và wall 
    this.game.physics.sat.world.collide(this.parent, this._mapManager.wallLayer);

    // Stop moving
    this.parent.body.velocity.set(0);

    // Vision check, stop early if target is out of range
    if (this._visionRadius !== null) {
      // Tính khoảng cách từ enemy tới đối tượng cần theo dõi 
      const d = this.parent.position.distance(this.target.position);
      // Nếu nằm ngoài bán kinh theo dõi thì dừng lại 
      if (d > this._visionRadius) return this.target;
    }

    // Calculate path - tìm đường đi giữa 2 điểm dựa vào navMesh 
    const path = this._mapManager.navMesh.findPath(this.parent.position, this.target.position);

    // Check if there is a path that was found
    if (path) {
      // Avoidance steering
      const desiredSeparation = 50;
      const separationForce = new Phaser.Point();
      let neighbors = 0;
      // Duyệt qua tất cả các phần tử của enemy 
      for (const enemy of this.enemies.children) {
        const d = this.parent.position.distance(enemy.position);
        if (d < desiredSeparation) {
          const offset = Phaser.Point
            .subtract(this.parent.position, enemy.position)
            .setMagnitude(desiredSeparation - d);
          separationForce.add(offset.x, offset.y);
          neighbors++;
        }
      }
      // Tính lực di chuyển cho cả 1 cụm enemy 
      separationForce.divide(neighbors, neighbors);

      let targetPoint;
      if (path.length > 1) {
        // If there are multiple steps in the path, head towards the second
        // point. This allows the sprite to skip the tile it is currently in.
        const nextNode = path[1];
        const nextTargetPoint = new Phaser.Point(nextNode.x, nextNode.y);
        targetPoint = nextTargetPoint;
      } else {
        // If there aren't multiple steps, sprite is close enough to directly head
        // for the target itself
        targetPoint = this.target.position;
      }

      // Note, this isn't exactly the right way to do this. 
      // Separation force should be weighted so that the max speed isn't exceeded & 
      // separation force shouldn't push the enemy into a wall...
      const body = this.parent.body;
      const multiplier = this._difficultyModifier.getSpeedMultiplier();
      const pathVelocity = this.getVelocityTo(targetPoint).multiply(multiplier, multiplier);
      body.velocity.setTo(
        pathVelocity.x + 4 * separationForce.x,
        pathVelocity.y + 4 * separationForce.y
      );

      this.parent.rotation = Math.atan2(body.velocity.y, body.velocity.x) + Math.PI / 2;
    }

    return this.target;
  }

  /**
   * Tính ra vận tốc đi tới 1 điểm cụ thể 
   * @param {*} position 
   */
  getVelocityTo(position) {
    const angle = this.parent.position.angle(position);
    const distance = this.parent.position.distance(position);
    const targetSpeed = distance / this.game.time.physicsElapsed;
    const magnitude = Math.min(this.speed, targetSpeed);
    return new Phaser.Point(magnitude * Math.cos(angle), magnitude * Math.sin(angle));
  }

  destroy() {
    // Nothing special to destroy
  }
}
