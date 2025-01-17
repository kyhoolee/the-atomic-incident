module.exports = ShadowMask;

var calculateHullsFromTiles = require("../helpers/hull-from-tiles.js");

// Prototype chain - inherits from ???
function ShadowMask(game, opacity, tilemap, parentGroup) {
    this.game = game;
    this.shadowOpacity = opacity;
    this.camera = this.game.camera;
    this.parent = parentGroup;

    // Create a bitmap and image that can be used for dynamic lighting
    var bitmap = game.add.bitmapData(game.width, game.height);
    bitmap.fill(0, 0, 0, opacity);
    var image = bitmap.addToWorld(game.width / 2, game.height / 2, 0.5, 0.5, 1,
        1);
    image.blendMode = Phaser.blendModes.MULTIPLY;
    image.fixedToCamera = true;
    parentGroup.addChild(image);

    this._bitmap = bitmap;
    this._image = image;
    this._lightWalls = calculateHullsFromTiles(tilemap);

    this._rayBitmap = this.game.add.bitmapData(game.width, game.height);
    this._rayBitmapImage = this._rayBitmap.addToWorld(game.width / 2,
        game.height / 2, 0.5, 0.5, 1, 1);
    parentGroup.addChild(this._rayBitmapImage);
    this._rayBitmapImage.fixedToCamera = true;
    this._rayBitmapImage.visible = false;
}

ShadowMask.prototype._getVisibleWalls = function () {
    var camRect = this.camera.view;
    var visibleWalls = [];

    // Create walls for each corner of the stage, and add them to the walls array.
    var camLeft = new Phaser.Line(camRect.x, camRect.y + camRect.height, camRect.x, camRect.y);
    var camTop = new Phaser.Line(camRect.x, camRect.y, camRect.x + camRect.width, camRect.y);
    var camRight = new Phaser.Line(camRect.x + camRect.width, camRect.y, camRect.x + camRect.width, camRect.y + camRect.height);
    var camBottom = new Phaser.Line(camRect.x + camRect.width, camRect.y + camRect.height, camRect.x, camRect.y + camRect.height);
    visibleWalls.push(camLeft, camRight, camTop, camBottom);

    for (var i = 0; i < this._lightWalls.length; i++) {
        for (var j = 0; j < this._lightWalls[i].length; j++) {
            var line = this._lightWalls[i][j];
            if (camRect.intersectsRaw(line.left, line.right, line.top, line.bottom)) {
                line = getVisibleSegment(line);
                visibleWalls.push(line);
            }
        }
    }

    function getVisibleSegment(line) {
        // This function checks the given line against the edges of the camera. 
        // If it intersects with an edge, then we need to only get the visible
        // portion of the line.
        // TODO: if we want this to work for diagonal lines in the tilemap, we
        // need to update this code to account for the possibility that a line
        // can intersect multiple edges of the camera 
        var p = line.intersects(camLeft, true);
        if (p) {
            // Find which point on the line is visible
            if (line.start.x < line.end.x) {
                return new Phaser.Line(p.x, p.y, line.end.x, line.end.y);
            } else {
                return new Phaser.Line(p.x, p.y, line.start.x, line.start.y);
            }
        }
        var p = line.intersects(camRight, true);
        if (p) {
            // Find which point on the line is visible
            if (line.start.x < line.end.x) {
                return new Phaser.Line(line.start.x, line.start.y, p.x, p.y);
            } else {
                return new Phaser.Line(line.end.x, line.end.y, p.x, p.y);
            }
        }
        var p = line.intersects(camTop, true);
        if (p) {
            // Find which point on the line is visible
            if (line.start.y < line.end.y) {
                return new Phaser.Line(p.x, p.y, line.end.x, line.end.y);
            } else {
                return new Phaser.Line(p.x, p.y, line.start.x, line.start.y);
            }
        }
        var p = line.intersects(camBottom, true);
        if (p) {
            // Find which point on the line is visible
            if (line.start.y < line.end.y) {
                return new Phaser.Line(line.start.x, line.start.y, p.x, p.y);
            } else {
                return new Phaser.Line(line.end.x, line.end.y, p.x, p.y);
            }
        }
        return line;
    }
    return visibleWalls;
};

ShadowMask.prototype._sortPoints = function (points, target) {
    // TODO: make more efficient by sorting and caching the angle calculations
    points.sort(function (p1, p2) {
        var angle1 = Phaser.Point.angle(target, p1);
        var angle2 = Phaser.Point.angle(target, p2);
        return angle1 - angle2;
    });
};

ShadowMask.prototype.update = function () {
    var points = [];
    var globals = this.game.globals;

    var walls = this._getVisibleWalls();

    var playerPoint = globals.player.position;
    for (var w = 0; w < walls.length; w++) {
        // Get start and end point for each wall.
        var wall = walls[w];
        var startAngle = globals.player.position.angle(wall.start);
        var endAngle = globals.player.position.angle(wall.end);

        // Check for an intersection at each angle, and +/- 0.001
        // Add the intersection to the points array.
        points.push(checkRayIntersection(this, startAngle - 0.001));
        points.push(checkRayIntersection(this, startAngle));
        points.push(checkRayIntersection(this, startAngle + 0.001));
        points.push(checkRayIntersection(this, endAngle - 0.001));
        points.push(checkRayIntersection(this, endAngle));
        points.push(checkRayIntersection(this, endAngle + 0.001));
    }

    this._sortPoints(points, globals.player.position);

    // Create an arbitrarily long ray, starting at the player position, through the
    // specified angle.  Check if this ray intersets any walls.  If it does, return
    // the point at which it intersects the closest wall.  Otherwise, return the point
    // at which it intersects the edge of the stage.
    function checkRayIntersection(ctx, angle) {
        // Create a ray from the light to a point on the circle
        var ray = new Phaser.Line(globals.player.x, globals.player.y,
            globals.player.x + Math.cos(angle) * 1000,
            globals.player.y + Math.sin(angle) * 1000);
        // Check if the ray intersected any walls
        var intersect = ctx.getWallIntersection(ray, walls);
        // Save the intersection or the end of the ray
        if (intersect) {
            return intersect;
        } else {
            return ray.end;
        }
    }
    // If the closest wall is the same as the one provided, return false.
    // Otherwise, return the new wall.
    function checkClosestWall(ctx, angle, closestWall) {
        // Create a ray from the light to a point on the circle
        var ray = new Phaser.Line(globals.player.x, globals.player.y,
            globals.player.x + Math.cos(angle) * 1000,
            globals.player.y + Math.sin(angle) * 1000);
        // Check if the ray intersected any walls
        var newWall = ctx.getClosestWall(ray, walls);
        // Save the intersection or the end of the ray
        if (!newWall || !closestWall) { return false; }
        if (newWall.start.x <= closestWall.start.x + 3 &&
            newWall.start.x >= closestWall.start.x - 3 &&
            newWall.start.y <= closestWall.start.y + 3 &&
            newWall.start.y >= closestWall.start.y - 3 &&
            newWall.end.x <= closestWall.end.x + 3 &&
            newWall.end.x >= closestWall.end.x - 3 &&
            newWall.end.y <= closestWall.end.y + 3 &&
            newWall.end.y >= closestWall.end.y - 3) {
            return false;
        } else {
            return newWall;
        }
    }

    // Clear and draw a shadow everywhere
    this._bitmap.clear();
    this._bitmap.update();
    this._bitmap.fill(0, 0, 0, this.shadowOpacity);
    // Draw the "light" areas
    this._bitmap.ctx.beginPath();
    this._bitmap.ctx.fillStyle = 'rgb(255, 255, 255)';
    this._bitmap.ctx.strokeStyle = 'rgb(255, 255, 255)';
    // Note: xOffset and yOffset convert from world coordinates to coordinates 
    // inside of the bitmap mask. There might be a more elegant way to do this
    // when we optimize.
    // When the camera stops moving, fix the offset.
    var xOffset;
    if (globals.player.x > 400 && globals.player.x < 1400) {
        xOffset = globals.player.x - this.game.width / 2;
    } else if (globals.player.x > 1400) {
        xOffset = 1400 - this.game.width / 2;
    } else {
        xOffset = 0;
    }
    var yOffset;
    if (globals.player.y > 300 && globals.player.y < 1140) {
        yOffset = globals.player.y - this.game.height / 2;
    } else if (globals.player.y > 1140) {
        yOffset = 1140 - this.game.height / 2;;
    } else {
        yOffset = 0;
    }
    this._bitmap.ctx.moveTo(points[0].x - xOffset, points[0].y - yOffset);
    for (var i = 0; i < points.length; i++) {
        this._bitmap.ctx.lineTo(points[i].x - xOffset, points[i].y - yOffset);
    }
    this._bitmap.ctx.closePath();
    this._bitmap.ctx.fill();

    // Draw each of the rays on the rayBitmap
    this._rayBitmap.context.clearRect(0, 0, this.game.width, this.game.height);
    this._rayBitmap.context.beginPath();
    this._rayBitmap.context.strokeStyle = 'rgb(255, 0, 0)';
    this._rayBitmap.context.fillStyle = 'rgb(255, 0, 0)';
    this._rayBitmap.context.moveTo(points[0].x - xOffset, points[0].y - yOffset);
    for (var k = 0; k < points.length; k++) {
        this._rayBitmap.context.moveTo(globals.player.x - xOffset, globals.player.y - yOffset);
        this._rayBitmap.context.lineTo(points[k].x - xOffset, points[k].y - yOffset);
        this._rayBitmap.context.fillRect(points[k].x - xOffset - 2,
            points[k].y - yOffset - 2, 4, 4);
    }
    this._rayBitmap.context.stroke();

    // This just tells the engine it should update the texture cache
    this._bitmap.dirty = true;
    this._rayBitmap.dirty = true;
};


// Dynamic lighting/Raycasting.
// Thanks, yafd!
// http://gamemechanicexplorer.com/#raycasting-2
ShadowMask.prototype.getWallIntersection = function (ray, walls) {
    var distanceToWall = Number.POSITIVE_INFINITY;
    var closestIntersection = null;

    for (var i = 0; i < walls.length; i++) {
        var intersect = Phaser.Line.intersects(ray, walls[i]);
        if (intersect) {
            // Find the closest intersection
            var distance = this.game.math.distance(ray.start.x, ray.start.y,
                intersect.x, intersect.y);
            if (distance < distanceToWall) {
                distanceToWall = distance;
                closestIntersection = intersect;
            }
        }
    }
    return closestIntersection;
};

// Return the closest wall that this ray intersects.
ShadowMask.prototype.getClosestWall = function (ray, walls) {
    var distanceToWall = Number.POSITIVE_INFINITY;
    var closestWall = null;

    for (var i = 0; i < walls.length; i++) {
        var intersect = Phaser.Line.intersects(ray, walls[i]);
        if (intersect) {
            // Find the closest intersection
            var distance = this.game.math.distance(ray.start.x, ray.start.y,
                intersect.x, intersect.y);
            if (distance < distanceToWall) {
                distanceToWall = distance;
                closestWall = walls[i]
            }
        }
    }
    return closestWall;
};

ShadowMask.prototype.toggleRays = function () {
    // Toggle the visibility of the rays when the pointer is clicked
    if (this._rayBitmapImage.visible) {
        this._rayBitmapImage.visible = false;
    } else {
        this._rayBitmapImage.visible = true;
    }
};

ShadowMask.prototype.drawWalls = function () {
    for (var i = 0; i < this._lightWalls.length; i++) {
        for (var j = 0; j < this._lightWalls[i].length; j++) {
            var line = this._lightWalls[i][j];
            this.game.debug.geom(line, "rgba(255,0,255,0.75)");
        }
    }
};

ShadowMask.prototype.destroy = function () {
    // TODO: implement a destroy that kills the two bitmaps and their associated
    // image objects
};
