# Carnival Block Stacker

A web-based simulation of the classic carnival/arcade Block Stacker game. Built with React, TypeScript, and Canvas API.

## Features

- ✅ Authentic game mechanics matching real arcade behavior
- ✅ Three difficulty modes (Easy, Normal, Arcade)
- ✅ Progressive speed increase with each level
- ✅ Block trimming on misalignment
- ✅ Minor Prize (Row 11) and Major Prize (Row 15) levels
- ✅ High score persistence using localStorage
- ✅ Comprehensive test suite with 44 tests

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Testing

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui
```

## Building

```bash
npm run build
```

## How to Play

1. Press **SPACE** or **Click** to place blocks
2. Align blocks perfectly to keep them all
3. Misaligned blocks will be trimmed off
4. Reach row 11 for Minor Prize
5. Reach row 15 for Major Prize
6. Press **R** to restart

## Game Mechanics

- **Starting Blocks**: 3 blocks moving horizontally
- **Movement**: Continuous left-right oscillation
- **Speed**: Increases ~10% per level (configurable by difficulty)
- **Alignment**: Only blocks aligned with the row below are kept
- **Win Condition**: Successfully place blocks on row 15
- **Lose Condition**: No blocks align with the base

## Difficulty Modes

### Easy
- Base Speed: 1500ms
- Speed Increase: 5% per level
- Forgiving timing for learning

### Normal
- Base Speed: 1200ms
- Speed Increase: 10% per level
- Matches video timing

### Arcade
- Base Speed: 1000ms
- Speed Increase: 15% per level
- Challenging, fast-paced gameplay

## Architecture

- `src/gameState.ts` - Game state management and types
- `src/gameLoop.ts` - Core game logic (movement, placement, collision)
- `src/rendering.ts` - Canvas rendering system
- `src/App.tsx` - Main React component
- `src/*.test.ts` - Comprehensive test suite

## Test Coverage

- ✅ Game initialization
- ✅ Oscillation timing calculations
- ✅ Block movement and direction changes
- ✅ Block placement and alignment
- ✅ Block trimming mechanics
- ✅ Score calculation
- ✅ Win/lose conditions
- ✅ Progressive difficulty
- ✅ High score persistence
- ✅ Full game integration scenarios

All 44 tests passing ✓

## License

MIT
