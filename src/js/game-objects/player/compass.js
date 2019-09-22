import Color from "../../helpers/color";

/**
 * Trong game này thì cơ chế là user được phủ bởi 1 vùng light tròn 
 * Nếu bị tường chắn thì light ko đi qua 
 * Ở những vùng tối thì sẽ có dấu hiệu compass - chỉ ra phía nào có đạn và phía nào có enemy 
 * Compass này chỉ ra enemy ở phía nào - còn đạn thì chắc xử lý ở chỗ khác 
 */
export default class Compass extends Phaser.Image {
  constructor(game, parent, radius, offset = Math.PI / 2) {
    super(game, 0, 0, "assets", "hud/targeting-arrow");

    this.scale.setTo(0.56, 0.56);
    this.tint = Color.black().getRgbColorInt();
    this.anchor.set(0.5);
    parent.add(this);

    this._radius = radius;
    this._offset = offset;
  }

  repositionAt(center, angle) {
    this.position.x = center.x + this._radius * Math.cos(angle - this._offset);
    this.position.y = center.y + this._radius * Math.sin(angle - this._offset);
    this.rotation = angle;
  }
}
