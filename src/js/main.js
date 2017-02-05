window.PIXI = require("phaser-ce/build/custom/pixi");
window.p2 = require("phaser-ce/build/custom/p2");
window.Phaser = require("phaser-ce/build/custom/phaser-split");

var Sandbox = require("./states/sandbox.js");
var BootState = require("./states/boot-state.js");
var LoadState = require("./states/load-state.js");
var StartScreen = require("./states/start-screen.js");

// Keep this on CANVAS until Phaser 3 for performance reasons?
var game = new Phaser.Game(800, 600, Phaser.CANVAS, "game-container");

// Create the space for globals on the game object
var globals = game.globals = {};
globals.tilemapFiles = [
    "tower-defense-2.json",
    "tower-defense-1.json",
];

game.state.add("boot", BootState);
game.state.add("load", LoadState);
game.state.add("start", StartScreen);
game.state.add("sandbox", Sandbox);
game.state.start("boot");