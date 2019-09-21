// RBush is a high-performance JavaScript library for 2D spatial indexing of points and rectangles. 
// It's based on an optimized R-tree data structure with bulk insertion support
// là thư viện hỗ trợ dạng 2-D tree để truy vấn nhanh near points dựa theo 2-d location 
import rbush from "rbush";
import BODY_SHAPES from "./body-shapes";
import BODY_TYPES from "./body-types";

//https://www.npmjs.com/package/sat - là thư viện javascript implement các logic của separate axis theorem
import SAT from "sat";
import Body from "./body";
import logger from "../../helpers/logger";

// viết tắt cho phaser-point
const P = Phaser.Point;
// viết tắt cho SAT.Response()
/**
var V = SAT.Vector;
var C = SAT.Circle;
 
var circle1 = new C(new V(0,0), 20);
var circle2 = new C(new V(30,0), 20);
var response = new SAT.Response();
var collided = SAT.testCircleCircle(circle1, circle2, response);
 
// collided => true
// response.overlap => 10
// response.overlapV => (10, 0)

SAT.Response
This is the object representing the result of a collision between two objects. 
It just has a simple new Response() constructor.
--> Đây là đối tượng rất quan trọng - chứa thông tin về kết quả va chạm iuwax 2 đối tượng 
It has the following properties:

a - The first object in the collision.
b - The second object in the collison.
overlap - Magnitude of the overlap on the shortest colliding axis.
overlapN - The shortest colliding axis (unit-vector)
overlapV - The overlap vector (i.e. overlapN.scale(overlap, overlap)). If this vector is subtracted from the position of a, a and b will no longer be colliding.
aInB - Whether the first object is completely inside the second.
bInA - Whether the second object is completely inside the first.
 */
const globalResponse = new SAT.Response();
const globalTreeSearch = { minX: 0, minY: 0, maxX: 0, maxY: 0 };
const reverseCallback = (cb, context) => {
  if (!cb) return null;
  else return (arg1, arg2) => cb.call(context, arg2, arg1);
};

/**
 * Đối tượng World - ở đây là 2-d world chứa tất cả các đối tượng quan tâm chính vào 2d-position 
 * World xử lý tất cả các nguyên tắc vật lý cho các Body được đưa vào world 
 * Các sự thay đổi về tính chất vật lý: gia tốc, vận tốc, vị trí hoàn toàn được xử lý ở đây 
 * Các đối tượng có 2 loại tương tác: collide - va chạm, overlap - xuyên qua 
 * Khi phát sinh collide hay overlap thì ngoài việc xử lý theo tính chất vật lý thì đồng thời cũng gọi xử lý các logic đính kèm 
 * 
 * Các nội dung trong Sat-body-plugin này - cụ thể chính xác là đối tượng World được implement đầy đủ về physics
 * Có thể tách ra thành 1 phần core riêng cho nhiều game khác 
 * Tách biệt tương đối ??? so với Phaser-game - Không sử dụng thư viện Physics nào của Phaser 
 * Có thể học tập theo để hệ thống hóa lại game AgarIO-clone 
 */
export default class World {
  /**
   *
   * @param {Trỏ ngược lại về đối tượng Game - Phaser.Game} game
   * @param {Trỏ ngược lại về SatBodyPlugin - là một plugin của Phaser} satPlugin
   */
  constructor(game, satPlugin) {
    this.game = game;
    this.satPlugin = satPlugin;

    this.drawDebug = false;
    this.debugGraphics = null;

    // Danh sách các Body được xử lý tính chất vật lý - nằm trong World 
    this.bodies = [];
    // Danh sách các listener cần thực hiện mỗi khi xảy ra collide 
    this.colliders = [];

    // Là 1 set chứa danh sách các Body 
    this.bodies = new Set();
    // Cũng là 1 set chứa danh sách các Body
    this.staticBodies = new Set();

    // Trọng trường - mặc định là 0,0 - tức là không bị kéo về hướng nào 
    this.gravity = new P(0, 0);

    this.maxEntries = 16;
    // RBush — a high-performance JavaScript R-tree-based 2D spatial index for points and rectangles
    // Tree để lưu các dynamics body 
    this.tree = new rbush(this.maxEntries, [".left", ".top", ".right", ".bottom"]);
    // Và Tree để lưu static body 
    this.staticTree = new rbush(this.maxEntries, [".left", ".top", ".right", ".bottom"]);

    // TODO:
    // - Support static bodies. Right now there is a tree, but it is never searched.
    // - Add overlap only functionality. Right now everything collides.
    // - Add sensors
    // - Allow for colliding arrays

    // Helpful references:
    // https://www.toptal.com/game/video-game-physics-part-i-an-introduction-to-rigid-body-dynamics
    // https://gamedevelopment.tutsplus.com/tutorials/how-to-create-a-custom-2d-physics-engine-oriented-rigid-bodies--gamedev-8032
  }

  // NOOP methods, to be implemented later:
  enable() { }
  disable() { }
  pause() { }
  resume() { }
  addOverlap() { }

  /**
   * Đưa thêm 1 body vào world để kiểm tra chuyển động + va chạm 
   * mặc định là body kiểu dynamics --> chắc là dành cho gameobject
   * @param {Đối tượng body đưa vào world} body 
   */
  add(body) {
    // thêm đối tượng static 
    if (body.bodyType === BODY_TYPES.STATIC) this.staticBodies.add(body);
    // thêm đối tượng dynamic 
    else if (body.bodyType === BODY_TYPES.DYNAMIC) this.bodies.add(body);
    return this;
  }

  /**
   * Xóa đối tượng body khỏi world 
   * @param {Đối tượng body xóa khỏi world} body 
   */
  remove(body) {
    // xóa đối tượng static 
    if (body.bodyType === BODY_TYPES.STATIC) this.staticBodies.delete(body);
    // xóa đối tượng dynamic 
    else if (body.bodyType === BODY_TYPES.DYNAMIC) this.bodies.delete(body);
    return this;
  }

  /**
   * Collider là 1 đối tượng quản lý logic liên quan giữa va chạm của 2 đối tượng
   * Đưa đối tượng collider vào World để check xử lý 
   * @param {một collision-listener} collider 
   */
  addCollider(collider) {
    this.colliders.push(collider);
    return this;
  }

  /**
   * Xóa logic va chạm Collider ra khỏi World 
   * @param {??? một va chạm} collider 
   */
  removeCollider(collider) {
    this.colliders = this.colliders.filter(c => c !== collider);
    return this;
  }

  /**
   * Bật chế độ debug - chắc là đối tượng graphics sẽ vẽ đè một số thông tin cần thiết khi debug 
   * @param {Chắc là một đối tượng graphics} graphics 
   */
  enableDebug(graphics) {
    this.drawDebug = true;
    if (this.debugGraphics) {
      if (graphics) {
        this.debugGraphics.destroy();
        this.debugGraphics = graphics;
      } else {
        // Noop - we're all good to reuse this.debugGraphics
      }
    } else {
      this.debugGraphics = graphics ? graphics : this.game.add.graphics(0, 0);
    }
    return this;
  }

  /**
   * Tắt debug 
   */
  disableDebug() {
    this.drawDebug = false;
    if (this.debugGraphics) this.debugGraphics.destroy();
    return this;
  }

  /**
   * Giới hạn vùng không gian của world ???
   * @param {top-left} x 
   * @param {top-left} y 
   * @param {chiều rộng} width 
   * @param {chiều cao} height 
   * @param {độ dày ???} thickness 
   * @param {trái ?} left 
   * @param {phải ?} right 
   * @param {trên ?} top 
   * @param {dưới ?} bottom 
   */
  setBounds(
    x,
    y,
    width,
    height,
    thickness = 200,
    left = true,
    right = true,
    top = true,
    bottom = true
  ) {
    if (this.leftWall) this.leftWall.destroy();
    if (this.rightWall) this.rightWall.destroy();
    if (this.topWall) this.topWall.destroy();
    if (this.bottomWall) this.bottomWall.destroy();

    /* 
    Tạo các loại tường-wall tương ứng 
    - do nếu đi đến giới hạn của logic map thì phía physic-wall cũng phải xuất hiện 
    */
    if (left) {
      // Tạo tường trái với độ dày thickness 
      this.leftWall = new Body(this, { bodyType: BODY_TYPES.STATIC }) // tạo ra đối tượng Body kiểu static 
        .setRectangle(thickness, height + 2 * thickness) // có hình dạng là hình chữ nhật 
        .setPosition(x - thickness, y - thickness); // có vị trí là x-thickness và y-thickness 
      this.add(this.leftWall);
    }
    if (right) {
      // Tạo tường phải 
      this.rightWall = new Body(this, { bodyType: BODY_TYPES.STATIC })
        .setRectangle(thickness, height + 2 * thickness)
        .setPosition(x + width, y - thickness);
      this.add(this.rightWall);
    }
    if (top) {
      // Tạo tường trên 
      this.topWall = new Body(this, { bodyType: BODY_TYPES.STATIC })
        .setRectangle(width + 2 * thickness, thickness)
        .setPosition(x - thickness, y - thickness);
      this.add(this.topWall);
    }
    if (bottom) {
      // Tạo tường dưới ??? 
      this.bottomWall = new Body(this, { bodyType: BODY_TYPES.STATIC })
        .setRectangle(width + 2 * thickness, thickness)
        .setPosition(x - thickness, y + height);
      this.add(this.bottomWall);
    }
  }

  /**
   * Chuẩn bị trước khi update 
   */
  preUpdate() {
    // Only preUpdate bodies without GOs, since v2 Phaser sprites automatically call preUpdate
    this.bodies.forEach(body => {
      if (!body.gameObject) body.preUpdate();
    });
    this.staticBodies.forEach(body => {
      if (!body.gameObject) body.preUpdate();
    });

    if (this.bodies.size === 0) return;

    // Reload the tree with all the enabled bodies
    const enabledBodies = [];
    for (const body of this.bodies) if (body.enabled) enabledBodies.push(body);
    this.tree.clear();
    /*
    Bulk-Inserting Data
    Bulk-insert the given data into the tree:
    tree.load([item1, item2, ...]);
    */
    this.tree.load(enabledBodies);
  }

  /**
   * Update - cập nhật tất cả các collider ???
   */
  update() {
    this.colliders.forEach(collider => collider.update());
  }

  /**
   * Sau khi update xong 
   */
  postUpdate() {
    // Only postUpdate bodies without GOs, since v2 Phaser sprites automatically call postUpdate
    this.bodies.forEach(body => {
      if (!body.gameObject) body.postUpdate();
    });

    this.staticBodies.forEach(body => {
      if (!body.gameObject) body.postUpdate();
    });

    if (this.drawDebug) this.debugDraw(this.debugGraphics);
  }

  /**
   * Debug vấn đề vẽ 
   * @param {*} graphics 
   */
  debugDraw(graphics) {
    graphics.clear();
    this.staticBodies.forEach(body => body.drawDebug(graphics));
    this.bodies.forEach(body => body.drawDebug(graphics));
  }

  /**
   * Kiểm tra 2 object có overlap 
   * @param {*} object1 
   * @param {*} object2 
   * @param {*} options 
   */
  overlap(object1, object2, options = {}) {
    options.separate = false;
    return this.collide(object1, object2, options);
  }

  // Sprite|Body|Group|TilemapLayer vs Sprite|Body|Group|TilemapLayer
  // Options: onCollide, context, separateBodies
  /**
   * Kiểm tra 2 object có collide
   * @param {*} object1 
   * @param {*} object2 
   * @param {*} param2 
   */
  collide(object1, object2, { onCollide, context, separate = true } = {}) {
    const object1IsObject = object1.isSatBody || object1.physicsType === Phaser.SPRITE;
    const object2IsObject = object2.isSatBody || object2.physicsType === Phaser.SPRITE;

    if (object1IsObject) {
      if (object2IsObject) {
        return this.collideObjectVsObject(object1, object2, onCollide, context, separate);
      } else if (object2.physicsType === Phaser.GROUP) {
        return this.collideObjectVsGroup(object1, object2, onCollide, context, separate);
      } else if (object2.physicsType === Phaser.TILEMAPLAYER) {
        return this.collideObjectVsTilemapLayer(object1, object2, onCollide, context, separate);
      }
    } else if (object1.physicsType === Phaser.GROUP) {
      if (object2IsObject) {
        const _onCollide = reverseCallback(onCollide, context);
        return this.collideObjectVsGroup(object2, object1, _onCollide, context, separate);
      } else if (object2.physicsType === Phaser.GROUP) {
        logger.warn("Colliding group vs group is not supported yet!");
      } else if (object2.physicsType === Phaser.TILEMAPLAYER) {
        return this.collideGroupVsTilemapLayer(object1, object2, onCollide, context, separate);
      }
    } else if (object1.physicsType === Phaser.TILEMAPLAYER) {
      if (object2IsObject) {
        const _onCollide = reverseCallback(onCollide, context);
        return this.collideObjectVsTilemapLayer(object2, object1, _onCollide, context, separate);
      } else if (object2.physicsType === Phaser.GROUP) {
        const _onCollide = reverseCallback(onCollide, context);
        return this.collideGroupVsTilemapLayer(object2, object1, _onCollide, context, separate);
      } else if (object2.physicsType === Phaser.TILEMAPLAYER) {
        logger.warn("Colliding group vs tilemap layer is not supported!");
      }
    }

    return false;
  }

  // Body||Sprite vs Body||Sprite
  /**
   * Kiểm tra 2 object có collide 
   * @param {*} object1 
   * @param {*} object2 
   * @param {*} onCollide 
   * @param {*} context 
   * @param {*} separate 
   */
  collideObjectVsObject(object1, object2, onCollide, context, separate = true) {
    const body1 = object1.isSatBody ? object1 : object1.body;
    const body2 = object2.isSatBody ? object2 : object2.body;

    // Bodies may get destroyed by the user mid-collisions
    if (!body1 || !body2) return false;

    const collides = this.checkBodyCollide(body1, body2, globalResponse);
    if (collides) {
      if (separate) this.separateBodies(body1, body2, globalResponse);
      if (onCollide) onCollide.call(context, object1, object2);
    }
    return collides;
  }

  // Body||Sprite vs Group, careful this can be recursive if a group contains a group!
  collideObjectVsGroup(object, group, onCollide, context, separate = true) {
    if (group.length === 0) return false;

    const body1 = object.isSatBody ? object : object.body;

    // Bodies may get destroyed by the dev mid-collisions
    if (!body1) return false;

    globalTreeSearch.minX = body1.left;
    globalTreeSearch.minY = body1.top;
    globalTreeSearch.maxX = body1.right;
    globalTreeSearch.maxY = body1.bottom;

    const results = this.tree.search(globalTreeSearch);
    if (results.length === 0) return false;

    let collisionDetected = false;
    group.children.forEach(child => {
      if (child.physicsType === Phaser.GROUP) {
        return this.collideObjectVsGroup(object, child, onCollide, context, separate);
      }

      const body2 = child.body;
      if (!body2 || !body2.isSatBody || body1 === body2 || !results.includes(body2)) return;

      const collides = this.checkBodyCollide(body1, body2, globalResponse);
      if (collides) {
        collisionDetected = true;
        if (separate) this.separateBodies(body1, body2, globalResponse);
        if (onCollide) onCollide.call(context, object, child);
      }
    });

    return collisionDetected;
  }

  // Body||Sprite vs TilemapLayer
  /**
   * Thực hiện logic khi object collide với tilemap
   * Có thể logic về bouncing được xử lý ở đây - cho vật thể chuyển động bouncing khi xảy colliding
   */
  collideObjectVsTilemapLayer(object, tilemapLayer, onCollide, context, separate = true) {
    const body = object.isSatBody ? object : object.body;

    // Bodies may get destroyed by the dev mid-collisions
    if (!body) return false;

    const layerOffsetX = tilemapLayer.getTileOffsetX();
    const layerOffsetY = tilemapLayer.getTileOffsetY();
    const tiles = tilemapLayer.getTiles(
      body.left - layerOffsetX,
      body.top - layerOffsetY,
      body.width,
      body.height,
      true,
      false
    );

    if (tiles.length === 0) return false;

    const tileWidth = tilemapLayer.map.tileWidth;
    const tileHeight = tilemapLayer.map.tileHeight;

    const tileBody = new Body(this, { bodyType: BODY_TYPES.STATIC }).setRectangle(
      tileWidth,
      tileHeight
    );

    let collides = false;
    const allTiles = tilemapLayer.layer.data;
    let tileBodyX, tileBodyY, tileBodyWidth, tileBodyHeight;
    const spriteWidthInTiles = Math.ceil(body.width / tileWidth);
    const spriteHeightInTiles = Math.ceil(body.height / tileHeight);

    tiles.map(tile => {
      tileBodyX = layerOffsetX + tile.worldX;
      tileBodyY = layerOffsetY + tile.worldY;
      tileBodyWidth = tile.width;
      tileBodyHeight = tile.height;

      tileBody.setPosition(tileBodyX, tileBodyY);
      tileBody.setRectangle(tileBodyWidth, tileBodyHeight);

      if (this.checkBodyCollide(body, tileBody, globalResponse)) {
        collides = true;

        // Check if collision has already been resolved by a previous collision
        if (globalResponse.overlap === 0) return;

        const absOverlapX = Math.abs(globalResponse.overlapN.x);
        const absOverlapY = Math.abs(globalResponse.overlapN.y);
        let extended = false;

        // If there's any horizontal collision detected, attempt to extend the tile body left &
        // right to prevent a body from colliding with an internal edge within a wall.
        if (absOverlapX > 0) {
          let extendedTileBodyX = tileBodyX;
          let extendedTileBodyWidth = tileBodyWidth;
          for (let x = tile.x + 1; x <= tile.x + spriteWidthInTiles; x++) {
            if (allTiles[tile.y][x] && allTiles[tile.y][x].collides) {
              extendedTileBodyWidth += tile.width;
            } else {
              break;
            }
          }
          for (let x = tile.x - 1; x >= tile.x - spriteWidthInTiles; x--) {
            if (allTiles[tile.y][x] && allTiles[tile.y][x].collides) {
              extendedTileBodyX -= tile.width;
              extendedTileBodyWidth += tile.width;
            } else {
              break;
            }
          }

          if (extendedTileBodyWidth !== tileBodyWidth) {
            extended = true;
            tileBody.setPosition(extendedTileBodyX, tileBodyY);
            tileBody.setRectangle(extendedTileBodyWidth, tileBodyHeight);

            if (this.checkBodyCollide(body, tileBody, globalResponse)) {
              if (separate) this.separateBodiesDynamicVsStatic(body, tileBody, globalResponse);
              if (onCollide) onCollide.call(context, object, tile);
            }
          }
        }

        // Attempt the same tile extension up & down
        if (absOverlapY > 0) {
          let extendedTileBodyY = tileBodyY;
          let extendedTileBodyHeight = tileBodyHeight;
          for (let y = tile.y + 1; y <= tile.y + spriteHeightInTiles; y++) {
            if (allTiles[y][tile.x] && allTiles[y][tile.x].collides) {
              extendedTileBodyHeight += tile.height;
            } else {
              break;
            }
          }
          for (let y = tile.y - 1; y >= tile.y - spriteHeightInTiles; y--) {
            if (allTiles[y][tile.x] && allTiles[y][tile.x].collides) {
              extendedTileBodyY -= tile.height;
              extendedTileBodyHeight += tile.height;
            } else {
              break;
            }
          }

          if (extendedTileBodyHeight !== tileBodyHeight) {
            extended = true;
            tileBody.setPosition(tileBodyX, extendedTileBodyY);
            tileBody.setRectangle(tileBodyWidth, extendedTileBodyHeight);

            if (this.checkBodyCollide(body, tileBody, globalResponse)) {
              if (separate) this.separateBodiesDynamicVsStatic(body, tileBody, globalResponse);
              if (onCollide) onCollide.call(context, object, tile);
            }
          }
        }

        // If the extensions failed, fall back to separating against the original tile body (which
        // has not been modified if no extensions were made).
        if (!extended) {
          if (separate) this.separateBodiesDynamicVsStatic(body, tileBody, globalResponse);
          if (onCollide) onCollide.call(context, object, tile);
        }
      }
    });

    return collides;
  }

  /**
   * Kiểm tra group có collide với tilemap
   * @param {*} group 
   * @param {*} tilemapLayer 
   * @param {*} onCollide 
   * @param {*} context 
   * @param {*} separate 
   */
  collideGroupVsTilemapLayer(group, tilemapLayer, onCollide, context, separate = true) {
    let collides = false;
    group.children.forEach(child => {
      if (!child.body || !child.body.isSatBody) return;
      if (this.collideObjectVsTilemapLayer(child, tilemapLayer, onCollide, context, separate)) {
        collides = true;
      }
    });
    return collides;
  }

  /**
   * Kiểm tra 2 body có overlap 
   * @param {*} bodyA 
   * @param {*} bodyB 
   */
  checkBodyOverlap(bodyA, bodyB) {
    return this.checkBodyCollide(bodyA, bodyB, null);
  }

  /**
   * Kiểm tra 2 body có collide
   * Sử dụng SAT để kiểm tra collide giữa các loại body-shape 
   * @param {*} bodyA 
   * @param {*} bodyB 
   * @param {*} response 
   */
  checkBodyCollide(bodyA, bodyB, response = new SAT.Response()) {
    response.clear();

    const aIsCircle = bodyA.bodyShape === BODY_SHAPES.CIRCLE;
    const bIsCircle = bodyB.bodyShape === BODY_SHAPES.CIRCLE;
    let collides = false;

    if (aIsCircle && bIsCircle) {
      collides = SAT.testCircleCircle(bodyA.satBody, bodyB.satBody, response);
    } else if (!aIsCircle && bIsCircle) {
      collides = SAT.testPolygonCircle(bodyA.satBody, bodyB.satBody, response);
    } else if (aIsCircle && !bIsCircle) {
      collides = SAT.testCirclePolygon(bodyA.satBody, bodyB.satBody, response);
      // Note: technically less efficient, but this keeps the response's a & b in the same order as
      // the collide arguments
    } else {
      collides = SAT.testPolygonPolygon(bodyA.satBody, bodyB.satBody, response);
    }

    return collides ? response : false;
  }

  /**
   * Không phải là kiểm tra 2 body có tách nhau mà là thực hiện logic để đảm bảo 2 body phải tách nhau 
   * Đây chính là logic chính của va chạm vật lý sẽ gây ra các tác động thay đổi gia tốc, vận tốc, vị trí ra sao 
   * 1 core quan trọng của logic vật lý - ngoài core về update liên hệ gia tốc, vận tốc, vị trí 
   *   //
  // An object representing the result of an intersection. Contains:
  //  - The two objects participating in the intersection
  //  - The vector representing the minimum change necessary to extract the first object
  //    from the second one (as well as a unit vector in that direction and the magnitude
  //    of the overlap)
  //  - Whether the first object is entirely inside the second, and vice versa.
  function Response() {
    this['a'] = null;
    this['b'] = null;
    this['overlapN'] = new Vector();
    this['overlapV'] = new Vector();
    this.clear();
  }
   * @param {*} body1 
   * @param {*} body2 
   * @param {*} response 
   */
  separateBodies(body1, body2, response) {
    if (body1.bodyType === BODY_TYPES.DYNAMIC && body2.bodyType === BODY_TYPES.DYNAMIC) {
      this.separateBodiesDynamicVsDynamic(body1, body2, response);
    } else if (body1.bodyType === BODY_TYPES.DYNAMIC && body2.bodyType === BODY_TYPES.STATIC) {
      this.separateBodiesDynamicVsStatic(body1, body2, response);
    } else if (body1.bodyType === BODY_TYPES.STATIC && body2.bodyType === BODY_TYPES.DYNAMIC) {
      /*
        // Reverse this vector.
        Vector.prototype['reverse'] = Vector.prototype.reverse = function() {
          this['x'] = -this['x'];
          this['y'] = -this['y'];
          return this;
        };
      */
      response.overlapN.reverse();
      response.overlapV.reverse();
      this.separateBodiesDynamicVsStatic(body1, body2, response);
    }
  }

  /**
   * Tách 2 đối tượng dynamic ra khỏi nhau 
   * Khi 2 đối tượng dynamic va chạm nhau thì chỉ có logic biến mất hoặc trừ health
   * Không có các logic nảy phức tạp - class World này chỉ handle đơn giản 
   * Nếu muốn làm logic va chạm phức tạp hơn - ví dụ enemy phải lùi lại sau khi trúng đạn 
   * Thì nên đưa vào logic trúng đạn của enemy 
   * --> Điểm này nên code thử  luôn để xem các logic vật lý có hoạt động như kì vọng 
   * --> Idea có cho các loại vũ khí có vai trò như dao động làm enemy mất kiểm soát 
   * @param {*} body1 
   * @param {*} body2 
   * @param {*} response 
   */
  separateBodiesDynamicVsDynamic(body1, body2, response) {
    // Resolve overlap
    const halfResponse = response.overlap / 2;
    body1.position.x -= halfResponse * response.overlapN.x;
    body1.position.y -= halfResponse * response.overlapN.y;
    body2.position.x += halfResponse * response.overlapN.x;
    body2.position.y += halfResponse * response.overlapN.y;

    // Adjust velocity (pulled from v2 AP)
    const vx1 = body1.velocity.x;
    const vy1 = body1.velocity.y;
    const vx2 = body2.velocity.x;
    const vy2 = body2.velocity.y;
    let vx1New = Math.sqrt(vx2 * vx2 * body2.mass / body1.mass) * (vx2 > 0 ? 1 : -1);
    let vx2New = Math.sqrt(vx1 * vx1 * body1.mass / body2.mass) * (vx1 > 0 ? 1 : -1);
    const vxAve = (vx1New + vx2New) / 2;
    vx1New -= vxAve;
    vx2New -= vxAve;
    body1.velocity.x = vxAve + vx1New * body1.bounce;
    body2.velocity.x = vxAve + vx2New * body2.bounce;
    let vy1New = Math.sqrt(vy2 * vy2 * body2.mass / body1.mass) * (vy2 > 0 ? 1 : -1);
    let vy2New = Math.sqrt(vy1 * vy1 * body1.mass / body2.mass) * (vy1 > 0 ? 1 : -1);
    const vyAve = (vx1New + vx2New) / 2;
    vx1New -= vxAve;
    vx2New -= vxAve;

    if (body1.collisionAffectsVelocity) body1.velocity.y = vyAve + vy1New * body1.bounce;
    if (body2.collisionAffectsVelocity) body2.velocity.y = vyAve + vy2New * body2.bounce;
  }

  /**
   * --> Đây chính là đoạn xử lý va chạm giữa đối tượng chuyển động và đối tượng không chuyển động
   * --> Từ đó xác định cơ chế phản xạ lại lực và có tính toán dựa vào giá trị bounce
   * @param {*} body1 
   * @param {*} body2 
   * @param {*} response 
   */
  separateBodiesDynamicVsStatic(body1, body2, response) {
    // Resolve overlap
    body1.position.x -= response.overlap * response.overlapN.x;
    body1.position.y -= response.overlap * response.overlapN.y;
    body1.updateSatBodyPosition();

    if (!body1.collisionAffectsVelocity) return;

    // Use AABB vs AABB reflection as the default
    const newVelocity = new Phaser.Point(
      Math.abs(response.overlapN.x) > 0 ? -body1.bounce * body1.velocity.x : body1.velocity.x,
      Math.abs(response.overlapN.y) > 0 ? -body1.bounce * body1.velocity.y : body1.velocity.y
    );

    // Special circle vs AABB reflection logic. The above reflection is fine as long as we aren't
    // hitting a corner. If we are, then we need to reflect based on response normal.
    if (body1.bounce !== 0 && body1.bodyShape === BODY_SHAPES.CIRCLE) {
      const cx = body1.satBody.pos.x;
      const cy = body1.satBody.pos.y;
      const r = body1.satBody.r;
      if (body2.bodyShape !== BODY_SHAPES.CIRCLE) {
        let closestDistance = Number.MAX_VALUE;
        let normal = new Phaser.Point();
        for (let { x, y } of body2.satBody.calcPoints) {
          x += body2.satBody.pos.x;
          y += body2.satBody.pos.y;
          const d = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
          if ((d < r || Phaser.Math.fuzzyEqual(d, r)) && d < closestDistance) {
            closestDistance = d;
            normal.setTo(cx - x, cy - y);
          }
        }
        if (closestDistance !== Number.MAX_VALUE) {
          // Reflection logic: http://www.3dkingdoms.com/weekly/weekly.php?a=2
          normal.normalize();
          const vNormalLength = -2 * body1.velocity.dot(normal);
          const vNormal = normal.multiply(vNormalLength, vNormalLength);
          Phaser.Point.add(body1.velocity, vNormal, newVelocity);
          newVelocity.multiply(body1.bounce, body1.bounce);
        }
      }
    }

    body1.velocity.x = newVelocity.x;
    body1.velocity.y = newVelocity.y;

    // TODO: find contact points. Further reading:
    // http://www.dyn4j.org/2011/11/contact-points-using-clipping/
  }

  /**
   * 
   */
  destroy() {
    if (this.leftWall) this.leftWall.destroy();
    if (this.rightWall) this.rightWall.destroy();
    if (this.topWall) this.topWall.destroy();
    if (this.bottomWall) this.bottomWall.destroy();
    if (this.debugGraphics) this.debugGraphics.destroy();
    this.colliders.forEach(collider => collider.destroy());
    this.bodies.clear();
    this.staticBodies.clear();
  }
}
