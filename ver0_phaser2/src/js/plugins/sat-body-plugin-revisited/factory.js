import Body from "./body";
import Collider from "./collider";
import BODY_TYPES from "./body-types";

/**
 * Class Factory đi kèm với với World 
 * Xử lý đưa ra các body và staticBody
 * Đưa gameObject, logic collider, overlap vào World  
 */
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

  staticBody(options = {}) {
    options.bodyType = BODY_TYPES.STATIC;
    const body = new Body(this.world, options);
    this.world.add(body);
    return body;
  }

  /**
   * 
   * @param {đối tượng trong game} gameObject 
   * @param {*} options 
   */
  gameObject(gameObject, options = {}) {
    options.gameObject = gameObject;
    // Đưa gameObject vào physics-world --> Tạo ra physics-body tương ứng 
    const body = new Body(this.world, options);
    this.world.add(body);
    return body;
  }

  /**
   * Đưa collider vào world 
   * @param {đối tượng 1} object1 
   * @param {đối tượng 2} object2 
   * @param {các loại option xử lý} options 
   */
  collider(object1, object2, options) {
    const collider = new Collider(this.world, object1, object2, options);
    this.world.addCollider(collider);
    return collider;
  }

  /**
   * Đưa logic thực hiện 2 object1 và object2 overlap vào world
   * @param {đối tượng 1} object1 
   * @param {đối tượng 2} object2 
   * @param {nội dung hàm thực hiện khi xảy ra overlap giữa đối tượng 1 và đối tượng 2} options 
   */
  overlap(object1, object2, options = {}) {
    options.separate = false;
    return this.collider(object1, object2, options);
  }
}
