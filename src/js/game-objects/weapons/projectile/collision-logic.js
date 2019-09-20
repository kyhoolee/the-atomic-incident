import Explosion from "../explosion";
import ProjectileHit from "../projectile/projectile-hit";

export const COLLISION_SURFACE = {
  DESTRUCTIBLE: "destructible",
  INDESTRUCTIBLE: "indestructible"
};

/**
 * Base class for handling projectile collision with enemies and walls. The default logic is that a
 * projectile is destroyed on colliding with something.
 *
 * @class CollisionLogic
 */
export class CollisionLogic {
  constructor(projectile, damage) {
    this.projectile = projectile;
    this.damage = damage;
    this.wallHitSound = projectile.game.globals.soundManager.add("fx/wall-hit", 10);
  }

  /** Noop on base class, but can be used in derived classes */
  onBeforeCollisions() { }
  onAfterCollisions() { }

  // Destroy no matter what
  onCollideWithEnemy(enemy) {
    const surfaceHit = enemy.attemptHit(this.projectile, this.damage);
    if (surfaceHit === COLLISION_SURFACE.INDESTRUCTIBLE) this.wallHitSound.play();
    this.projectile.destroy();
  }

  // Destroy no matter what
  onCollideWithWall() {
    this.wallHitSound.play();
    const p = this.projectile;
    new ProjectileHit(p.game, p.x, p.y, p.parent, p);
    p.destroy();
  }
}

/**
 * Piercing projectiles damage an enemy but are not destroyed on contact.
 *
 * @class PiercingCollisionLogic
 */
export class PiercingCollisionLogic extends CollisionLogic {
  constructor(projectile, damage) {
    super(projectile, damage);
    this._enemiesDamaged = [];
  }

  onCollideWithEnemy(enemy) {
    if (!this._enemiesDamaged.includes(enemy)) {
      const surfaceHit = enemy.attemptHit(this.projectile, this.damage);
      if (surfaceHit === COLLISION_SURFACE.DESTRUCTIBLE) this._enemiesDamaged.push(enemy);
      else if (surfaceHit === COLLISION_SURFACE.INDESTRUCTIBLE) {
        this.wallHitSound.play();
        const p = this.projectile;
        new ProjectileHit(p.game, p.x, p.y, p.parent, p);
      }
    }
  }
}

/**
 * Bouncing projectiles damage an enemy but are not destroyed on contact.
 *
 * @class BouncingCollisionLogic
 */
export class BouncingCollisionLogic extends CollisionLogic {
  constructor(projectile, damage) {
    super(projectile, damage);
  }

  // Noop
  onCollideWithWall() {
    this.wallHitSound.play();
    // --> Khi va chạm với wall thì ko làm gì --> Vậy logic vật lý nảy lại thì được thực hiện ở đâu ???
    // --> Chắc chắn logic nảy được thực hiện do bounce = 1 trong khi các loại đạn khác bounce = 0
    // Vậy chỗ nào xử lý bounce --> chỗ này bảo toàn năng lượng vật lý khi va chạm
    // Trong khi class World + Body quản lý va chạm là tự implement - ko rõ đoạn nào call sang các thư viện vật lý 
    /*
    --> Một game thông thường xử lý vật lý thì sẽ phải có ít nhất hàm khởi tạo vật lý
    1. Khởi tạo World of physics
    game.physics.startSystem(Phaser.Physics.ARCADE);
    //  This creates a simple sprite that is using our loaded image and displays it on-screen and assign it to a variable
    
    2. Khởi tạo đối tượng Sprite với thuộc tính vật lý - đúng với thế giới vật lý 
    image = game.add.sprite(400, 200, 'flyer');
    game.physics.enable(image, Phaser.Physics.ARCADE);

    3. Setup các thông tin - thuộc tính vật lý 

    3.1. Vận tốc 
    //  This gets it moving
    image.body.velocity.setTo(200, 200);
    //  This makes the game world bounce-able

    3.2. Điều kiện khi va chạm 
    3.2.1 Cho phép va chạm với bounding của world 
    image.body.collideWorldBounds = true;
    //  This sets the image bounce energy for the horizontal  and vertical vectors (as an x,y point). "1" is 100% energy return
    3.2.2 Tỉ lệ bounce khi va chạm 
    image.body.bounce.set(0.8);
    3.2.3 Gia tốc trọng trường 
    image.body.gravity.set(0, 180);
     */
  }
}

/**
 * Exploding projectiles don't do damage themselves, but cause an explosion on contact with a wall
 * or enemy
 *
 * @class ExplodingCollisionLogic
 */
export class ExplodingCollisionLogic extends CollisionLogic {
  constructor(projectile, damage) {
    super(projectile, damage);
    this.hasExploded = false; // Used to prevent exploding on wall AND enemy in same update tick
  }

  onCollideWithWall() {
    if (this.hasExploded) return true;
    const p = this.projectile;
    new Explosion(p.game, p.x, p.y, p.parent, this.damage);
    super.onCollideWithWall();
    this.hasExploded = true;
  }

  onCollideWithEnemy(enemy) {
    if (this.hasExploded) return true;
    const p = this.projectile;
    new Explosion(p.game, p.x, p.y, p.parent, this.damage);
    p.destroy();
    this.hasExploded = true;
  }
}
