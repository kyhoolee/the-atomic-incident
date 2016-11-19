var calculateHullsFromTiles = require("./hull-from-tiles.js");

module.exports = Phaser.Plugin.Lighting = function (game, manager) {
    this.game = game;
    this.camera = this.game.camera;
    this._debugEnabled = false;
    this._pluginManager = manager;
};

Phaser.Plugin.Lighting.prototype = Object.create(Phaser.Plugin.prototype);

Phaser.Plugin.Lighting.prototype.setOpacity = function (opacity) {
    this.shadowOpacity = opacity;
};

Phaser.Plugin.Lighting.prototype.toggleDebug = function () {
    this._debugEnabled = !this._debugEnabled;
    this._rayBitmapImage.visible = this._debugEnabled;
};

Phaser.Plugin.Lighting.prototype.isPointInShadow = function (worldPoint) {
    var localPoint = this._convertWorldPointToLocal(worldPoint);
    if ((localPoint.x < 0) || (localPoint.x > this._bitmap.width) ||
        (localPoint.y < 0) || (localPoint.y > this._bitmap.height)) {
        // Returns false if outside of bitmap bounds...
        return false;
    }
    var color = this._bitmap.getPixel(localPoint.x, localPoint.y);
    if (color.r !== 255) return true;
    return false;
};

Phaser.Plugin.Lighting.prototype.destroy = function () {
    // TODO: implement a destroy that kills the two bitmaps and their associated
    // image objects
    console.log("Not implemented...");
};

Phaser.Plugin.Lighting.prototype.init = function (spriteParent, tilemap, 
    shadowOpacity) {
    this.shadowOpacity = (shadowOpacity !== undefined) ? shadowOpacity : 1;

    var game = this.game;
    // Create a bitmap and image that can be used for dynamic lighting
    var bitmap = game.add.bitmapData(game.width, game.height);
    bitmap.fill(0, 0, 0, this.shadowOpacity);
    var image = bitmap.addToWorld(0, 0);
    image.blendMode = Phaser.blendModes.MULTIPLY;
    image.fixedToCamera = true;
    spriteParent.addChild(image);

    this._bitmap = bitmap;
    this._image = image;
    this._lightWalls = calculateHullsFromTiles(tilemap);

    this._rayBitmap = this.game.add.bitmapData(game.width, game.height);
    this._rayBitmapImage = this._rayBitmap.addToWorld(game.width / 2, 
        game.height / 2, 0.5, 0.5, 1, 1);
    spriteParent.addChild(this._rayBitmapImage);
    this._rayBitmapImage.fixedToCamera = true;
    this._rayBitmapImage.visible = false;
};

Phaser.Plugin.Lighting.prototype.render = function () {
    if (!this._debugEnabled) return;
    for (var i = 0; i < this._lightWalls.length; i++) {
        for (var j = 0; j < this._lightWalls[i].length; j++) {
            var line = this._lightWalls[i][j];
            this.game.debug.geom(line, "rgba(255,0,255,0.75)");
        }
    }
};

Phaser.Plugin.Lighting.prototype.update = function () {
    var points = [];
    var globals = this.game.globals;

    var walls = this._getVisibleWalls();

    var playerPoint = globals.player.position;
    for (var w = 0; w < walls.length; w++) {
        // Get start and end point for each wall.
        var wall = walls[w];
        var startAngle = playerPoint.angle(wall.start);
        var endAngle = playerPoint.angle(wall.end);

        // Check for an intersection at each angle, and +/- 0.001
        // Add the intersection to the points array.
        points.push(checkRayIntersection(this, startAngle-0.001));
        points.push(checkRayIntersection(this, startAngle));
        points.push(checkRayIntersection(this, startAngle+0.001));
        points.push(checkRayIntersection(this, endAngle-0.001));
        points.push(checkRayIntersection(this, endAngle));
        points.push(checkRayIntersection(this, endAngle+0.001));
    }

    this._sortPoints(points, playerPoint);

    // Create an arbitrarily long ray, starting at the player position, through
    // the specified angle.  Check if this ray intersets any walls.  If it does,
    // return the point at which it intersects the closest wall.  Otherwise,
    // return the point at which it intersects the edge of the stage.
    function checkRayIntersection(ctx, angle) {
        // Create a ray from the light to a point on the circle
        var ray = new Phaser.Line(globals.player.x, globals.player.y,
            globals.player.x + Math.cos(angle) * 1000,
            globals.player.y + Math.sin(angle) * 1000);
        // Check if the ray intersected any walls
        var intersect = ctx._getWallIntersection(ray, walls);
        // Save the intersection or the end of the ray
        if (intersect) {
            return intersect;
        } else {
            return ray.end;
        }
    }

    // Clear and draw a shadow everywhere
    this._bitmap.clear();
    this._bitmap.update();
    this._bitmap.fill(0, 0, 0, this.shadowOpacity);
    // Draw the "light" areas
    this._bitmap.ctx.beginPath();
    this._bitmap.ctx.fillStyle = "rgb(255, 255, 255)";
    this._bitmap.ctx.strokeStyle = "rgb(255, 255, 255)";

    // Convert the world positions of the light points to local coordinates 
    // within the bitmap
    var localPoints = points.map(this._convertWorldPointToLocal, this);
    this._bitmap.ctx.moveTo(localPoints[0].x, localPoints[0].y);
    for(var i = 0; i < localPoints.length; i++) {
        this._bitmap.ctx.lineTo(localPoints[i].x, localPoints[i].y);
    }
    this._bitmap.ctx.closePath();
    this._bitmap.ctx.fill();

    // Draw each of the rays on the rayBitmap
    this._rayBitmap.context.clearRect(0, 0, this.game.width, this.game.height);
    this._rayBitmap.context.beginPath();
    this._rayBitmap.context.strokeStyle = "rgb(255, 0, 0)";
    this._rayBitmap.context.fillStyle = "rgb(255, 0, 0)";
    this._rayBitmap.context.moveTo(localPoints[0].x, localPoints[0].y);
    var lightPoint = this._convertWorldPointToLocal(playerPoint);
    for(var k = 0; k < localPoints.length; k++) {
        var p = localPoints[k];
        this._rayBitmap.context.moveTo(lightPoint.x, lightPoint.y);
        this._rayBitmap.context.lineTo(p.x, p.y);
        this._rayBitmap.context.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    this._rayBitmap.context.stroke();

    // This just tells the engine it should update the texture cache
    this._bitmap.dirty = true;
    this._rayBitmap.dirty = true;

    // Update the bitmap so that pixels are available
    this._bitmap.update();
};

Phaser.Plugin.Lighting.prototype._getVisibleWalls = function () {
    var camRect = this.camera.view;
    var visibleWalls = [];

    // Create walls for each corner of the stage & add them to the walls array
    var x = camRect.x;
    var y = camRect.y;
    var w = camRect.width;
    var h = camRect.height;
    var camLeft = new Phaser.Line(x, y + h, x, y);
    var camTop = new Phaser.Line(x, y, x + w, y);
    var camRight = new Phaser.Line(x + w, y, x + w, y + h);
    var camBottom = new Phaser.Line(x + w, y + h, x, y + h);
    visibleWalls.push(camLeft, camRight, camTop, camBottom);

    for (var i = 0; i < this._lightWalls.length; i++) {
        for (var j = 0; j < this._lightWalls[i].length; j++) {
            var line = this._lightWalls[i][j];
            if (camRect.intersectsRaw(line.left, line.right, line.top, 
                line.bottom)) {
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

Phaser.Plugin.Lighting.prototype._convertWorldPointToLocal = function (point) {
    // image.world is the position of the top left of the image (and hence the 
    // lighting bitmap) in world coordinates. To get from a world coordinate to
    // a coordinate relative to the bitmap's top left, just subract the 
    // image.world.
    return Phaser.Point.subtract(point, this._image.world);
};

Phaser.Plugin.Lighting.prototype._sortPoints = function (points, target) {
    // TODO: make more efficient by sorting and caching the angle calculations
    points.sort(function (p1, p2) {
        var angle1 = Phaser.Point.angle(target, p1);
        var angle2 = Phaser.Point.angle(target, p2);
        return angle1 - angle2;
    });
};

// Dynamic lighting/Raycasting.
// Thanks, yafd!
// http://gamemechanicexplorer.com/#raycasting-2
Phaser.Plugin.Lighting.prototype._getWallIntersection = function(ray, walls) {
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
Phaser.Plugin.Lighting.prototype._getClosestWall = function(ray, walls) {
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
                closestWall = walls[i];
            }
        }
    }
    return closestWall;
};
