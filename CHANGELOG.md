# Changelog

All notable changes to Block Stacker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- **Falling Block Animation System** (2025-11-10)
  - Added `FallingBlock` interface with position, velocity, and opacity properties
  - Trimmed/overhang blocks now animate falling off screen with gravity
  - Falling blocks fade out during descent (2.0 opacity/second)
  - Gravity acceleration: 8 rows/second²
  - Falling blocks rendered in red/orange (#ff4444) to distinguish from active blocks
  - Blocks removed from render when they fall below row -2

### Changed
- **Game Loop Enhancement** (2025-11-10)
  - `gameLoop()` now updates falling blocks even when game is over
  - Allows falling animation to complete after game ends
  - Falling block updates occur before position updates

- **Game State Structure** (2025-11-10)
  - Added `fallingBlocks: FallingBlock[]` array to GameState
  - `initializeGame()` now initializes empty fallingBlocks array
  - `placeBlocks()` converts trimmed blocks to falling blocks on placement

### Technical
- **New Functions** (2025-11-10)
  - `updateFallingBlocks(state, deltaTime)`: Applies gravity and fade to falling blocks
  - `drawFallingBlock(ctx, fallingBlock, gridHeight)`: Renders falling block with opacity

- **Module Exports** (2025-11-10)
  - Exported `FallingBlock` type from gameState.ts
  - Imported `FallingBlock` in gameLoop.ts and rendering.ts

### Fixed
- **Test Suite** (2025-11-10)
  - Removed unused type imports from gameState.test.ts
  - All 88 tests passing after falling animation implementation

### Testing
- **Build Status**: ✅ Passing (vite build successful)
- **Test Status**: ✅ All 88 tests passing
- **Manual Testing**: Pending visual verification in browser

---

## [0.1.0] - Previous State (Before 2025-11-10)

### Features
- Core block stacking game with oscillating blocks
- 6 difficulty modes (Carnivale -30/-25/-20%, Easy, Normal, Arcade)
- 2 spawn modes (Reset Left, Resume)
- Prize system (Minor at row 11, Major at row 15)
- Professional start screen with instructions
- Settings modal for difficulty and spawn mode
- Score system with:
  - Base points (blocks × 10 × level × difficulty multiplier)
  - Speed bonus (0-100 points based on reaction time)
  - Combo multiplier (1.0x to 1.5x for consecutive perfect placements)
- High score persistence in localStorage
- Alignment tolerance system (0.25-0.45 based on difficulty)
- Responsive 440×740px canvas with 7×15 grid
- Keyboard controls (Space to place, R to restart)
- Visual indicators for prize rows
- Game over and victory screens
- 88 passing unit tests

### Technical Stack
- React 18.2.0
- TypeScript 5.2.2
- Vite 5.0.8 (build tool)
- Vitest 1.6.1 (testing)
- Canvas 2D rendering
- CSS3 animations

---

## Implementation Notes

### Falling Animation Implementation Details

**Physics Model**:
- Initial velocity: 0 rows/second
- Gravity: 8 rows/second² (feels natural, not too fast/slow)
- Position updates: `row -= velocity × deltaSeconds`
- Velocity updates: `velocity += gravity × deltaSeconds`

**Visual Feedback**:
- Opacity starts at 1.0 (fully visible)
- Fades at 2.0 opacity/second
- Color: Red/orange (#ff4444) with light border (#ffaaaa)
- Glow effect: 10px shadow blur

**Performance Considerations**:
- Falling blocks filtered out when row < -2 (off-screen)
- Uses existing requestAnimationFrame loop
- No additional performance impact observed
- Delta-time based for frame-rate independence

**Design Decisions**:
1. **Red color**: Clearly distinguishes falling blocks from active gameplay
2. **Fade effect**: Smooth visual transition prevents abrupt disappearance
3. **Gravity feel**: 8 rows/s² balanced between realistic and game-feel
4. **Always update**: Falling blocks animate even during game-over for polish

### Next Steps (Per MASTER_PLAN.md)
- Phase 1.1: Block placement squash animation
- Phase 1.1: Particle burst on perfect placement
- Phase 1.1: Screen shake system
- Phase 1.1: Combo color flash

---

## Development Process

### Commit Strategy
- Commit after each completed feature
- Include testing results in commit message
- Reference MASTER_PLAN.md phase and task number

### Testing Protocol
1. Run `npm run build` - ensure no TypeScript errors
2. Run `npm test` - ensure all tests pass
3. Manual testing in dev server (`npm run dev`)
4. Visual inspection of animations/effects
5. Mobile testing for responsive features

### Branch Management
- Main work branch: `claude/block-falling-animation-011CUyxxAcJYCdjbceojkY2P`
- Feature experiments: Create feature/ branches
- Commit regularly with clear messages
- Push after each phase completion

---

## Changelog Conventions

### Categories
- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements
- **Technical**: Internal/code changes
- **Testing**: Test-related changes

### Format
```markdown
### Category
- **Feature Name** (YYYY-MM-DD)
  - Detailed description line 1
  - Detailed description line 2
  - Technical details if relevant
```

---

**Last Updated**: 2025-11-10
**Next Update**: After next feature completion
