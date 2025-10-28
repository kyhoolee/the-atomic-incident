import World from "./world";
import Factory from "./factory";
import namespace from "./namespace";

/**
 * Đây là plugin về quản lý các object trong game có va chạm với nhau hay không theo thuật toán SAT 
 * SAT - The Separating Axis Theorem, SAT for short, is a method to determine if two convex shapes are intersecting
 * Tham khảo - http://www.dyn4j.org/2010/01/sat/
 */
export default class SatBodyPlugin extends Phaser.Plugin {
  /**
   * Hàm khởi tạo cơ bản của SATBodyPlugin
   * @param {đối tượng game} game 
   * @param {đối tượng quản lý chung các plugin} pluginManager 
   */
  constructor(game, pluginManager) {
    /**
     * /**
        * This is a base Plugin template to use for any Phaser plugin development.
        * 
        * ##### Callbacks
        * 
        * add  | active      | visible     | remove
        * -----|-------------|-------------|--------
        * init |             |             |
        *      | preUpdate*  |             |
        *      | update*     | render*     |
        *      | postUpdate* | postRender* |
        *      |             |             | destroy
        * 
        * Update and render calls are repeated (*).
        * 
        * @param game A reference to the currently running game.
        * @param parent The object that owns this plugin, usually Phaser.PluginManager.
        *
       constructor(game: Phaser.Game, parent: Phaser.PluginManager);
     */
    super(game, pluginManager);
    this.game = game;
    this.pluginManager = pluginManager;
  }

  init(options) {
    // TODO: use options to configure the world
    // World: chưa các thông tin object dưới dạng quan tâm về mặt vật lý để kiểm tra va chạm 
    // Trong code này sử dụng r-tree + sat để kiểm tra va chạm 
    this.world = new World(this.game, this);
    // Factory: là factory sinh ra các đối tượng cần thiết: 
    // từ physic body đến game object mà World có thể kiểm tra va chạm
    this.factory = new Factory(this.world);

    // TODO: Finish injecting into the Physics stucture. We don't necessarily need to hook into it,
    // since all the world update calls are invoked by the plugin and body update calls are invoked
    // by sprites

    // Give the physics system a unique ID - used by Phaser.Physics methods
    const largestId = Object.keys(Phaser.Physics).reduce((largestId, key) => {
      const id = Phaser.Physics[key];
      return Number.isInteger(id) ? Math.max(largestId, id) : largestId;
    }, 0);
    Phaser.Physics.SAT = largestId + 1;

    // Expose classes and consts via namespace
    Phaser.Physics.Sat = namespace;

    // Inject the runtime game props
    this.game.physics.sat = {
      add: this.factory,
      world: this.world
    };
  }

  /**
   * Hàm chuẩn bị trước khi update các chuyển động của các đối tượng 
   */
  preUpdate() {
    this.world.preUpdate();
  }

  /**
   * Thực hiện update chuyển động và thông báo các va chạm 
   */
  update() {
    this.world.update();
  }

  /**
   * Sau khi update chuyển động và thông báo va chạm 
   */
  postUpdate() {
    this.world.postUpdate();
  }

  /**
   * Xóa đối tượng 
   */
  destroy() {
    this.world.destroy();
  }
}
