/**
 * Sandbox - this is the main level for now
 */

import PickupSpawner from "../game-objects/pickups/pickup-spawner.js";
// import LightingPlugin from "../plugins/lighting-plugin/lighting-plugin.js";
import LightingPlugin from "../plugins/lighting-plugin-optimized/lighting-plugin.js";
import Player from "../game-objects/player.js";
import SoundEffectManager from "../game-objects/fx/sound-effect-manager.js";
import EffectsPlugin from "../plugins/camera-effects-plugin/camera-effects-plugin.js";
import PostProcessor from "../game-objects/fx/post-processor.js";
import { MENU_STATE_NAMES } from "../menu.js";
import { gameStore, preferencesStore } from "../game-data/observable-stores.js";
import { autorun } from "mobx";
import MapManager from "../game-objects/level-manager.js";
import EnemySpawner from "../game-objects/enemies/enemy-spawner.js";
import EnemyGroup from "../game-objects/enemies/enemy-group.js";
import EnergyPickup from "../game-objects/pickups/energy-pickup.js";
import WeaponSpawner from "../game-objects/pickups/weapon-spawner.js";
import WEAPON_TYPES from "../game-objects/weapons/weapon-types.js";
import Score from "../game-objects/hud/score.js";
import Combo from "../game-objects/hud/combo.js";
import Radar from "../game-objects/hud/radar/.js";
import Ammo from "../game-objects/hud/ammo.js";
import DashIcon from "../game-objects/hud/dash-icon.js";
import AudioProcessor from "../game-objects/fx/audio-processor.js";
import PopUpText from "../game-objects/hud/pop-up-text.js";
import getFontString from "../fonts/get-font-string.js";
import SatBodyPlugin from "../plugins/sat-body-plugin-revisited/plugin.js";
import DifficultyModifier from "../game-objects/difficulty-modifier.js";
import { registerGameStart } from "../analytics.js";
import ImageBar from "../game-objects/hud/image-bar.js";
import WaveHud from "../game-objects/hud/wave.js";
import HudMessageDisplay from "../game-objects/hud/hud-message-display.js";
import StaticDebugger from "../debug/static-debugger.js";


/*
This is a base State class which can be extended if you are creating your own game. 
It provides quick access to common functions such as the camera, cache, input, match, sound and more.

1 game-state của phaser cần implement 3 ham chính 
- Create - khi khởi tạo state thì tạo ra những thông tin gì 
- Update - mỗi lần game loop được gọi chạy thì ở game-state này sẽ xử lý các điều kiện logic + biến đổi thông tin 
- Shutdown - khi game-state này được shutdown thì cần dọn dẹp - cập nhật lại những thông tin gì để kết thúc game-state 
*/
// export default class PlayState --> dùng để khai báo cho bên script khác có thể import 
export default class PlayState extends Phaser.State {


  create() {
    // 1. Đăng kí việc log thông tin analytics 
    registerGameStart();
    // 2. Gọi mobx-gameStore đóng trạng thái mở menu lại 
    gameStore.setMenuState(MENU_STATE_NAMES.CLOSED);

    // Shorthands - ngắn gọn cho 1 số biến quan trọng - game và các biến global của game 
    const game = this.game;
    const globals = game.globals;

    // Groups for z-index sorting and for collisions
    const groups = {
      // this.world 
      /**
       * this.world là game-world của game-state này - chứa tất cả các object tồn tại trong game 
        * A reference to the game world. 
        * All objects live in the Game World and its size is not bound by the display resolution.
        */
      // 1. game: đây là group chứa các đối tượng chính của game  
      game: game.add.group(this.world, "game"),
      // 2. gameOverlay: Đây là các đối tượng phủ lên layer trên 
      gameOverlay: game.add.group(this.world, "game-overlay"),
      // 3. hud: là các thông tin dạng như thanh health, đạn, score 
      hud: game.add.group(this.world, "hud")
    };


    // Các thành phần hud thì nằm ở vị trí cố định trên màn hình
    groups.hud.fixedToCamera = true;
    /**
        * A Group is a container for display objects that allows for fast pooling, recycling and collision checks.
        * 
        * @param parent The parent Group or DisplayObjectContainer that will hold this group, if any. 
        * If set to null the Group won't be added to the display list. 
        * If undefined it will be added to World by default.
        * @param name A name for this Group. 
        * Not used internally but useful for debugging. 
        * - Default: 'group'
        * @param addToStage If set to true this Group will be added directly 
        * to the Game.Stage instead of Game.World.
        * @param enableBody If true all Sprites created with 
        * `Group.create` or `Group.createMulitple` will have a physics body created on them. 
        * Change the body type with physicsBodyType.
        * @param physicsBodyType If enableBody is true this is the type of physics body 
        * that is created on new Sprites. 
        * Phaser.Physics.ARCADE, Phaser.Physics.P2, Phaser.Physics.NINJA, etc.
        * @return The newly created Group.
    */
    // Tạo ra các thành phần con của group game 
    // 1. Background 
    groups.background = game.add.group(groups.game, "background");
    // 2. Midground
    groups.midground = game.add.group(groups.game, "midground");
    // 3. Foreground 
    groups.foreground = game.add.group(groups.game, "foreground");
    // 4. Debug overlay (optional drawing surface)
    groups.debug = game.add.group(groups.foreground, "debug-overlay");

    // Trong midground thì có các pickups-item của game 
    groups.pickups = game.add.group(groups.midground, "pickups");
    // Trong midground thì có enimies - Đây là group của các enemy - tất cả enemy đều được gán vào parent-group là enemy-group
    groups.enemies = new EnemyGroup(game, groups.midground);
    // Trong midground có các các group của các object không cần check colliding 
    groups.nonCollidingGroup = game.add.group(groups.midground, "non-colliding");

    // Đưa biến group vào trong thông tin globals 
    globals.groups = groups;

    // Plugins
    /*
    class Plugin implements IStateCycle {


      **
      * This is a base Plugin template to use for any Phaser plugin development.
      * 
      * ##### Callbacks
      * 
      * add  | active      | visible     | remove
      * -----|-------------|-------------|--------
      * init |             |             |
      *      | preUpdate*  |             |
      *      | update*     | render*     |
      *      | postUpdate* | postRender* |
      *      |             |             | destroy
      * 
      * Update and render calls are repeated (*).
      * 
      * @param game A reference to the currently running game.
      * @param parent The object that owns this plugin, usually Phaser.PluginManager.
      *
      constructor(game: Phaser.Game, parent: Phaser.PluginManager);
    */
    global.plugins = global.plugins !== undefined ? global.plugins : {};

    /*
        **
    * The Plugin Manager is responsible for the loading, running and unloading of Phaser Plugins.
    *
   class PluginManager implements IStateCycle {
    */
    // Plugins.1. Plugins để kiemr tra các đối tượng trong game va chạm   
    /*
    
    * Add a new Plugin into the PluginManager.
    * The Plugin must have 2 properties: game and parent. Plugin.game is set to the game reference the PluginManager uses, and parent is set to the PluginManager.
    * 
    * @param plugin The Plugin to add into the PluginManager. This can be a function or an existing object.
    * @param args Additional arguments that will be passed to the Plugin.init method.
    * @return The Plugin that was added to the manager.
    *
    add<T extends Phaser.Plugin>(plugin: PluginConstructorOf<T>, ...parameters: any[]): T;
    */
    globals.plugins.satBody = game.plugins.add(SatBodyPlugin);
    // Plugins.2. Plugins để tạo ra các effect trong game    
    globals.plugins.effects = game.plugins.add(EffectsPlugin);

    // Level manager
    const mapName = globals.tilemapNames[0];
    // map-manager trong game thuộc về nhóm background và foreground
    // không liên quan tới midground là các game-object chính 

    // Manager.1. Map-manager - quản lý bản đồ trong game 
    const mapManager = new MapManager(game, mapName, groups.background, groups.foreground);
    globals.mapManager = mapManager;

    // Debug helpers for static layers
    this.staticDebugger = new StaticDebugger(game, mapManager, groups);
    globals.debugTools = globals.debugTools || {};
    globals.debugTools.staticDebugger = this.staticDebugger;
    if (typeof window !== "undefined") {
      window.__TAI_DEBUG__ = window.__TAI_DEBUG__ || {};
      window.__TAI_DEBUG__.staticDebugger = this.staticDebugger;
    }
    this.staticDebuggerToggleKey = this.input.keyboard.addKey(Phaser.KeyCode.U);
    this.staticDebuggerToggleKey.onDown.add(() => this.staticDebugger.toggle());

    // Lighting plugin - needs to be set up after level manager
    // Vì lightning-plugin dùng để phủ 1 lớp overlay lên trên game thể hiện sáng tối 
    // nên cần phải có tham chiếu tới dữ liệu mapManager được gán trước đó nêú không thì không hoạt động được 

    // Plugins.3. Plugins để tạo ra hiệu ứng ánh sáng + bóng che trong game - dựa trên map-tile
    globals.plugins.lighting = game.plugins.add(LightingPlugin, {
      parent: groups.foreground, // thuộc về lớp foreground của trong nhóm game 
      walls: mapManager.walls,
      shouldUpdateImageData: false,
      shadowOpacity: 1,
      debugEnabled: false
    });
    this.lighting = globals.plugins.lighting;

    // Sound manager
    // Manager.2. Sound-manager - quản lý âm thanh trong game 
    globals.soundManager = new SoundEffectManager(this.game);

    // Difficulty
    // Manager.3. Difficulty-manager - quản lý điều chỉnh độ khó trong game 
    globals.difficultyModifier = new DifficultyModifier();

    // Physics
    this.physics.startSystem(Phaser.Physics.ARCADE);
    this.physics.arcade.gravity.set(0);

    globals.postProcessor = new PostProcessor(game, globals.groups.game);
    globals.audioProcessor = new AudioProcessor(game);

    // Player - đôi tượng người chơi - khởi tạo các thông tin cần thiết về đối tượng người chơi
    // Setup a new player, and attach it to the global variabls object.
    // player.1. vị trí của player 
    const spawnObjects = mapManager.tilemap.objects["player-spawn"] || [];
    const spawnPoint =
      spawnObjects.length > 0
        ? { x: spawnObjects[0].x, y: spawnObjects[0].y }
        : { x: this.world.width / 2, y: this.world.height / 2 };
    // player.2. khởi tạo đối tượng Player với game + ví trí + group:foreground
    const player = new Player(game, spawnPoint.x, spawnPoint.y, groups.foreground);
    globals.player = player;

    // game-world: giới hạn vào kích cỡ của bản đồ - tilemap
    game.world.setBounds(0, 0, mapManager.tilemap.widthInPixels, mapManager.tilemap.heightInPixels);
    // game-camera: gắn theo di chuyển của player 
    game.camera.follow(player);

    // Waves of pickups and enemies
    // Khởi tạo các loại Spawner khác nhau: nhặt đồ - pickup, địch - enemy, vũ khí - weapon 
    new PickupSpawner(game);
    const enemySpawner = new EnemySpawner(game, player);
    this.enemySpawner = enemySpawner;
    const weaponSpawner = new WeaponSpawner(game, groups.pickups, player, mapManager);

    // HUD
    // Khởi tạo các thành phần thông tin hiển thị lúc chơi - nằm ngoài các đối tượng hoạt động của màn game 
    const hudMessageDisplay = new HudMessageDisplay(game, groups.hud);

    // Khởi tạo Radar ??? là cái gì - chưa rõ mục đích logic 
    new Radar(game, groups.foreground, player, this.game.globals.groups.enemies, weaponSpawner);
    // Khởi tạo Combo ??? - chưa rõ mục đích logic 
    const combo = new Combo(game, groups.hud, player, globals.groups.enemies);
    combo.position.set(this.game.width - 5, 32);
    // Khởi tạo Score ??? - chưa rõ mục đích logic 
    const score = new Score(game, groups.hud, globals.groups.enemies, combo, hudMessageDisplay);
    score.position.set(this.game.width - 5, 5);
    // Khởi tạo Amo ??? - chưa rõ mục đích logic 
    const ammo = new Ammo(game, groups.hud, player, weaponSpawner);
    ammo.position.set(game.width - 5, game.height - 5);

    // Khởi tạo các sprite của group:hud 
    this.add.sprite(4, 4, "assets", "hud/health-icon", groups.hud);
    // Khởi tạo daskIcon ??? - chưa nắm chi tiết 
    const dashIcon = new DashIcon(game, groups.hud, player);
    dashIcon.position.set(4, 36);

    // Khởi tạo player-health là 1 image-bar 
    const playerHealth = new ImageBar(game, groups.hud, {
      x: 35,
      y: 7,
      interiorKey: "hud/health-bar-interior",
      outlineKey: "hud/health-bar-outline"
    });
    player.onHealthChange.add(newHealth => playerHealth.setValue(newHealth));

    // Khởi tạo WaveHud - chưa rõ đây là cái gì ???
    new WaveHud(game, groups.hud, enemySpawner.onWaveSpawn);

    // Difficulty toast messages
    // Khởi tạo thông tin độ khó của game được hiển thị 
    globals.difficultyModifier.onDifficultyChange.add((previousDifficulty, difficulty) => {
      const truncatedPreviousDifficulty = Math.floor(previousDifficulty * 10) / 10;
      const truncatedDifficulty = Math.floor(difficulty * 10) / 10;
      if (truncatedDifficulty > truncatedPreviousDifficulty) {
        // Difficulty has changed in the 10s decimal place
        hudMessageDisplay.setMessage(`${truncatedDifficulty.toFixed(2)}x speed`);
      }
    });

    // Combo "toast" messages
    // Khởi tạo các loại thông báo PopUpText - khi có hành vi pickup
    weaponSpawner.onPickupCollected.add(pickup => {
      const location = Phaser.Point.add(pickup, new Phaser.Point(0, -30));
      const w = player.weaponManager.getActiveWeapon();
      new PopUpText(game, globals.groups.foreground, w.getName(), location);
    });

    // Khởi tạo EnergyPickup - chưa rõ chi tiết 
    globals.groups.enemies.onEnemyKilled.add(enemy => {
      new EnergyPickup(this.game, enemy.x, enemy.y, globals.groups.pickups, player);
    });

    // Use the 'P' button to pause/unpause, as well as the button on the HUD.
    game.input.keyboard.addKey(Phaser.Keyboard.P).onDown.add(() => {
      if (gameStore.isPaused) {
        gameStore.setMenuState(MENU_STATE_NAMES.CLOSED);
        gameStore.unpause();
      } else {
        gameStore.setMenuState(MENU_STATE_NAMES.PAUSE);
        gameStore.pause();
      }
    });

    // Subscribe to the debug settings
    // Sử dụng mobx với cơ chế autorun - để có sự thay đổi tương ứng với cập nhật về thông tin PreferenceStore 
    this.storeUnsubscribe = autorun(() => {
      this.lighting.setOpacity(preferencesStore.shadowOpacity);
      if (preferencesStore.physicsDebug) this.physics.sat.world.enableDebug();
      else this.physics.sat.world.disableDebug();
      globals.postProcessor.visible = preferencesStore.shadersEnabled;
      game.paused = gameStore.isPaused;
    });
    // Note: pausing and unpausing mutes/unmutes Phaser's sound manager. Changing the volume while
    // muted will be ignored. Instead, sync volume any time the game is unmuted.
    this.game.sound.onUnMute.add(() => (this.game.sound.volume = preferencesStore.volume));
    this.game.sound.volume = preferencesStore.volume; // Sync volume on first load


    // Optional debug menu, pause w/o menus, switch weapons and fps text
    // Các option khi bật cờ debug để debug thử cho nhanh 
    if (!this.game.debug.isDisabled) {
      // 
      game.input.keyboard.addKey(Phaser.Keyboard.E).onDown.add(() => {
        gameStore.setMenuState(MENU_STATE_NAMES.DEBUG);
        gameStore.pause();
      });

      // 
      game.input.keyboard.addKey(Phaser.Keyboard.R).onDown.add(() => {
        groups.enemies.killAll();
      });

      // Force spawning waves
      game.input.keyboard.addKey(Phaser.Keyboard.K).onDown.add(() => enemySpawner._spawnWave());
      game.input.keyboard
        .addKey(Phaser.Keyboard.L)
        .onDown.add(() => enemySpawner._spawnSpecialWave());

      // Pause without menus showing up.
      game.input.keyboard.addKey(Phaser.Keyboard.O).onDown.add(() => {
        // NOTE(rex): Only allowed if all menus are closed already.
        if (gameStore.menuState === MENU_STATE_NAMES.CLOSED && gameStore.isPaused) {
          gameStore.unpause();
        } else if (gameStore.menuState === MENU_STATE_NAMES.CLOSED && !gameStore.isPaused) {
          gameStore.pause();
        }
      });

      /* Manually switch weapons with the number keys.
       */
      const keys = ["ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE"];
      const weapons = Object.values(WEAPON_TYPES);
      for (let i = 0; i < Math.min(keys.length, weapons.length); i++) {
        const key = Phaser.Keyboard[keys[i]];
        const weaponType = weapons[i];
        game.input.keyboard.addKey(key).onDown.add(() => {
          if (gameStore.menuState === MENU_STATE_NAMES.CLOSED) {
            player.weaponManager.switchWeapon(weaponType);
            ammo.updateWeapon();
          }
        });
      }

      // FPS
      this._fpsText = game.make.text(5, game.height - 38, "60", {
        font: getFontString("Montserrat", { size: "12px", weight: 400 }),
        fill: "#00ffff"
      });
      this._fpsText.anchor.set(0, 1);
      groups.hud.add(this._fpsText);

      // this._inLightText = game.make.text(
      //   game.width - 25,
      //   game.height - 100,
      //   "Is Mouse In Light: ",
      //   { font: "18px 'Alfa Slab One'", fill: "#9C9C9C" }
      // );
      // this._inLightText.anchor.set(1, 1);
      // groups.hud.add(this._inLightText);
    }
  }

  update() {
    if (this._fpsText) {
      this._fpsText.setText(this.game.time.fps);
    }

    if (this._inLightText) {
      const isMouseInShadow = this.game.globals.player._playerLight.isPointInShadow(
        Phaser.Point.add(this.camera.position, this.input.mousePointer.position)
      );
      this._inLightText.setText("Is Mouse In Light: " + (isMouseInShadow ? "No" : "Yes"));
    }
  }

  shutdown() {
    if (this.staticDebuggerToggleKey) {
      this.staticDebuggerToggleKey.onDown.removeAll();
      this.staticDebuggerToggleKey.reset();
      this.staticDebuggerToggleKey = null;
    }
    if (this.staticDebugger) {
      this.staticDebugger.destroy();
      this.staticDebugger = null;
    }
    if (this.game.globals && this.game.globals.debugTools) {
      delete this.game.globals.debugTools.staticDebugger;
    }
    this.enemySpawner.destroy();
    this.storeUnsubscribe();
    // Destroy all plugins (MH: should we be doing this or more selectively removing plugins?)
    this.game.plugins.removeAll();
  }
}
