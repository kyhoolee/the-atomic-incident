/**
 * Sandbox - this is the main level for now
 */

module.exports = Sandbox;

var SatBodyPlugin = require("../plugins/sat-body-plugin/sat-body-plugin.js");
var AStar = require("../plugins/AStar.js");
var Player = require("../game-objects/player.js");
var ScoreKeeper = require("../helpers/score-keeper.js");
var HeadsUpDisplay = require("../game-objects/heads-up-display.js");

function Sandbox() {}

Sandbox.prototype.create = function () {
    // Create the space for globals on the game object
    this.game.globals = {};

    // Shorthands
    var game = this.game;
    var globals = game.globals;
    
    // Debugging FPS
    game.time.advancedTiming = true;
    
    // Canvas styling
    game.canvas.style.cursor = "none";
    game.canvas.addEventListener("contextmenu", function(e) {
        e.preventDefault();
    });

    // Plugins
    globals.plugins = {
        satBody: game.plugins.add(SatBodyPlugin),
        astar: game.plugins.add(Phaser.Plugin.AStar)
    };

    // Groups for z-index sorting and for collisions
    var groups = {
        background: game.add.group(this.world, "background"),
        midground: game.add.group(this.world, "midground"),
        foreground: game.add.group(this.world, "foreground")
    };
    groups.enemies = game.add.group(groups.midground, "enemies");
    groups.pickups = game.add.group(groups.midground, "pickups");
    groups.nonCollidingGroup = game.add.group(groups.midground, 
        "non-colliding");
    globals.groups = groups;

    // Initializing the world
    this.stage.backgroundColor = "#F9F9F9";

    // Loading the tilemap
    var map = game.add.tilemap("tilemap");
    // Set up the tilesets. First parameter is name of tileset in Tiled and 
    // second paramter is name of tileset image in Phaser's cache
    map.addTilesetImage("colors", "coloredTiles");
    // Create a layer for each 
    var backgroundLayer = map.createLayer("Background", this.game.width, 
        this.game.height, groups.background);
    backgroundLayer.resizeWorld();
    var blockingLayer = map.createLayer("BlockingLayer", this.game.width, 
        this.game.height, groups.background);
    map.setCollisionBetween(0, 3, true, "BlockingLayer");

    // Create a bitmap and image that can be used for dynamic lighting
    var bitmap = this.game.add.bitmapData(game.width, game.height);
    var image = bitmap.addToWorld(game.width/2, game.height/2, 0.5, 0.5, 1, 1);
    groups.midground.addChild(image);
    image.blendMode = Phaser.blendModes.MULTIPLY;
    image.fixedToCamera = true;
    globals.lighting = {
        bitmap: bitmap,
        image: image,
        opacity: 1
    }
    bitmap.fill(0, 0, 0, globals.lighting.opacity);

    // AStar plugin
    globals.plugins.astar.setAStarMap(map, "BlockingLayer", "colors");

    globals.tileMap = map;
    globals.tileMapLayer = blockingLayer;

    // Physics
    this.physics.startSystem(Phaser.Physics.ARCADE);
    this.physics.arcade.gravity.set(0);

    // Player
    var px = 0;
    var py = 0;
    if (map.objects["player"]) {
        var objects = map.objects["player"];
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].name === "player") {
                px = objects[i].x;
                py = objects[i].y;
            }
        }
    }
    var player = new Player(game, px, py, groups.midground);
    this.camera.follow(player);
    globals.player = player;
    
    // Score
    globals.scoreKeeper = new ScoreKeeper();

    // HUD
    globals.hud = new HeadsUpDisplay(game, groups.foreground);
    
    // var Wave1 = require("../game-objects/waves/wave-1.js");
    // new Wave1(game);

    // var WeaponPickup = require("../game-objects/pickups/weapon-pickup.js");
    // for (var i=0; i<50; i++) {
    //     new WeaponPickup(this.game, this.game.rnd.integerInRange(0, 1300), 
    //         this.game.rnd.integerInRange(0, 1300), "gun", 5)
    // }
    
    // Toggle debugging SAT bodies
    var debugToggleKey = game.input.keyboard.addKey(Phaser.Keyboard.E);
    debugToggleKey.onDown.add(function () {
        if (globals.plugins.satBody.isDebugAllEnabled()) {
            globals.plugins.satBody.disableDebugAll();
        } else {
            globals.plugins.satBody.enableDebugAll();
        }
    }, this);
};

Sandbox.prototype.update = function () {
    var deltaAngle = Math.PI / 360;
    var points = [];
    var globals = this.game.globals;
    
    var walls = this.getWallsOnScreen();

    for(var a = 0; a < Math.PI * 2; a += deltaAngle) {
        // Create a ray from the light to a point on the circle
        var ray = new Phaser.Line(globals.player.x, globals.player.y,
            globals.player.x + Math.cos(a) * 1000, globals.player.y + Math.sin(a) * 1000);

        // Check if the ray intersected any walls
        var intersect = this.getWallIntersection(ray, walls);

        // Save the intersection or the end of the ray
        if (intersect) {
            points.push(intersect);
        } else {
            points.push(ray.end);
        }
    }

    var bitmap = globals.lighting.bitmap;
    // Clear and draw a shadow everywhere
    bitmap.clear();
    bitmap.update();
    bitmap.fill(0, 0, 0, globals.lighting.opacity);
    // Draw the "light" areas
    bitmap.ctx.beginPath();
    bitmap.ctx.fillStyle = 'rgb(255, 255, 255)';
    bitmap.ctx.strokeStyle = 'rgb(255, 255, 255)';
    // Note: xOffset and yOffset convert from world coordinates to coordinates 
    // inside of the bitmap mask. There might be a more elegant way to do this
    // when we optimize.
    var xOffset = globals.player.x - this.game.width / 2;
    var yOffset = globals.player.y - this.game.height / 2;
    bitmap.ctx.moveTo(points[0].x - xOffset, points[0].y - yOffset);
    for(var i = 0; i < points.length; i++) {
        bitmap.ctx.lineTo(points[i].x - xOffset, points[i].y - yOffset);
    }
    bitmap.ctx.closePath();
    bitmap.ctx.fill();

    // This just tells the engine it should update the texture cache
    bitmap.dirty = true;
};

Sandbox.prototype.getWallsOnScreen = function () {
    var player = this.game.globals.player;
    var layer = this.game.globals.tileMapLayer;
    var screenTileLeft = layer.getTileX(player.x - (this.game.width / 2));
    var screenTileRight = layer.getTileX(player.x + (this.game.width / 2));
    var screenTileTop = layer.getTileY(player.y - (this.game.height / 2));
    var screenTileBottom = layer.getTileY(player.y + (this.game.height / 2));

    // Constrain the left/right/top/bottom to be valid tile coords
    var tileMap = this.game.globals.tileMap;
    if (screenTileLeft < 0) screenTileLeft = 0;
    if (screenTileRight > tileMap.width) screenTileRight = tileMap.width;
    if (screenTileTop < 0) screenTileTop = 0;
    if (screenTileBottom > tileMap.height) screenTileBottom = tileMap.height; 

    var walls = [];
    tileMap.forEach(function(t) {
        if (t && t.collides) {
            walls.push(
                new Phaser.Line(t.left, t.top, t.right, t.top),
                new Phaser.Line(t.right, t.top, t.right, t.bottom),
                new Phaser.Line(t.left, t.bottom, t.right, t.bottom),
                new Phaser.Line(t.left, t.top, t.left, t.bottom)
            );
        }
    }, this, screenTileLeft, screenTileTop, 
    screenTileRight - screenTileLeft, screenTileBottom - screenTileTop, 
    "BlockingLayer");

    return walls;
}

// Dynamic lighting/Raycasting.
// Thanks, yafd!
// http://gamemechanicexplorer.com/#raycasting-2
Sandbox.prototype.getWallIntersection = function(ray, walls) {
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

Sandbox.prototype.render = function () {
    this.game.debug.text(this.game.time.fps, 5, 15, "#A8A8A8");
    // this.game.debug.AStar(this.game.globals.plugins.astar, 20, 20, "#ff0000");

    // for (var i = 0; i < this.walls.length; i++) {
    //     this.game.debug.geom(this.walls[i]);
    // }
};