# AdMob Integration Guide - Block Stacker Carnivale

Complete guide for integrating banner ads, interstitial ads, and rewarded video ads using Google AdMob.

---

## Ad Strategy Overview

### Ad Types in This Game:

1. **Banner Ads** 🟦
   - Small ad at bottom of game screen
   - Always visible during gameplay
   - Low payout (~$0.50-2 CPM) but constant
   - **Placement:** Bottom of game canvas

2. **Interstitial Ads** 🟥
   - Full-screen ad between game sessions
   - Shows after game over every 3-5 attempts
   - Medium payout (~$5-10 CPM)
   - **Placement:** After game over screen dismissed

3. **Rewarded Video Ads** 🟩
   - User watches 15-30 second video voluntarily
   - Gets reward: Continue from Minor Prize checkpoint
   - High payout (~$10-20 CPM) + best user experience
   - **Placement:** Optional button at Minor Prize screen

### Expected Revenue (Rough Estimates):

| Daily Active Users | Daily Revenue | Monthly Revenue |
|-------------------|---------------|-----------------|
| 100 users | $2-5 | $60-150 |
| 1,000 users | $20-50 | $600-1,500 |
| 10,000 users | $200-500 | $6,000-15,000 |

*Actual revenue depends on geography, engagement, ad fill rates*

---

## PHASE 1: Google AdMob Setup

### Step 1: Create AdMob Account

1. Go to [admob.google.com](https://admob.google.com)
2. Click **Get Started**
3. Sign in with Google Account
4. Accept Terms of Service
5. Select country
6. Choose timezone
7. Click **Continue to AdMob**

### Step 2: Add Your iOS App

1. Click **Apps** in left sidebar
2. Click **Add App** button
3. **Is your app listed on a supported app store?** → Select **No**
   - (Your app isn't published yet)
4. **App name:** `Block Stacker Carnivale`
5. **Platform:** Select **iOS**
6. **Enable user metrics** → Toggle **ON**
7. Click **Add**

**IMPORTANT:** Save your **App ID**
- Looks like: `ca-app-pub-1234567890123456~0987654321`
- You'll need this later
- Store it in a safe place

### Step 3: Create Ad Units

You need to create 3 ad units (one for each ad type).

---

#### Ad Unit 1: Banner Ad

1. Go to **Apps** → Select your app
2. Click **Ad units** tab
3. Click **Add ad unit**
4. Select **Banner**
5. Configure:
   - **Ad unit name:** `Game Screen Banner`
   - **Banner size:** Select **Adaptive banner** (recommended)
6. Click **Create ad unit**

**IMPORTANT:** Save your **Banner Ad Unit ID**
- Looks like: `ca-app-pub-1234567890123456/1234567890`
- Copy and save this ID

---

#### Ad Unit 2: Interstitial Ad

1. Click **Add ad unit** again
2. Select **Interstitial**
3. Configure:
   - **Ad unit name:** `Game Over Interstitial`
4. Click **Create ad unit**

**IMPORTANT:** Save your **Interstitial Ad Unit ID**
- Looks like: `ca-app-pub-1234567890123456/0987654321`
- Copy and save this ID

---

#### Ad Unit 3: Rewarded Video Ad

1. Click **Add ad unit** again
2. Select **Rewarded**
3. Configure:
   - **Ad unit name:** `Continue Playing Reward`
   - **Reward amount:** `1`
   - **Reward item:** `Continue` (or `Life`)
4. Click **Create ad unit**

**IMPORTANT:** Save your **Rewarded Ad Unit ID**
- Looks like: `ca-app-pub-1234567890123456/1122334455`
- Copy and save this ID

---

### Step 4: Configure App Settings

1. Go to **Apps** → Your app → **App settings**
2. **App Store information:**
   - Leave blank for now (fill after app is published)
3. **Privacy & messaging:**
   - Click **Manage**
   - Configure privacy options based on your privacy policy
4. Click **Save**

---

## PHASE 2: Add AdMob to Your App

### Step 1: Install Capacitor AdMob Plugin

**On your Windows machine:**

```bash
cd C:\Users\nikhi\Desktop\BlockStacker
npm install @capacitor-community/admob
npx cap sync ios
```

### Step 2: Configure Ad IDs

The code implementation already includes ad configuration. You need to update the production IDs:

**File:** `src/config/adConfig.ts`

Replace placeholder IDs with your real IDs from AdMob:

```typescript
export const AD_CONFIG = {
  // PRODUCTION IDs - Replace these with your actual AdMob IDs
  production: {
    appId: 'ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY',  // Your App ID
    bannerId: 'ca-app-pub-XXXXXXXXXXXXXXXX/1111111111',  // Banner Ad Unit ID
    interstitialId: 'ca-app-pub-XXXXXXXXXXXXXXXX/2222222222',  // Interstitial ID
    rewardedId: 'ca-app-pub-XXXXXXXXXXXXXXXX/3333333333',  // Rewarded ID
  },

  // TEST IDs - These work for testing (leave as-is)
  test: {
    appId: 'ca-app-pub-3940256099942544~1458002511',
    bannerId: 'ca-app-pub-3940256099942544/2934735716',
    interstitialId: 'ca-app-pub-3940256099942544/4411468910',
    rewardedId: 'ca-app-pub-3940256099942544/1712485313',
  }
};
```

---

## PHASE 3: iOS Configuration (On Cloud Mac)

### Step 1: Update Info.plist

**File:** `ios/App/App/Info.plist`

Add your AdMob App ID to the file. Insert this before the final `</dict>` tag:

```xml
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY</string>
<key>SKAdNetworkItems</key>
<array>
  <dict>
    <key>SKAdNetworkIdentifier</key>
    <string>cstr6suwn9.skadnetwork</string>
  </dict>
</array>
```

Replace `ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY` with your actual AdMob App ID.

### Step 2: Add App Tracking Transparency

iOS requires permission to track users for ads. Add this to `Info.plist`:

```xml
<key>NSUserTrackingUsageDescription</key>
<string>This app uses your data to show personalized ads and support free gameplay.</string>
```

### Step 3: Install Pods

In Terminal on Cloud Mac:

```bash
cd ~/Desktop/blockstacker/ios/App
pod install
```

### Step 4: Rebuild in Xcode

1. Close Xcode if open
2. Run: `npx cap open ios`
3. Clean build: **Product → Clean Build Folder**
4. Build: **Product → Build**

---

## PHASE 4: Testing Ads

### Important: Always Test with Test IDs First!

**NEVER** use production ad IDs during development. AdMob will ban your account for clicking your own ads.

### Step 1: Enable Test Mode

In `src/config/adConfig.ts`, the app uses test IDs by default:

```typescript
// Testing mode - set to false when publishing
export const USE_TEST_ADS = true;
```

Keep this `true` while testing.

### Step 2: Test in iOS Simulator

1. Build and run in Xcode Simulator
2. **Banner Ad:** Should appear at bottom of game screen
3. **Interstitial Ad:** Play game 5 times, should show after 5th game over
4. **Rewarded Ad:** Reach Minor Prize, click "Watch Ad to Continue"

**Test ads show:**
- "Test Ad" label
- Simple placeholder designs
- Close instantly (no 30-second wait)

### Step 3: Test on Real Device

**Why test on real device?**
- Simulator doesn't show real ad rendering
- Real ads load and display properly
- Test actual user experience

**How to test on your iPhone:**

1. Connect iPhone to Cloud Mac via USB
2. In Xcode, select your iPhone from device dropdown
3. Click Run ▶
4. App installs on your phone

**With test ads:**
- ✅ You can click test ads freely
- ✅ No risk of account ban
- ✅ Ads load quickly

---

## PHASE 5: Go Live with Real Ads

### Step 1: Switch to Production IDs

**File:** `src/config/adConfig.ts`

```typescript
export const USE_TEST_ADS = false;  // Change to false
```

### Step 2: Rebuild and Upload

```bash
npm run build
npx cap sync ios
```

In Xcode:
1. Increment **Build** number (e.g., 1 → 2)
2. Archive: **Product → Archive**
3. Upload to App Store

### Step 3: AdMob App Store Setup

**After app is approved and live:**

1. Go to AdMob → **Apps** → Your app
2. Click **App settings**
3. **App Store information:**
   - **App Store ID:** Get from App Store Connect
   - Looks like: `1234567890`
4. Click **Save**

AdMob will verify your app is real and start serving real ads.

---

## PHASE 6: Understand Ad Revenue

### How AdMob Pays You

1. **Metrics:**
   - **Impressions:** How many times ads are shown
   - **Clicks:** How many times users click ads
   - **CTR (Click-Through Rate):** Clicks ÷ Impressions
   - **eCPM:** Earnings per 1,000 impressions

2. **Payment Threshold:** $100 minimum
   - Earn $100+ → AdMob pays you next month
   - Earn less → Rolls over to next month

3. **Payment Methods:**
   - Wire transfer (fastest)
   - Check (slower)
   - Must add payment info in AdMob settings

### View Earnings

1. Go to AdMob → **Reports**
2. See real-time data:
   - Impressions by ad type
   - Estimated earnings
   - CTR and eCPM
3. Data updates every ~30 minutes

---

## PHASE 7: Optimize Ad Performance

### Banner Ad Tips:

✅ **Do:**
- Place at bottom (less intrusive)
- Use adaptive banner (auto-sizes)
- Always visible during gameplay

❌ **Don't:**
- Cover game controls
- Block important UI
- Use huge banner sizes

### Interstitial Ad Tips:

✅ **Do:**
- Show at natural breaks (game over)
- Limit frequency (every 3-5 games)
- Let users know ad is coming

❌ **Don't:**
- Show mid-game (interrupts flow)
- Show too frequently (annoying)
- Force ads before user can play

### Rewarded Video Tips:

✅ **Do:**
- Offer valuable rewards (continue, extra life)
- Make it optional (user choice)
- Clear description of reward

❌ **Don't:**
- Force users to watch (kills engagement)
- Offer weak rewards (not worth it)
- Show too often

---

## PHASE 8: Policy Compliance

### App Store Requirements:

1. **Privacy Policy Required**
   - Must disclose ad usage
   - Must explain data collection
   - Link in App Store listing

2. **Child Safety (COPPA)**
   - If game is for kids under 13:
     - Enable child-directed treatment in AdMob
     - Limit ad personalization
   - Block Stacker is likely 4+ rating (safe for kids)

3. **Gambling Content**
   - Block Stacker is skill-based (not gambling)
   - No issues with App Store

### AdMob Requirements:

1. **Don't Click Your Own Ads**
   - AdMob bans accounts for click fraud
   - Use test ads during development
   - Never click production ads in your app

2. **No Ad Manipulation**
   - Don't encourage users to click ads
   - No "Click ad to support us" messages
   - Let ads speak for themselves

3. **Content Guidelines**
   - No violent content near ads
   - No inappropriate game content
   - Block Stacker is family-friendly ✅

---

## Ad Implementation Details

The implementation is already complete in the codebase. Here's what was added:

### Files Created:

1. **`src/config/adConfig.ts`**
   - Ad IDs configuration
   - Test vs production mode toggle

2. **`src/services/adService.ts`**
   - AdMob initialization
   - Banner, interstitial, rewarded ad logic
   - Error handling
   - Ad loading and display functions

### Files Modified:

1. **`src/App.tsx`**
   - Banner ad display
   - Interstitial ad triggers (every 3-5 games)
   - Rewarded ad button at Minor Prize

2. **`src/gameState.ts`**
   - Added `gamesPlayedSinceAd` counter
   - Tracks attempts for interstitial frequency

### How It Works:

**Banner Ad:**
- Loads when app starts
- Displays at bottom of game screen
- Hides on start screen, shows during game
- Auto-refreshes every 60 seconds

**Interstitial Ad:**
- Preloads after banner loads
- Shows after game over on 3rd or 5th attempt (random)
- Resets counter after showing
- Non-intrusive timing

**Rewarded Video:**
- Button appears at Minor Prize screen
- User clicks "Watch Ad to Continue"
- After watching, game continues from Minor Prize row
- No penalty if user declines

---

## Troubleshooting

### "Ads not showing in Simulator"

**Cause:** Simulator doesn't always load test ads properly.

**Fix:** Test on real device.

---

### "Error: AdMob is not initialized"

**Cause:** Missing App ID in Info.plist or incorrect ID.

**Fix:**
1. Check `ios/App/App/Info.plist` has correct `GADApplicationIdentifier`
2. Run `npx cap sync ios`
3. Rebuild in Xcode

---

### "No ad fill" / Blank ad space

**Cause:** AdMob has no ads to serve (rare).

**Fix:**
- Normal during testing with low traffic
- Improves after app is published
- Check AdMob dashboard for fill rate

---

### "Ads showing slowly" / Long load times

**Cause:** Network latency or low ad inventory.

**Fix:**
- Preload ads (already implemented)
- Nothing else you can control

---

### "Account banned" / "Ad serving disabled"

**Cause:** Clicked your own ads or violated policy.

**Fix:**
- Appeal in AdMob (rarely successful)
- Create new account with different info
- **Prevention:** ALWAYS use test ads during development

---

## Testing Checklist

Before submitting to App Store:

- [ ] Switched to production ad IDs in `adConfig.ts`
- [ ] Set `USE_TEST_ADS = false`
- [ ] Banner ad displays correctly on real device
- [ ] Interstitial shows after 3-5 games
- [ ] Rewarded ad button works at Minor Prize
- [ ] No crashes when ads load/fail
- [ ] Privacy policy added to App Store listing
- [ ] Info.plist has AdMob App ID
- [ ] Tested on multiple devices

---

## Revenue Maximization Tips

### 1. Increase Engagement
- More gameplay = more ads shown = more revenue
- Add daily challenges or leaderboards

### 2. Optimal Ad Frequency
- Too few ads = low revenue
- Too many ads = users quit
- **Sweet spot:** 1 interstitial every 3-5 games (already implemented)

### 3. Geographic Targeting
- Ads in US/Canada/Europe pay more
- Consider localizing app for these markets

### 4. Retention is Key
- Users who return daily see more ads
- Push notifications for "Come back and play!"
- Daily rewards to encourage return

### 5. Monitor Metrics
- Check AdMob dashboard daily
- Track which ad types perform best
- Adjust strategy based on data

---

## Support Resources

- **AdMob Help Center:** [support.google.com/admob](https://support.google.com/admob)
- **Capacitor AdMob Plugin Docs:** [github.com/capacitor-community/admob](https://github.com/capacitor-community/admob)
- **AdMob Policies:** [support.google.com/admob/answer/6128543](https://support.google.com/admob/answer/6128543)

---

## Next Steps

1. ✅ Read this guide completely
2. ⬜ Create AdMob account
3. ⬜ Create 3 ad units (banner, interstitial, rewarded)
4. ⬜ Add your production IDs to `src/config/adConfig.ts`
5. ⬜ Test with test ads on real device
6. ⬜ Switch to production ads before App Store upload
7. ⬜ Monitor revenue in AdMob dashboard

---

**Questions?** Refer to:
- `IOS_DEPLOYMENT_GUIDE.md` for deployment steps
- `IMPLEMENTATION_REPORT.md` for technical details
