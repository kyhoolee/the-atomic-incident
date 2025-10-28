import "../css/main.scss";
import "babel-polyfill";
import "phaser-ce/build/custom/pixi";
import "phaser-ce/build/custom/p2";
import "phaser-ce/build/custom/phaser-split";
import { autorun } from "mobx";
import { gameStore, preferencesStore } from "./game-data/observable-stores";
import { Boot, Load, StartMenu, Play, LightingPerf, SatBodyTest, GAME_STATE_NAMES } from "./states";
import initializeAnalytics, { registerStateChange } from "./analytics";

import logger, { LOG_LEVEL } from "./helpers/logger";
logger.setLevel(PRODUCTION ? LOG_LEVEL.OFF : LOG_LEVEL.ALL);

const isLocalhost = location.hostname === "localhost" || location.hostname === "127.0.0.1";
initializeAnalytics(isLocalhost);

// Enable/disable Debug.
const enableDebug = !PRODUCTION;
const gameDimensions = 750;
// Keep this on CANVAS until Phaser 3 for performance reasons?

// Đây là đối tượng Game của Phaser 
const game = new Phaser.Game({
  width: gameDimensions, // chiều rộng của game
  height: gameDimensions, // chiều cao của game 
  renderer: Phaser.CANVAS, // Đối tượng sẽ render game 
  enableDebug: enableDebug, // We can turn off debug when deploying - using debug causes a hit on webgl
  parent: "game-container" // Thẻ html mà game sẽ được render 
});

// Set up the menu system
import { MenuApp, Instructions } from "./menu";
import { h, render } from "preact";


// Đây là preact menu dùng để hiện thi danh sách menu 
// Menu này được gắn với preferenceStore của Mobx 
render(
  <MenuApp
    gameStore={gameStore}
    preferencesStore={preferencesStore}
    width={gameDimensions}
    height={gameDimensions}
  />,
  document.body
);
if (enableDebug) render(<Instructions />, document.body);

// Create the space for globals on the game object
const globals = (game.globals = {});
globals.tilemapNames = [
  "horizontal-1"
  // "diagonal-1"
  // "t-1"
];
globals.plugins = {};
globals.musicSound = null;

// Đối tượng Phaser-game sẽ add các game-state - chi tiết là các màn hình chơi game khác nhau 
game.state.add(GAME_STATE_NAMES.BOOT, Boot);
game.state.add(GAME_STATE_NAMES.LOAD, Load);
game.state.add(GAME_STATE_NAMES.START_MENU, StartMenu);
game.state.add(GAME_STATE_NAMES.PLAY, Play);
game.state.add(GAME_STATE_NAMES.LIGHTING_PERF, LightingPerf);
game.state.add(GAME_STATE_NAMES.SAT_BODY_TEST, SatBodyTest);

// Đây là mobx - gameStore dùng để lưu các thông tin về state của game này 
gameStore.setGameState(GAME_STATE_NAMES.BOOT);

/* 
When autorun is used, 
the provided function will always be triggered once immediately 
and then again each time one of its dependencies changes
*/
autorun(() => {
  // Control sound here so it changes regardless of the current phaser state loaded
  const musicSound = globals.musicSound;
  if (musicSound) musicSound.mute = preferencesStore.musicMuted;

  game.state.start(gameStore.gameState);
  if (gameStore.pendingGameRestart)
    game.state.start(gameStore.gameState);
});
game.state.onStateChange.add(() => {
  gameStore.markRestartComplete();
  registerStateChange(game.state.getCurrentState().key);
});
