import Scattershot from "./scattershot";
import RapidFire from "./rapid-fire";
import PiercingShot from "./piercing-shot";
import HomingShot from "./homing-shot";
import RocketLauncher from "./rocket-launcher";
import Flamethrower from "./flamethrower";
import BouncingShot from "./bouncing-shot";
import WEAPON_TYPES from "./weapon-types";
import MountedGun from "./mounted-gun";

/**
 * Quản lý hoạt động của vũ khí
 * Cơ bản movement + event của các đối tượng đạn + logic hoạt động + hiệu ứng thể hiện 
 * 
  * A Group is a container for {@link DisplayObject display objects} 
  *  {@link Phaser.Sprite Sprites} and {@link Phaser.Image Images}.
  * 
  * Groups form the logical tree structure of the display/scene graph 
  * where local transformations are applied to children.
  * For instance, all children are also moved/rotated/scaled when the group is moved/rotated/scaled.
  * 
  * In addition, Groups provides support for fast pooling and object recycling.
  * Groups are also display objects and can be nested as children within other Groups.
 */
export default class WeaponManager extends Phaser.Group {

  constructor(game, parent, player, enemies) {
    /* 
    * @param game A reference to the currently running game.
    * @param parent The parent Group (or other {@link DisplayObject}) that this group will be added to.
    *               If undefined/unspecified the Group will be added to the {@link Phaser.Game#world Game World}; if null the Group will not be added to any parent. - Default: (game world)
    * @param name A name for this group. Not used internally but useful for debugging. - Default: 'group'
    * @param addToStage If true this group will be added directly to the Game.Stage instead of Game.World.
    * @param enableBody If true all Sprites created with {@link #create} or {@link #createMulitple} will have a physics body created on them. Change the body type with {@link #physicsBodyType}.
    * @param physicsBodyType The physics body type to use when physics bodies are automatically added. See {@link #physicsBodyType} for values.
    */
    super(game, parent, "WeaponManager");
    // Tham chiếu đến game, player và danh sách enemies 
    this._game = game;
    this._player = player;
    this._enemies = enemies;

    // Các loại đạn khác nhau - đều được khởi tạo sẵn - tùy sử dụng thì sẽ gọi đạn đó 

    // Đạn chùm rẽ nhiều viên khi bắn - Scatter phân tán 
    this._scattershot = new Scattershot(game, this, player, enemies);
    // Đạn bắn nhanh - liên thanh - speedup của piercingShot
    this._rapidFire = new RapidFire(game, this, player, enemies);
    // Đạn bình tường - bắn từng viên một - Piercing xuyên qua  
    this._piercingShot = new PiercingShot(game, this, player, enemies);
    // Đạn nẩy khi chạm tường 
    this._bouncingShot = new BouncingShot(game, this, player, enemies);
    // Đạn đuổi rẽ 3 viên khi bắn 
    this._homingShot = new HomingShot(game, this, player, enemies);
    // Đạn rocket nổ khi chạm
    this._rocketLauncher = new RocketLauncher(game, this, player, enemies);
    // Đạn lửa 
    this._flamethrower = new Flamethrower(game, this, player, enemies);

    // Quản lý tiếng súng
    this._emptyAmmoSound = game.globals.soundManager.add("fx/empty-ammo-dry-fire", null, 0.5);
    this._allowEmptyAmmoSound = true;

    // Quản lý cooldown time cho lần bắn đạn tiếp theo 
    /**
    * A reference to the game clock and timed events system.
    * time: Phaser.Time;
    */

    this._emptyAmmoCooldownTimer = game.time.create(false);
    this._emptyAmmoCooldownTimer.start();

    const x = this._player.position.x;
    const y = this._player.position.y;
    /**
    * A reference to the seeded and repeatable random data generator.
    * rnd: Phaser.RandomDataGenerator;
    */

    const randomWeaponType = game.rnd.pick(Object.values(WEAPON_TYPES));
    this._mountedGun = new MountedGun(game, x, y, this, player, randomWeaponType);

    this.switchWeapon(randomWeaponType);
  }

  /**
   * Lấy ra vũ khí đang active hoạt động 
   */
  getActiveWeapon() {
    return this._activeWeapon;
  }

  /**
   * Lấy ra loại của vũ khí đang active 
   */
  getActiveType() {
    return this._activeWeapon._type;
  }

  /**
   * Check xem có thể bắn đạn được không 
   */
  isAbleToAttack() {
    if (this._activeWeapon && this._activeWeapon.isAbleToAttack()) return true;
    return false;
  }

  /**
   * Đổi sang loại vũ khí mới - đồng thời nạp đạn luôn cho vũ khí mới 
   * @param {Loại vũ khí} type 
   */
  switchWeapon(type) {
    if (type === WEAPON_TYPES.RAPID_FIRE) this._activeWeapon = this._rapidFire;
    else if (type === WEAPON_TYPES.SCATTERSHOT) this._activeWeapon = this._scattershot;
    else if (type === WEAPON_TYPES.PIERCING_SHOT) this._activeWeapon = this._piercingShot;
    else if (type === WEAPON_TYPES.BOUNCING) this._activeWeapon = this._bouncingShot;
    else if (type === WEAPON_TYPES.HOMING_SHOT) this._activeWeapon = this._homingShot;
    else if (type === WEAPON_TYPES.ROCKET_LAUNCHER) this._activeWeapon = this._rocketLauncher;
    else if (type === WEAPON_TYPES.FLAMETHROWER) this._activeWeapon = this._flamethrower;
    // New weapons should start with full ammo.
    this._activeWeapon.fillAmmo();

    this._mountedGun.destroy();
    this._mountedGun = null;
    const x = this._player.position.x;
    const y = this._player.position.y;
    this._mountedGun = new MountedGun(this._game, x, y, this, this._player, type);
    this._mountedGun.visible = false;
  }

  /**
   * Bắn đạn 
   * @param {góc bắn} angle 
   */
  fire(angle = 0) {
    if (this.isAbleToAttack()) {
      // Nếu còn đạn thì bắn 
      // Việc bắn đạn chi tiết thế nào thì delegate xuống bản implementation của weapon xử lý chi tiết 
      this._activeWeapon.fire(angle);
    } else if (this.getActiveWeapon().isAmmoEmpty()) {
      // Nếu hết đạn thì báo hết đạn 
      this.outOfAmmo();
    }
  }

  outOfAmmo(time = 500) {
    // Bật sound của hết đạn, sau mỗi khoảng thời gian 
    if (!this._allowEmptyAmmoSound) return;
    this._allowEmptyAmmoSound = false;
    this._emptyAmmoSound.play();
    this._emptyAmmoCooldownTimer.add(time, () => (this._allowEmptyAmmoSound = true), this);
  }

  destroy(...args) {
    // destroy the weapons.
    this._scattershot.destroy();
    this._rapidFire.destroy();
    this._piercingShot.destroy();
    this._bouncingShot.destroy();
    this._homingShot.destroy();
    this._rocketLauncher.destroy();
    this._flamethrower.destroy();

    // destroy the rest of the crap.
    this._mountedGun.destroy();
    this._mountedGun = null;
    this._emptyAmmoCooldownTimer.destroy();
    super.destroy(...args);
  }
}
