/**
 * Collider là một đối tượng logic có trách nhiệm theo dõi sự va chạm giữa 2 đối tượng 
 * Nếu khi 2 đối tượng xảy ra va chạm thì sẽ thực hiện theo logic ở options
 * Options bao gồm 
 * - onColide: hàm thực hiện logic khi va chạm - ví dụ trừ health
 * - context: là ngữ cảnh thực hiện khi va chạm - chưa rõ cách dùng
 * - separate: là biến đánh dấu việc va chạm này có cho phép 2 đối tượng tiếp tục trùng nhau 
 * hay phải rời nhau ra 
 * ví dụ giữa player và enemy thì separate = false - nghĩa là overlap vào nhau vẫn ok 
 * còn giữa player với wall thì separate = true - nghĩa là user ko được đi xuyên tường 
 */
export default class Collider {
  // Options: onCollide, context, separate
  constructor(world, object1, object2, options) {
    this.world = world;

    this.object1 = object1;
    this.object2 = object2;
    this.options = options;
  }

  update() {
    this.world.collide(this.object1, this.object2, this.options);
  }

  destroy() {
    this.world.removeCollider(this);
  }
}
