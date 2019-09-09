import { getFormattedType } from "./weapon-types";
// import MountedGun from "./mounted-gun";

/**
 * Là class base chứa thông tin chung cho các loại weapon chi tiết 
 */
export default class BaseWeapon extends Phaser.Group {
  constructor(game, parentGroup, player, enemies, weaponType, totalAmmo, cooldownTime, reloadTime) {
    /**
    * A Group is a container for {@link DisplayObject display objects} including {@link Phaser.Sprite Sprites} and {@link Phaser.Image Images}.
    * 
    * Groups form the logical tree structure of the display/scene graph where local transformations are applied to children.
    * For instance, all children are also moved/rotated/scaled when the group is moved/rotated/scaled.
    * 
    * In addition, Groups provides support for fast pooling and object recycling.
    * 
    * Groups are also display objects and can be nested as children within other Groups.
    * @param game A reference to the currently running game.
    * @param parent The parent Group (or other {@link DisplayObject}) that this group will be added to.
    *               If undefined/unspecified the Group will be added to the {@link Phaser.Game#world Game World}; if null the Group will not be added to any parent. - Default: (game world)
    * @param name A name for this group. Not used internally but useful for debugging. - Default: 'group'
    * @param addToStage If true this group will be added directly to the Game.Stage instead of Game.World.
    * @param enableBody If true all Sprites created with {@link #create} or {@link #createMulitple} will have a physics body created on them. Change the body type with {@link #physicsBodyType}.
    * @param physicsBodyType The physics body type to use when physics bodies are automatically added. See {@link #physicsBodyType} for values.
  
    */
    super(game, parentGroup, weaponType);

    // Kiểu vũ khí 
    this._type = weaponType;
    // Tham chiếu đến player 
    this._player = player;
    // Tham chiếu đến enemies 
    this._enemies = enemies;
    // Check có tấn công được không 
    this._ableToAttack = true;
    // Tổng lượng đạn có thể 
    this._totalAmmo = totalAmmo;
    // Tổng đạn hiện tại 
    this._currentAmmo = totalAmmo;
    // Thời gian cooldown để bắn lần tiếp 
    this._cooldownTime = cooldownTime;
    // Thời gian reload 
    this._reloadTime = reloadTime;
    // Có đang reload hay không 
    this._isReloading = false;

    // Bộ đếm thời gian cooldown
    this._cooldownTimer = this.game.time.create(false);
    // Start việc đếm cooldown 
    this._cooldownTimer.start();
  }

  /**
   * Có đang reload 
   */
  isReloading() {
    return this._isReloading;
  }

  /**
   * Lượng đạn lớn nhất 
   */
  getMaxAmmo() {
    return this._totalAmmo;
  }

  /**
   * Tên loại vũ khí 
   */
  getName() {
    return getFormattedType(this._type);
  }

  /**
   * Có thể tấn công không 
   */
  isAbleToAttack() {
    return this._ableToAttack && !this.isAmmoEmpty();
  }

  /**
   * Nạp đạn 
   */
  _reload() {
    // Nếu không thể tấn công thì không cho nạp đạn 
    if (!this._ableToAttack) return;
    // Đang ở trạng thái reload 
    this._isReloading = true;
    // Không thể tấn công 
    this._ableToAttack = false;
    // TODO(rex): Reload animation for the weapon. 
    // Cần bổ sung animation nạp đạn
    // Thời gian cooldown cho đến khi nạp đạn xong thì mới thực sự hoạt động 
    this._cooldownTimer.add(this._reloadTime, () => {
      // Làm đầy đạn
      this.fillAmmo();
      // Có thể tấn công 
      this._ableToAttack = true;
      // Không đang trong trạng thái nạp đạn 
      this._isReloading = false;
    });
  }

  /**
   * bắt đầu việc cooldown - để bắn đạn lần tiếp theo 
   * @param {thời gian cooldown} time 
   */
  _startCooldown(time) {
    if (!this._ableToAttack) return;
    this._ableToAttack = false;
    this._cooldownTimer.add(time, () => (this._ableToAttack = true), this);
  }

  /**
   * Tăng lượng đạn hiện tại lên 
   * @param {lượng đạn} amt 
   */
  incrementAmmo(amt) {
    this._currentAmmo += amt;
    if (this._currentAmmo > this._totalAmmo) this._currentAmmo = this._totalAmmo;
    if (this._currentAmmo < 0) this._currentAmmo = 0;
  }

  /**
   * lấy ra lượng đạn hiện tại 
   */
  getAmmo() {
    return this._currentAmmo;
  }

  /**
   * nạp đầy đạn 
   */
  fillAmmo() {
    this._currentAmmo = this._totalAmmo;
  }

  /**
   * Xóa toàn bộ đạn 
   */
  emptyAmmo() {
    this._currentAmmo = 0;
  }

  /**
   * Kiểm tra không có đạn 
   */
  isAmmoEmpty() {
    return this._currentAmmo <= 0;
  }

  /**
   * Lấy loại vũ khí 
   */
  getType() {
    return this._type;
  }

  destroy(...args) {
    this._cooldownTimer.destroy();
    super.destroy(...args);
  }
}
