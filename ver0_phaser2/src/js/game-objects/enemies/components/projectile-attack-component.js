import EnemyProjectile from "../enemy-projectile";

/**
 * Component cho loại enemy có khả năng bắn đạn 
 */
export default class ProjectileAttackComponent {
  constructor(parent, targetingComponent) {
    // Parent chính là enemy - game chính là đối tượng game chính 
    this.game = parent.game;
    this.parent = parent;
    // Tạo ra projectileGroup - là tập hợp đạn của enemy này 
    // Đưa vào midground-group của game 
    this.projectileGroup = this.game.add.group(this.game.globals.groups.midground);
    // đưa targeting-component của enemy thành targeting-component của đạn 
    this._targetingComponent = targetingComponent;
    this._difficultyModifier = this.game.globals.difficultyModifier;

    // Sound khi bắn đạn 
    this._fireSound = this.game.globals.soundManager.add("fx/enemy-shoot", null, 1);

    // Lấy ra bộ timer từ game.time 
    this._timer = this.game.time.create(false);
    // Start bộ timer 
    this._timer.start();
    // Tần suất bắn đạn 1s
    this._fireDelay = 1000;
    // Có thể bắn 
    this._canFire = true;

    // Có ở trong light không 
    this._isInLight = false;
    // Khi nào đi vào vùng light 
    this._enteredLightAt = 0;
  }

  /**
   * Kiểm tra xem enemy có ở trong vùng sáng trong 1 khoảng thời gian lớn hơn duration không 
   * Check if the parent has been in the light for the specified duration
   * @param {number} duration Time in ms
   */
  hasBeenInLightFor(duration) {
    // Player chính là target của targeting-component 
    const player = this._targetingComponent.target;
    const wasInLight = this._isInLight;
    // Kiểm tra có trong vùng sáng hay không 
    // Do chính player là nguồn sáng 
    this._isInLight = !player._playerLight.isPointInShadow(this.parent.position);
    // Nếu đi vào vùng sáng và trước đó chưa ở trong vùng sáng 
    // thì có nghĩa là đã đi vào vùng sáng tại thời điểm hiện tại 
    if (this._isInLight && !wasInLight) 
      this._enteredLightAt = this._timer.ms;
    
    // Kiểm tra xem user có ở trong vùng sáng 1 khoảng thời gian lớn hơn duration không 
    return this._isInLight && this._timer.ms - this._enteredLightAt > duration;
  }

  /**
   * Cập nhật cho component này 
   */
  update() {
    // Lấy ra đối tượng palyer 
    const player = this._targetingComponent.target;
    // Nếu đã không ở vùng sáng hơn 250ms thì việc targeting trở nên active 
    if (!this.hasBeenInLightFor(250)) {
      this._targetingComponent.isActive = true;
      return;
    }

    // Nếu ở trong vùng sáng hơn 250ms thì việc targeting trở nên không active 
    // Nghĩa là không cần thiết phải tiến sát và truy đuổi player nữa 
    this._targetingComponent.isActive = false;
    if (this._canFire) {
      // Góc bắn 
      const angle = this.parent.position.angle(player.position);
      // Lấy ra các thành phần game, enemy, projectile 
      const { game, parent, projectileGroup } = this;
      // Tốc độ đạn tính từ difficulty-modifier 
      const speed = 300 * this._difficultyModifier.getSpeedMultiplier();
      // Play tiếng bắn đạn 
      this._fireSound.play();
      // Tạo ra đạn của enemy với game, parent, group, player, góc, tốc độ 
      new EnemyProjectile(game, parent.x, parent.y, projectileGroup, player, angle, speed);
      // Ko thể bắn trong 1 khoảng time 
      this._canFire = false;
      // Sau khoảng fireDelay thì cho bắn lại 
      this._timer.add(this._fireDelay, () => {
        this._canFire = true;
      });
    }
  }

  destroy() {
    this._timer.destroy();
  }
}
