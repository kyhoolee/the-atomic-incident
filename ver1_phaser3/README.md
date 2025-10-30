# The Atomic Incident — Phaser 3 Rewrite

This folder contains the new Phaser 3 + TypeScript implementation scaffold based on the updated design docs.

## Getting Started
1. Install dependencies (requires Node 18+):
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```

## Project Structure
```
src/
  config/          # Game constants
  core/            # Shared adapters, events, state types
  scenes/          # Boot, Load, Menu, Contract, GameOver scenes
  systems/         # Lighting, physics, damage, status, spawn stubs
  gameplay/        # Player, enemy, weapon, projectile, pickup placeholders
  ui/              # Menu/HUD view scaffolding
```

The code currently focuses on architecture scaffolding and interfaces. Functional gameplay should be implemented following the documentation in the `doc/` directory.

## Dev Utilities
- Press `I` at the menu to open the Input Debug Scene (visualizes MOVE/AIM/FIRE mappings).
- Press `T` at the menu to open the TouchPad Debug Scene (virtual dual joystick demo).
