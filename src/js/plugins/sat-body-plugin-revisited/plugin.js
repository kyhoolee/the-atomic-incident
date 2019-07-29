import World from "./world";
import Factory from "./factory";
import namespace from "./namespace";

export default class SatBodyPlugin extends Phaser.Plugin {
  constructor(game, pluginManager) {
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

  preUpdate() {
    this.world.preUpdate();
  }

  update() {
    this.world.update();
  }

  postUpdate() {
    this.world.postUpdate();
  }

  destroy() {
    this.world.destroy();
  }
}
