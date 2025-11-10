# Block Stacker → iPhone App Conversion Guide

**Project**: Block Stacker (Carnivale)
**Current Stack**: React + TypeScript + Canvas 2D + Vite
**Target Platform**: iOS (iPhone)
**Date Created**: 2025-11-10

---

## Table of Contents

1. [Overview & Approach Comparison](#overview--approach-comparison)
2. [Recommended Approach: React Native](#recommended-approach-react-native)
3. [Alternative Approach: Capacitor](#alternative-approach-capacitor)
4. [Alternative Approach: Native Swift](#alternative-approach-native-swift)
5. [Performance Considerations](#performance-considerations)
6. [App Store Preparation](#app-store-preparation)
7. [Post-Launch Roadmap](#post-launch-roadmap)

---

## Overview & Approach Comparison

### Current Architecture Analysis

**Strengths:**
- ✅ Clean separation: State (gameState.ts), Logic (gameLoop.ts), Rendering (rendering.ts)
- ✅ Delta-time-based physics (frame-rate independent)
- ✅ TypeScript for type safety
- ✅ 88 passing tests (97% passing)
- ✅ Modular visual effects system

**Dependencies:**
- React 18.2.0 (UI framework)
- Canvas 2D API (rendering)
- requestAnimationFrame (game loop)
- localStorage (high scores)

---

### Approach Comparison Table

| Approach | Dev Time | Performance | Code Reuse | App Store | Maintenance | Best For |
|----------|----------|-------------|------------|-----------|-------------|----------|
| **React Native** | 2-3 weeks | ⭐⭐⭐⭐ | 80-90% | Easy | Medium | **Recommended** |
| **Capacitor** | 1-2 weeks | ⭐⭐⭐ | 95%+ | Easy | Easy | Quick launch |
| **Native Swift** | 4-6 weeks | ⭐⭐⭐⭐⭐ | 20% | Medium | Hard | Max performance |

---

## Recommended Approach: React Native

**Why React Native?**
- ✅ Reuse 80-90% of your TypeScript/React code
- ✅ Native performance with `react-native-skia` for Canvas rendering
- ✅ Active community and mature ecosystem
- ✅ Easy App Store submission
- ✅ Future Android port trivial

### Phase 1: Setup (Day 1)

#### 1.1 Install React Native CLI
```bash
# Install React Native CLI
npm install -g react-native-cli

# Or use Expo (easier, but some limitations)
npx create-expo-app BlockStacker --template blank-typescript
cd BlockStacker
```

#### 1.2 Project Structure
```
BlockStacker/
├── ios/                  # iOS native code (generated)
├── android/              # Android native code (generated, ignore for now)
├── src/
│   ├── gameState.ts     # ✅ Copy directly from web version
│   ├── gameLoop.ts      # ✅ Copy directly (95% compatible)
│   ├── rendering.ts     # ⚠️ Needs conversion to Skia
│   ├── App.tsx          # ⚠️ Needs mobile UI adaptation
│   └── components/
│       ├── GameCanvas.tsx
│       ├── StartScreen.tsx
│       ├── ScorePanel.tsx
│       └── Settings.tsx
├── package.json
└── app.json
```

---

### Phase 2: Port Core Logic (Days 2-3)

#### 2.1 Direct Ports (No Changes)
Copy these files as-is:
- ✅ `gameState.ts` - 100% compatible
- ✅ `gameLoop.ts` - 100% compatible (just update imports)
- ✅ All test files

```typescript
// No changes needed!
import { GameState, initializeGame } from './gameState';
import { gameLoop, handleButtonPress } from './gameLoop';
```

#### 2.2 Rendering with React Native Skia

**Install Skia:**
```bash
npm install @shopify/react-native-skia
```

**Convert rendering.ts to Skia:**

```typescript
// rendering-native.ts
import { Canvas, Path, Rect, RoundedRect, Circle } from '@shopify/react-native-skia';
import { GameState } from './gameState';

export function GameCanvas({ state }: { state: GameState }) {
  return (
    <Canvas style={{ width: 440, height: 740 }}>
      {/* Background */}
      <Rect x={0} y={0} width={440} height={740} color="#1a1a2e" />

      {/* Grid */}
      {renderGrid(state)}

      {/* Blocks with squash effects */}
      {state.blocks.map((block, i) => {
        const squash = state.squashEffects.find(
          e => e.column === block.column && e.row === block.row
        );
        return <Block key={i} block={block} squash={squash} />;
      })}

      {/* Moving blocks */}
      {state.movingBlocks.map((block, i) => (
        <MovingBlock key={i} block={block} position={state.position} />
      ))}

      {/* Falling blocks */}
      {state.fallingBlocks.map((fb, i) => (
        <FallingBlock key={i} fallingBlock={fb} />
      ))}

      {/* Particles */}
      {state.particles.map((p, i) => (
        <Circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={p.size}
          color={p.color}
          opacity={p.lifetime / p.maxLifetime}
        />
      ))}

      {/* Color flash overlay */}
      {state.colorFlash && (
        <Rect
          x={0}
          y={0}
          width={440}
          height={740}
          color={state.colorFlash.color}
          opacity={state.colorFlash.opacity}
        />
      )}
    </Canvas>
  );
}
```

#### 2.3 Game Loop Integration

```typescript
// App.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { GameState, initializeGame } from './gameState';
import { gameLoop, handleButtonPress } from './gameLoop';
import { GameCanvas } from './rendering-native';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(
    () => initializeGame('carnivale-30')
  );
  const [gameStarted, setGameStarted] = useState(false);
  const gameStateRef = useRef<GameState>(gameState);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Game loop
  useEffect(() => {
    if (!gameStarted) return;

    const animate = () => {
      setGameState(prevState => gameLoop(prevState));
      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [gameStarted]);

  const handlePress = () => {
    setGameState(prevState => handleButtonPress(prevState));
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#1a1a2e' }}>
      {!gameStarted ? (
        <StartScreen onStart={() => setGameStarted(true)} />
      ) : (
        <>
          <GameCanvas state={gameState} />
          <TouchableOpacity onPress={handlePress} style={styles.button}>
            <Text style={styles.buttonText}>PLACE BLOCKS</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
```

---

### Phase 3: Mobile UI Adaptation (Days 4-5)

#### 3.1 Touch Controls

```typescript
// TouchControls.tsx
import { TouchableOpacity, View, StyleSheet } from 'react-native';

export function TouchControls({ onPlace, onRestart, disabled }: Props) {
  return (
    <View style={styles.container}>
      {/* Large tap area for primary action */}
      <TouchableOpacity
        onPress={onPlace}
        disabled={disabled}
        style={[styles.placeButton, disabled && styles.disabled]}
        activeOpacity={0.7}
      >
        <Text style={styles.placeText}>PLACE BLOCKS</Text>
      </TouchableOpacity>

      {/* Secondary controls */}
      <View style={styles.secondaryRow}>
        <TouchableOpacity onPress={onRestart} style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>Restart</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onSettings} style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>⚙️ Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  placeButton: {
    backgroundColor: '#00d9ff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  placeText: {
    color: '#000',
    fontSize: 24,
    fontWeight: 'bold',
  },
  // ... more styles
});
```

#### 3.2 Responsive Layout

```typescript
// useDeviceDimensions.ts
import { Dimensions, Platform } from 'react-native';

export function useDeviceDimensions() {
  const { width, height } = Dimensions.get('window');
  const isSmallDevice = width < 375;

  // Scale canvas to fit device
  const canvasScale = Math.min(width / 440, (height * 0.6) / 740);

  return {
    screenWidth: width,
    screenHeight: height,
    canvasWidth: 440 * canvasScale,
    canvasHeight: 740 * canvasScale,
    scale: canvasScale,
    isSmallDevice,
  };
}
```

#### 3.3 Safe Area Support

```bash
npm install react-native-safe-area-context
```

```typescript
import { SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      {/* Your app content */}
    </SafeAreaView>
  );
}
```

---

### Phase 4: Native Features (Days 6-7)

#### 4.1 Haptic Feedback

```bash
npm install react-native-haptic-feedback
```

```typescript
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

// On block placement
ReactNativeHapticFeedback.trigger('impactLight');

// On perfect placement
ReactNativeHapticFeedback.trigger('notificationSuccess');

// On game over
ReactNativeHapticFeedback.trigger('notificationError');
```

#### 4.2 AsyncStorage (High Scores)

```bash
npm install @react-native-async-storage/async-storage
```

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function saveHighScore(score: number): Promise<void> {
  const current = await loadHighScore();
  if (score > current) {
    await AsyncStorage.setItem('high_score', score.toString());
  }
}

export async function loadHighScore(): Promise<number> {
  const stored = await AsyncStorage.getItem('high_score');
  return stored ? parseInt(stored, 10) : 0;
}
```

#### 4.3 Sound Effects (Optional)

```bash
npm install react-native-sound
```

```typescript
// soundManager.ts
import Sound from 'react-native-sound';

Sound.setCategory('Playback');

export const sounds = {
  place: new Sound('place.mp3', Sound.MAIN_BUNDLE),
  perfect: new Sound('perfect.mp3', Sound.MAIN_BUNDLE),
  fall: new Sound('fall.mp3', Sound.MAIN_BUNDLE),
  combo: new Sound('combo.mp3', Sound.MAIN_BUNDLE),
};

export function playSound(name: keyof typeof sounds) {
  sounds[name].play();
}
```

---

### Phase 5: Testing & Optimization (Days 8-9)

#### 5.1 Performance Profiling

```typescript
import { PerformanceObserver, performance } from 'react-native-performance';

// Track frame rate
const observer = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach((entry) => {
    console.log(`Frame time: ${entry.duration}ms`);
  });
});

observer.observe({ entryTypes: ['measure'] });
```

#### 5.2 Memory Management

```typescript
useEffect(() => {
  // Cleanup animations on unmount
  return () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    // Clear any timers
    clearTimeout(timerId);
  };
}, []);
```

#### 5.3 Device Testing Checklist

- [ ] iPhone SE (small screen)
- [ ] iPhone 14 Pro (notch)
- [ ] iPhone 14 Pro Max (large screen)
- [ ] iPad (optional, different aspect ratio)
- [ ] iOS 15.0 (minimum supported)
- [ ] iOS 17.0 (latest)

---

### Phase 6: Build & Deploy (Days 10-11)

#### 6.1 Configure App Metadata

**Edit `ios/BlockStacker/Info.plist`:**
```xml
<key>CFBundleDisplayName</key>
<string>Block Stacker</string>
<key>CFBundleIdentifier</key>
<string>com.yourcompany.blockstacker</string>
<key>CFBundleVersion</key>
<string>1.0.0</string>
```

#### 6.2 App Icons & Launch Screen

Use [App Icon Generator](https://appicon.co/):
1. Upload 1024x1024 icon
2. Download iOS icons
3. Replace in `ios/BlockStacker/Images.xcassets/AppIcon.appiconset/`

Launch screen:
```typescript
// App.tsx
import SplashScreen from 'react-native-splash-screen';

useEffect(() => {
  SplashScreen.hide();
}, []);
```

#### 6.3 Build for TestFlight

```bash
# 1. Open Xcode
open ios/BlockStacker.xcworkspace

# 2. Select "Any iOS Device (arm64)" as target

# 3. Product → Archive

# 4. Distribute App → App Store Connect → Upload

# 5. Wait for processing (15-30 minutes)

# 6. Add to TestFlight in App Store Connect
```

---

## Alternative Approach: Capacitor

**Pros:**
- ✅ Minimal code changes (95%+ reuse)
- ✅ Fastest time to market (1-2 weeks)
- ✅ Easy maintenance

**Cons:**
- ⚠️ Slightly lower performance than React Native
- ⚠️ WebView-based (not true native)

### Quick Start

```bash
# 1. Install Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios

# 2. Initialize Capacitor
npx cap init BlockStacker com.yourcompany.blockstacker

# 3. Build web version
npm run build

# 4. Add iOS platform
npx cap add ios

# 5. Copy web build to iOS
npx cap copy ios

# 6. Open in Xcode
npx cap open ios
```

### Capacitor-Specific Changes

**Add plugins for native features:**
```bash
npm install @capacitor/haptics
npm install @capacitor/preferences  # For storage
```

**Update code:**
```typescript
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';

// Haptic feedback
await Haptics.impact({ style: ImpactStyle.Light });

// Storage
await Preferences.set({ key: 'high_score', value: score.toString() });
const { value } = await Preferences.get({ key: 'high_score' });
```

**Performance optimization:**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },
});
```

---

## Alternative Approach: Native Swift

**Pros:**
- ✅ Maximum performance
- ✅ Best iOS integration
- ✅ Smallest app size

**Cons:**
- ❌ Rewrite entire codebase
- ❌ Longest dev time (4-6 weeks)
- ❌ No code sharing with web

### Architecture Overview

```
BlockStacker/
├── Models/
│   ├── GameState.swift      # Port from gameState.ts
│   ├── Block.swift
│   └── Difficulty.swift
├── GameLogic/
│   ├── GameLoop.swift        # Port from gameLoop.ts
│   ├── Physics.swift
│   └── Scoring.swift
├── Rendering/
│   ├── GameView.swift        # SpriteKit or Metal
│   ├── BlockRenderer.swift
│   └── ParticleSystem.swift
├── UI/
│   ├── StartScreen.swift
│   ├── GameScreen.swift
│   └── SettingsView.swift
└── Resources/
    ├── Assets.xcassets
    └── Sounds/
```

### Key Swift Conversions

**GameState:**
```swift
struct GameState {
    var gridWidth: Int = 7
    var gridHeight: Int = 15
    var level: Int = 0
    var blocks: [Block] = []
    var movingBlocks: [Block] = []
    var fallingBlocks: [FallingBlock] = []
    var squashEffects: [SquashEffect] = []
    var particles: [Particle] = []
    var screenShake: ScreenShake?
    var colorFlash: ColorFlash?
    // ... rest of state
}

struct Block {
    var column: Int
    var row: Int
    var placed: Bool
}
```

**Game Loop:**
```swift
class GameLoop {
    private var displayLink: CADisplayLink?
    private var lastUpdate: TimeInterval = 0

    func start() {
        displayLink = CADisplayLink(target: self, selector: #selector(update))
        displayLink?.add(to: .main, forMode: .common)
    }

    @objc private func update() {
        let currentTime = CACurrentMediaTime()
        let deltaTime = currentTime - lastUpdate
        lastUpdate = currentTime

        gameState = updatePosition(state: gameState, deltaTime: deltaTime)
        gameState = updateFallingBlocks(state: gameState, deltaTime: deltaTime)
        gameState = updateParticles(state: gameState, deltaTime: deltaTime)
        // ...
    }
}
```

**Rendering with SpriteKit:**
```swift
import SpriteKit

class GameScene: SKScene {
    func renderBlock(_ block: Block) {
        let sprite = SKSpriteNode(color: .cyan, size: CGSize(width: 40, height: 40))
        sprite.position = CGPoint(x: block.column * 40, y: block.row * 40)
        addChild(sprite)
    }

    func renderParticles(_ particles: [Particle]) {
        for particle in particles {
            let node = SKShapeNode(circleOfRadius: CGFloat(particle.size))
            node.fillColor = UIColor(hex: particle.color)
            node.alpha = CGFloat(particle.opacity)
            node.position = CGPoint(x: particle.x, y: particle.y)
            addChild(node)
        }
    }
}
```

---

## Performance Considerations

### Target Frame Rate: 60 FPS

**Optimization Checklist:**
- [ ] Use `useMemo` for expensive calculations
- [ ] Avoid re-renders during game loop
- [ ] Batch particle rendering
- [ ] Use native driver for animations
- [ ] Profile with React DevTools / Instruments
- [ ] Test on oldest supported device (iPhone 8)

### Memory Management

```typescript
// Limit active particles
const MAX_PARTICLES = 100;
if (state.particles.length > MAX_PARTICLES) {
  state.particles = state.particles.slice(-MAX_PARTICLES);
}

// Clear old effects
state.squashEffects = state.squashEffects.filter(e => e.duration > 0);
state.fallingBlocks = state.fallingBlocks.filter(fb => fb.row > -2);
```

### Battery Optimization

```typescript
// Reduce frame rate when app is in background
import { AppState } from 'react-native';

useEffect(() => {
  const subscription = AppState.addEventListener('change', nextAppState => {
    if (nextAppState === 'background') {
      // Pause game loop
      setGameState(prev => ({ ...prev, paused: true }));
    }
  });

  return () => subscription.remove();
}, []);
```

---

## App Store Preparation

### 1. App Store Connect Setup

**Required Information:**
- App Name: "Block Stacker: Carnivale"
- Subtitle: "Stack blocks perfectly to win prizes"
- Description: [See template below]
- Keywords: block, stacker, arcade, puzzle, carnival, game
- Category: Games > Arcade
- Age Rating: 4+

**Description Template:**
```
🎪 CARNIVALE BLOCK STACKER 🎪

Stack blocks perfectly to reach the top and win the major prize!

FEATURES:
✨ Smooth falling block animations
✨ Satisfying squash effects on landing
✨ Particle explosions for perfect placements
✨ Screen shake for impact feedback
✨ Combo system with color flashes
✨ 6 difficulty levels (Carnivale -30% to Arcade)
✨ High score tracking
✨ Two spawn modes (Reset Left / Resume)

GAMEPLAY:
- Tap to place blocks as they move across the screen
- Stack perfectly to keep all your blocks
- Misaligned blocks fall off!
- Reach row 11 for Minor Prize
- Reach row 15 for Major Prize
- Build combos for bonus points

SCORING:
- Base points for each block placed
- Speed bonus for quick reactions
- Combo multiplier for consecutive perfect placements

Perfect for quick arcade sessions or high-score challenges!

SUPPORT:
Questions? Contact us at support@yourcompany.com
```

### 2. Screenshots (Required Sizes)

Generate screenshots for:
- 6.7" (iPhone 14 Pro Max): 1290 × 2796
- 6.5" (iPhone 11 Pro Max): 1242 × 2688
- 5.5" (iPhone 8 Plus): 1242 × 2208

**Screenshot Ideas:**
1. Start screen with title
2. Gameplay showing blocks falling
3. Perfect placement with particle burst
4. High combo with color flash
5. Victory screen showing major prize

### 3. App Preview Video (Optional but Recommended)

**Script:**
1. (0-3s) Title card: "Block Stacker"
2. (3-10s) Show start screen, tap "Start Game"
3. (10-20s) Gameplay: Place a few blocks
4. (20-25s) Show perfect placement with particles
5. (25-30s) Show combo building with color flashes

### 4. Privacy Policy (Required)

**Template:**
```markdown
# Privacy Policy for Block Stacker

We collect no personal data.

High scores are stored locally on your device and never transmitted.

No analytics, no tracking, no ads.

Contact: privacy@yourcompany.com
```

Host at: `https://yourwebsite.com/blockstacker/privacy`

### 5. App Review Guidelines Compliance

**Checklist:**
- [ ] No crashes or bugs
- [ ] No placeholder content
- [ ] App functions as described
- [ ] No external payment systems (use IAP if needed)
- [ ] Respects user privacy
- [ ] Appropriate for age rating

---

## Post-Launch Roadmap

### Version 1.1 (Week 1-2 after launch)
- [ ] Add sound effects
- [ ] Add background music
- [ ] Add achievements
- [ ] Implement Game Center leaderboards
- [ ] Add daily challenges

### Version 1.2 (Month 1)
- [ ] New game mode: Endless
- [ ] New game mode: Time Attack
- [ ] Theme packs (neon, retro, minimal)
- [ ] Power-ups (slow-mo, undo, ghost preview)

### Version 2.0 (Month 2-3)
- [ ] Multiplayer (local 1v1)
- [ ] Online leaderboards
- [ ] Tournaments
- [ ] Spectator mode for top players
- [ ] Replay system

---

## Estimated Timeline & Budget

### React Native Approach (Recommended)

**Timeline:**
- Week 1: Setup + Core logic port
- Week 2: Rendering + Mobile UI
- Week 3: Native features + Testing
- Week 4: App Store submission + TestFlight beta
- **Total: 3-4 weeks**

**Cost Breakdown:**
| Item | Cost |
|------|------|
| Developer time (3-4 weeks @ $100/hr) | $12,000 - $16,000 |
| Apple Developer Account (annual) | $99 |
| App icons/assets | $200 - $500 |
| Sound effects | $100 - $300 |
| **Total** | **$12,399 - $16,899** |

### Capacitor Approach (Fastest)

**Timeline:**
- Week 1: Setup + Capacitor integration
- Week 2: Native features + Testing + App Store
- **Total: 1.5-2 weeks**

**Cost:**
- Developer time: $6,000 - $8,000
- Other costs: $399 (same as above)
- **Total: $6,399 - $8,399**

---

## FAQ

### Q: Can I reuse the tests?
**A:** Yes! 95% of tests work without changes. Just update imports:
```typescript
// From:
import { initializeGame } from './gameState';

// To:
import { initializeGame } from '../src/gameState';
```

### Q: What about Android?
**A:** React Native and Capacitor support Android with minimal extra work (80-90% code reuse). Add 1-2 weeks for Android-specific testing and Google Play submission.

### Q: Do I need a Mac?
**A:** Yes, iOS development requires a Mac with Xcode. Alternatives:
- MacStadium (rent a Mac in the cloud)
- MacinCloud
- Use React Native with Expo (can build on their servers)

### Q: How do I monetize?
**A:** Options:
1. **Paid app** ($0.99 - $4.99)
2. **In-app purchases** (remove ads, unlock themes)
3. **Ads** (banner, interstitial, rewarded video)
4. **Freemium** (free with limits, unlock with purchase)

For arcade games, **freemium + rewarded video ads** works best.

### Q: Can I update the web version and iOS separately?
**A:** With Capacitor: Yes (web updates instantly, iOS needs App Store approval)
With React Native: No (both need app updates)

---

## Resources

### Documentation
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [React Native Skia](https://shopify.github.io/react-native-skia/)
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Apple Developer Portal](https://developer.apple.com)

### Tools
- [App Icon Generator](https://appicon.co/)
- [Launch Screen Generator](https://www.apetools.webprofusion.com/)
- [Screenshot Framer](https://screenshots.pro/)
- [TestFlight](https://developer.apple.com/testflight/)

### Communities
- [React Native Discord](https://discord.gg/react-native)
- [r/reactnative](https://reddit.com/r/reactnative)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/react-native)

---

## Decision Matrix

Use this to choose your approach:

| Priority | Best Approach |
|----------|---------------|
| **Time to market** | Capacitor |
| **Performance** | React Native or Native Swift |
| **Code reuse** | Capacitor (95%) > React Native (85%) > Swift (20%) |
| **Maintenance** | Capacitor (easiest) > React Native > Swift (hardest) |
| **Future Android** | React Native (trivial) > Capacitor (easy) > Swift (full rewrite) |
| **Budget** | Capacitor ($6-8k) < React Native ($12-16k) < Swift ($20-30k) |

**Recommendation for Block Stacker:**
- **Start with React Native** for best balance of performance, code reuse, and future-proofing
- **Use Expo** to simplify setup and build process
- **Add Skia** for canvas rendering performance
- **Launch on iOS first**, then Android later

---

## Next Steps

1. **Choose approach** (React Native recommended)
2. **Setup development environment**
3. **Port core logic** (Days 1-3)
4. **Implement mobile UI** (Days 4-5)
5. **Add native features** (Days 6-7)
6. **Test on devices** (Days 8-9)
7. **Submit to App Store** (Days 10-11)
8. **Launch & iterate** (Ongoing)

**Questions?** Consult the approach-specific sections above for detailed implementation guides.

---

**Last Updated**: 2025-11-10
**Version**: 1.0
**Author**: Claude (Autonomous Development Team)
