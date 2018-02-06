import Body from "./body";
import Collider from "./collider";

export default class Factory {
  constructor(world) {
    this.game = world.game;
    this.world = world;
  }

  body(options) {
    const body = new Body(this.world, options);
    this.world.add(body);
    return body;
  }

  collider(object1, object2, options) {
    const collider = new Collider(this.world, object1, object2, options);
    this.world.addCollider(collider);
    return collider;
  }
}
