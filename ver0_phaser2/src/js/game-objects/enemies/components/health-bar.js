/**
 * Thanh health hiển thị cho đối tượng trong game 
 */
export default class HealthBar extends Phaser.Group {
  constructor(game, sprite, parentGroup, cx, cy, width, height) {
    /**
    * A Group is a container for {@link DisplayObject display objects} including {@link Phaser.Sprite Sprites} and {@link Phaser.Image Images}.
    * 
    * Groups form the logical tree structure of the display/scene graph where local transformations are applied to children.
    * For instance, all children are also moved/rotated/scaled when the group is moved/rotated/scaled.
    * 
    * In addition, Groups provides support for fast pooling and object recycling.
    * 
    * Groups are also display objects and can be nested as children within other Groups.
    * 
    * @param game A reference to the currently running game.
    * @param parent The parent Group (or other {@link DisplayObject}) that this group will be added to.
    *               If undefined/unspecified the Group will be added to the {@link Phaser.Game#world Game World}; 
    * if null the Group will not be added to any parent. - Default: (game world)
    * @param name A name for this group. Not used internally but useful for debugging. - Default: 'group'
    * @param addToStage If true this group will be added directly to the Game.Stage instead of Game.World.
    * @param enableBody If true all Sprites created with {@link #create} or {@link #createMulitple} will have a physics body created on them. 
    * Change the body type with {@link #physicsBodyType}.
    * @param physicsBodyType The physics body type to use when physics bodies are automatically added. 
    * See {@link #physicsBodyType} for values.
    constructor(game: Phaser.Game, 
      parent?: PIXI.DisplayObjectContainer, 
      name?: string, 
      addToStage?: boolean, 
      enableBody?: boolean, 
      physicsBodyType?: number);

    */

    super(game, parentGroup, "health-bar");
    this.position.set(cx, cy);

    // Đây là sprite của game-object gốc cần thể hiện health-bar 
    this._sprite = sprite;
    this._barColor = 0xfe4b42;
    this._bgColor = 0x000;
    this._cx = cx;
    this._cy = cy;
    this._w = width;
    this._h = height;

    this._tween = null;
    this._health = null;
    this._maxHealth = null;

    // Center the health bar graphics within the group
    /**
    Reference to the GameObject Creator.
    make: Phaser.GameObjectCreator;
    * The GameObjectCreator is a quick way to create common game objects 
    _without_ adding them to the game world.
    * The object creator can be accessed with {@linkcode Phaser.Game#make `game.make`}.

    * Creates a new Graphics object.
    * 
    * @param x X position of the new graphics object.
    * @param y Y position of the new graphics object.
    * @return The newly created graphics object.
    graphics(x?: number, y?: number): Phaser.Graphics;
    * A Graphics object is a way to draw primitives to your game. 
    Primitives include forms of geometry, such as Rectangles, Circles and Polygons. 
    They also include lines, arcs and curves. 
    When you initially create a Graphics object it will be empty. 
    To 'draw' to it you first specify a lineStyle or fillStyle (or both), 
    and then draw a shape. For example:
    * ```javascript
    * graphics.beginFill(0xff0000);
    * graphics.drawCircle(50, 50, 100);
    * graphics.endFill();
    * `
    * 
    */
    this._healthBar = game.make.graphics(-width / 2, -height / 2);
    this.add(this._healthBar);

    // Hide by default, only show when damage is taken
    this.hide();
  }

  /**
   * Khởi tạo health
   * @param {*} maxHealth 
   * @param {*} currentHealth 
   */
  initHealth(maxHealth = 100, currentHealth = null) {
    this._maxHealth = maxHealth;
    this._health = currentHealth === null ? maxHealth : currentHealth;
    this._redraw();
  }

  /**
   * Tăng health 
   * @param {*} increment 
   */
  incrementHealth(increment) {
    this._health += increment;
    this._redraw();
    this.show();
    this._scheduleFadeOut();
    return this._health;
  }

  /**
   * Hiển thị - bình thường ẩn đi 
   */
  show() {
    this.alpha = 1;
    this.visible = true;
  }

  /**
   * Ẩn đi 
   */
  hide() {
    this.visible = false;
  }

  /**
   * Cập nhật vị trí - tương ứng theo sprite 
   */
  updatePosition() {
    // Reposition the group relative to its sprite
    this.position.set(this._sprite.x + this._cx, this._sprite.y + this._cy);
  }

  destroy(...args) {
    if (this._tween) this._tween.stop();
    super.destroy(...args);
  }

  /**
   * Lập lịch fade-out mờ dần đi 
   */
  _scheduleFadeOut() {
    // Cancel previous animation
    if (this._tween) this._tween.stop();

    // Create a fade out tween after a delay
    this._tween = this.game.make.tween(this).to({ alpha: 0 }, 1000, "Quad.easeInOut", true, 500);
    this._tween.onComplete.add(this.hide.bind(this));
  }

  /**
   * Vẽ lại 
   */
  _redraw() {
    // Reset
    this._healthBar.clear();
    this._healthBar.lineStyle(0);

    // Draw background of bar
    this._healthBar.beginFill(this._bgColor);
    this._healthBar.drawRect(0, 0, this._w, this._h);

    // Draw bar
    const fraction = Math.max(this._health, 0) / this._maxHealth;
    this._healthBar.beginFill(this._barColor);
    this._healthBar.drawRect(0, 0, this._w * fraction, this._h);
  }
}
