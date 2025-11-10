# Block Stacker → iOS App: 1-2 Day Conversion Guide

**Goal**: Ship to TestFlight in 24-48 hours
**Strategy**: Capacitor (wraps existing web app)
**Effort**: Minimal code changes required

---

## Why This Approach?

✅ **Zero code rewrite** - Your React app works as-is
✅ **1-2 days** - Fastest path to App Store
✅ **Full feature parity** - All animations, sounds, effects work
✅ **Native performance** - WKWebView is highly optimized
✅ **Easy updates** - Push web updates, rebuild quickly

---

## Day 1: Setup & Build (4-6 hours)

### Step 1: Install Capacitor (15 min)

```bash
cd /home/user/blockstacker

# Install Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios

# Initialize Capacitor
npx cap init "Block Stacker" "com.yourcompany.blockstacker" --web-dir=dist

# Add iOS platform
npx cap add ios
```

### Step 2: Configure for Mobile (30 min)

**Update `capacitor.config.ts`:**
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourcompany.blockstacker',
  appName: 'Block Stacker',
  webDir: 'dist',
  bundledWebRuntime: false,
  ios: {
    contentInset: 'always',
    backgroundColor: '#1a1a2e'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a1a2e',
      showSpinner: false
    }
  }
};

export default config;
```

**Update `index.html` - Add viewport meta:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
```

### Step 3: Mobile-Specific Fixes (1-2 hours)

**A. Prevent zoom/bounce (already in CSS, verify):**
```css
/* In App.css - add if missing */
html, body {
  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
}

canvas {
  touch-action: none;
}
```

**B. Safe Area Support:**
```css
/* Add to App.css for iPhone notch */
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
```

**C. Haptic Feedback (Optional):**
```bash
npm install @capacitor/haptics
```

```typescript
// In App.tsx (optional)
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const handleClick = () => {
  Haptics.impact({ style: ImpactStyle.Light });
  // ... existing click logic
};
```

### Step 4: Build & Test (1-2 hours)

```bash
# Build web assets
npm run build

# Copy to iOS project
npx cap sync ios

# Open in Xcode
npx cap open ios
```

**In Xcode:**
1. Select your development team (Personal Team is fine for testing)
2. Change bundle identifier if needed
3. Select target device (your iPhone or Simulator)
4. Click ▶️ Run

**Test on device:**
- Touch controls work
- No zoom issues
- Sounds play correctly
- Animations smooth
- localStorage persists

---

## Day 2: Polish & Submit (4-8 hours)

### Step 1: App Icons & Launch Screen (1 hour)

**Generate icons:**
```bash
# Use https://www.appicon.co or similar
# Upload a 1024x1024 PNG of your game logo
# Download iOS icon set
```

**Add to Xcode:**
1. Open `ios/App/App/Assets.xcassets/AppIcon.appiconset`
2. Drag generated icons into slots
3. Add LaunchScreen.storyboard with your branding

### Step 2: App Store Assets (1-2 hours)

**Required:**
- App Icon (1024x1024)
- Screenshots (6.5" and 5.5" iPhone displays)
- Privacy Policy URL
- App Description
- Keywords

**Take screenshots:**
```bash
# Run app on iPhone 15 Pro Max simulator (6.5")
# Command+S to screenshot during gameplay
# Repeat for iPhone 8 Plus (5.5")
```

### Step 3: Build for TestFlight (30 min)

**In Xcode:**
1. Product → Archive
2. Distribute App → App Store Connect
3. Upload
4. Wait 10-30 minutes for processing

**In App Store Connect:**
1. Add to TestFlight
2. Add yourself as internal tester
3. Test on device via TestFlight app

### Step 4: Submit for Review (1-2 hours)

**App Store Connect:**
1. Create new app
2. Fill in metadata (name, description, category)
3. Upload screenshots
4. Set pricing (Free)
5. Add privacy policy
6. Submit for review

**Typical review time:** 24-48 hours

---

## Mobile Optimization Checklist

### Performance
- [x] Canvas rendering at 60 FPS
- [x] Delta-time physics (frame-rate independent)
- [x] Efficient effect updates
- [ ] Test on older devices (iPhone 8+)

### Touch Controls
- [x] Click works as tap
- [x] No accidental zooms
- [x] No scroll bounce
- [ ] Add swipe controls (optional)

### Audio
- [x] Web Audio API works in WebView
- [x] Volume controls
- [ ] Respect silent switch (optional)

### UI/UX
- [x] Responsive design works on all iPhone sizes
- [x] Buttons large enough for touch (44pt minimum)
- [ ] Keyboard controls disabled (mobile-only)
- [ ] Notch support (safe areas)

### Persistence
- [x] localStorage works (high scores)
- [x] Settings persist
- [ ] iCloud sync (optional future enhancement)

---

## Troubleshooting

### Issue: Black screen on iOS
```bash
# Rebuild and sync
npm run build
npx cap sync ios
```

### Issue: Sounds don't play
```typescript
// In App.tsx, ensure AudioContext resumes on touch
useEffect(() => {
  const resumeAudio = () => {
    soundManager.resumeAudioContext();
  };
  document.addEventListener('touchstart', resumeAudio, { once: true });
  return () => document.removeEventListener('touchstart', resumeAudio);
}, []);
```

### Issue: Zoom on double-tap
```css
/* Already in CSS, but verify */
touch-action: manipulation;
```

### Issue: Performance lag
```typescript
// In capacitor.config.ts
ios: {
  limitsNavigationsToAppBoundDomains: true,
  allowsBackForwardNavigationGestures: false
}
```

---

## Update Workflow (After Launch)

**To push updates:**
```bash
# 1. Make code changes
# 2. Build
npm run build

# 3. Sync to iOS
npx cap sync ios

# 4. Archive & upload in Xcode
# 5. Submit update (24-48 hour review)
```

**Hot tip:** Most web updates work instantly in WKWebView without rebuilding iOS app!

---

## Cost Breakdown

| Item | Cost | Notes |
|------|------|-------|
| Apple Developer Program | $99/year | Required for App Store |
| Domain (for privacy policy) | ~$10/year | Can use GitHub Pages free |
| Icon/Screenshot tools | Free | Use online generators |
| **Total Year 1** | **~$110** | Ongoing: $99/year |

---

## Timeline Summary

**Day 1 (4-6 hours):**
- ✅ Install Capacitor
- ✅ Configure project
- ✅ Mobile fixes
- ✅ Test on device

**Day 2 (4-8 hours):**
- ✅ Icons & launch screen
- ✅ Screenshots
- ✅ TestFlight build
- ✅ App Store submission

**Days 3-4:**
- ⏳ App review (Apple's timeline)

**Total Active Work:** 8-14 hours spread over 1-2 days

---

## Next Steps After Launch

1. **Gather feedback** - TestFlight users
2. **Monitor crashes** - Xcode Organizer
3. **Iterate quickly** - Update once per week
4. **Add features** - Use Phase 3 plan
5. **Cross-platform** - Android with same Capacitor setup (2 hours)

---

## Alternative: Even Faster with PWA

If you want to skip App Store entirely for now:

```bash
# Just add manifest.json and service worker
# Users can "Add to Home Screen" from Safari
# 0 App Store approval needed
# Full offline support
```

See `PWA_SETUP.md` for 1-hour PWA conversion guide.

---

## Questions?

**Q: Will all my animations work?**
A: Yes! WKWebView fully supports Canvas 2D, Web Audio, requestAnimationFrame.

**Q: What about Android?**
A: Run `npx cap add android` and you're 90% there. Same codebase.

**Q: Can I test without Apple Developer account?**
A: Yes! Use Xcode with Personal Team for device testing. Need $99 for App Store.

**Q: How do I update the app?**
A: Change code → `npm run build` → `npx cap sync` → Archive in Xcode → Upload.

**Q: Is Capacitor production-ready?**
A: Absolutely. Used by companies like Burger King, Southwest Airlines, etc.
