# iOS Deployment Guide - Block Stacker Carnivale

Complete step-by-step guide for deploying this React app to iOS App Store using Cloud Mac services.

---

## Prerequisites

- ✅ React app built and working (already done)
- ❌ Mac computer (we're using cloud Mac instead)
- ❌ Apple Developer Account ($99/year)
- ❌ Cloud Mac service subscription

---

## PHASE 1: Set Up Cloud Mac Service

### Option A: MacStadium (Recommended)

**Cost:** ~$79/month (or hourly plans available)

1. **Sign Up**
   - Go to [macstadium.com](https://www.macstadium.com)
   - Choose "Mac Mini" plan
   - Select macOS version (choose latest stable)
   - Complete checkout

2. **Receive Credentials**
   - Wait for provisioning email (usually 1-2 hours)
   - You'll receive:
     - IP Address: `XXX.XXX.XXX.XXX`
     - Username: `admin`
     - Password: `XXXXXXXXXX`
     - VNC/Remote Desktop port

3. **Connect from Windows**
   - Download **Microsoft Remote Desktop** from Microsoft Store
   - Open Microsoft Remote Desktop
   - Click "+ Add" → "PC"
   - Enter:
     - PC Name: `[IP Address from email]`
     - User account: Add username/password from email
   - Click "Add"
   - Double-click to connect

### Option B: MacInCloud

**Cost:** ~$30-50/month

1. Go to [macincloud.com](https://www.macincloud.com)
2. Choose "Managed Server" plan
3. Follow same connection steps as above

### Option C: AWS EC2 Mac Instances

**Cost:** ~$1.08/hour (cheaper if you only need occasional access)

1. AWS Account required
2. Navigate to EC2 → Launch Instance
3. Choose "macOS" AMI
4. Launch and connect via VNC

---

## PHASE 2: Apple Developer Account Setup

**Cost:** $99/year (required to publish to App Store)

### Step 1: Create Apple ID (if you don't have one)

1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Click "Create Your Apple ID"
3. Fill in details and verify email

### Step 2: Enroll in Apple Developer Program

1. Go to [developer.apple.com/programs/enroll](https://developer.apple.com/programs/enroll)
2. Click "Start Your Enrollment"
3. Sign in with Apple ID
4. Choose "Individual" (not company)
5. Fill in personal information
6. Pay $99 via credit card
7. **Wait 24-48 hours for approval**
   - Apple will send email when approved
   - Check developer.apple.com to see status

---

## PHASE 3: Install Xcode (On Cloud Mac)

**Once connected to your Cloud Mac:**

### Step 1: Download Xcode

1. Open **Mac App Store** (blue "A" icon in dock)
2. Search for "Xcode"
3. Click "Get" then "Install"
4. **WARNING:** This is a 12+ GB download, takes 30-60 minutes
5. Enter Mac password when prompted

### Step 2: Launch Xcode First Time

1. Open Xcode from Applications folder
2. Accept license agreement (click "Agree")
3. Enter Mac password to install additional components
4. Wait for "Installing components..." to finish (~5-10 minutes)

### Step 3: Install Command Line Tools

1. In Xcode, go to **Xcode → Preferences → Locations**
2. Set **Command Line Tools** to the Xcode version
3. Close Xcode

---

## PHASE 4: Prepare Your React App for iOS

**Do this on your Windows machine first, then transfer to Cloud Mac**

### Step 1: Install Capacitor

```bash
# In your project directory (C:\Users\nikhi\Desktop\BlockStacker)
npm install @capacitor/core @capacitor/cli
```

### Step 2: Initialize Capacitor

```bash
npx cap init
```

**When prompted, enter:**
- App name: `Block Stacker Carnivale`
- App ID: `com.yourname.blockstacker`
  - ⚠️ Replace `yourname` with your actual name/company
  - ⚠️ Must be unique across all iOS apps
  - ⚠️ Use lowercase, no spaces, no special characters
  - Example: `com.johnsmith.blockstacker`
- Web directory: `dist`

### Step 3: Add iOS Platform

```bash
npm install @capacitor/ios
npx cap add ios
```

This creates an `ios/` folder in your project.

### Step 4: Build Your React App

```bash
npm run build
```

### Step 5: Sync Capacitor

```bash
npx cap sync ios
```

---

## PHASE 5: Transfer Project to Cloud Mac

### Method 1: GitHub (Recommended)

**On Windows:**
```bash
git add -A
git commit -m "Add iOS platform via Capacitor"
git push
```

**On Cloud Mac:**
1. Open **Terminal** (in Applications/Utilities)
2. Install Git if needed: `xcode-select --install`
3. Clone your repo:
```bash
cd ~/Desktop
git clone https://github.com/nikhilprakash24/blockstacker.git
cd blockstacker
npm install
```

### Method 2: Direct File Transfer

1. On Windows, compress your project folder to ZIP
2. Upload to Google Drive or Dropbox
3. On Cloud Mac, download from Drive/Dropbox
4. Extract and run `npm install`

---

## PHASE 6: Open Project in Xcode

**On your Cloud Mac:**

### Step 1: Open Xcode Project

```bash
cd ~/Desktop/blockstacker
npx cap open ios
```

This launches Xcode with your project.

### Step 2: Configure Project Settings

1. In Xcode, click on **App** (blue icon) in left sidebar
2. Select **App** under TARGETS
3. Go to **General** tab

**Configure these fields:**
- **Display Name:** `Block Stacker`
- **Bundle Identifier:** Must match your `com.yourname.blockstacker`
- **Version:** `1.0.0`
- **Build:** `1`
- **Deployment Info:**
  - Minimum Deployments: `iOS 13.0`
  - Device Orientation: Check only **Portrait**
  - Uncheck Landscape Left and Right

### Step 3: Add Your Apple Developer Account

1. Click **Xcode → Preferences** (or Settings in newer Xcode)
2. Go to **Accounts** tab
3. Click **+** button (bottom left)
4. Choose **Apple ID**
5. Sign in with your Apple Developer account
6. Close Preferences

### Step 4: Configure Signing

1. Back in your project settings (General tab)
2. Under **Signing & Capabilities:**
   - Check **Automatically manage signing**
   - Team: Select your Apple Developer account from dropdown
   - Signing Certificate: Should auto-populate

If you see errors:
- "Failed to register bundle identifier" → Bundle ID already taken, change it
- "No profiles" → Wait a few minutes, Xcode is creating certificates

---

## PHASE 7: Test in iOS Simulator

### Step 1: Select Simulator

1. At the top of Xcode, click the device selector (says "Any iOS Device")
2. Choose **iPhone 14 Pro** (or latest iPhone)

### Step 2: Build and Run

1. Click the **Play ▶** button (top left)
2. Wait for build to complete (~1-2 minutes first time)
3. iOS Simulator opens and launches your app

**Test everything:**
- Game plays correctly
- Buttons work
- Scoring system functions
- Settings modal works
- Ads display (if implemented)

---

## PHASE 8: Prepare App Store Assets

### Required Assets:

1. **App Icon (1024x1024 PNG)**
   - No transparency
   - No rounded corners (iOS adds them)
   - Must be exact 1024x1024 pixels

2. **Screenshots (Required)**
   - iPhone 6.7" Display: 1290 x 2796 pixels (3-10 screenshots)
   - Take in Simulator: **Device → Screenshot** (⌘+S)

3. **Privacy Policy URL**
   - Required if you collect data or show ads
   - Can use free generator: [privacypolicies.com](https://www.privacypolicies.com)

---

## PHASE 9: Archive and Upload to App Store

### Step 1: Change Target to Generic Device

1. In Xcode device selector, choose **Any iOS Device (arm64)**

### Step 2: Archive Your App

1. Go to **Product → Archive**
2. Wait for archiving process (2-5 minutes)
3. Organizer window opens automatically

### Step 3: Distribute to App Store

1. In Organizer, select your archive
2. Click **Distribute App**
3. Choose **App Store Connect**
4. Click **Upload**
5. Use default options, click **Next** through screens
6. Click **Upload**
7. Wait for upload to complete (~5-10 minutes)

You'll see "Upload Successful" message.

---

## PHASE 10: App Store Connect Listing

### Step 1: Create App Listing

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Click **My Apps**
3. Click **+** → **New App**

**Fill in:**
- Platform: **iOS**
- Name: `Block Stacker Carnivale`
- Primary Language: **English (U.S.)**
- Bundle ID: Select `com.yourname.blockstacker`
- SKU: `blockstacker001` (any unique string)
- User Access: **Full Access**

### Step 2: Fill in App Information

**App Information:**
- Category: **Games → Arcade** or **Games → Puzzle**
- Age Rating: Click "Edit" and answer questions (likely 4+)

**Pricing and Availability:**
- Price: **Free** (or set price)
- Availability: **All countries**

**App Privacy:**
- Click "Get Started"
- If using AdMob ads:
  - "Do you collect data?" → **Yes**
  - Data Types: **Identifiers** (Advertising ID)
  - Purpose: **Advertising**
- Complete privacy questionnaire

### Step 3: Add App Version Information

Go to **Version 1.0 → iOS App** section:

**Screenshots:**
- Upload screenshots taken from Simulator
- Need at least 3 screenshots for 6.7" Display

**Promotional Text:** (Optional)
```
Stack blocks perfectly in this addictive arcade game!
```

**Description:**
```
Block Stacker Carnivale is an addictive arcade game where precision is key!

HOW TO PLAY:
• Tap to drop blocks as they oscillate across the screen
• Align blocks perfectly to keep them all
• Misaligned blocks get trimmed off
• Reach higher levels for bigger prizes

FEATURES:
• Multiple difficulty modes
• Fair global leaderboard scoring
• Combo multipliers for perfect placements
• Speed bonuses for quick reactions
• Beautiful neon aesthetic

Can you reach the Major Prize?
```

**Keywords:**
```
stacker,arcade,blocks,puzzle,casual,skill,timing,carnival
```

**Support URL:** Your GitHub or personal website
**Marketing URL:** (Optional)

**Build:**
- Click **+** next to Build
- Select the build you uploaded
- Click **Done**

**Copyright:** `2025 Your Name`
**Review Information:**
- Contact info
- Demo account (if needed): N/A

### Step 4: Submit for Review

1. Click **Add for Review** (top right)
2. Choose **Manual Release** (you control launch) or **Automatic**
3. Click **Submit for Review**

---

## PHASE 11: App Review Process

### What Happens Next:

1. **Waiting for Review** (1-3 days)
   - Apple reviews your submission
   - Checks for bugs, policy violations, crashes

2. **In Review** (12-48 hours)
   - Apple testers play your game
   - Check metadata, screenshots, description accuracy

3. **Possible Outcomes:**
   - ✅ **Approved** → App goes live (or pending your release)
   - ❌ **Rejected** → Fix issues and resubmit

### Common Rejection Reasons:

- Crashes on launch
- Missing features described in app description
- Privacy policy issues
- App doesn't work as described
- Placeholder content or test data visible

### If Rejected:

1. Read rejection message in App Store Connect
2. Fix the issues
3. Increment build number in Xcode (General tab)
4. Archive and upload again
5. Click "Submit for Review" again

---

## PHASE 12: Going Live

### When Approved:

If you chose **Manual Release:**
1. Go to App Store Connect
2. Click **Release this Version**
3. App goes live in 15-30 minutes

If you chose **Automatic Release:**
- App automatically goes live when approved

### Post-Launch:

1. **Monitor Reviews**
   - App Store Connect → Ratings & Reviews
   - Respond to user feedback

2. **Check Crash Reports**
   - Xcode → Window → Organizer → Crashes
   - Fix bugs in next update

3. **Updates**
   - Fix bugs or add features
   - Increment version number (1.0.0 → 1.1.0)
   - Repeat Archive → Upload → Submit process

---

## Cost Breakdown

| Item | Cost | Frequency |
|------|------|-----------|
| Apple Developer Account | $99 | Annual |
| Cloud Mac (MacStadium) | $79 | Monthly |
| Cloud Mac (MacInCloud) | $30-50 | Monthly |
| AWS Mac Instance | $1.08/hour | As needed |
| **Total (first year)** | **$99 + cloud costs** | - |

**Money Saving Tips:**
- Use AWS hourly Mac if you only need it occasionally
- Cancel cloud Mac after initial setup (only need for updates)
- Share cloud Mac subscription with others

---

## Troubleshooting

### "Bundle Identifier Already Exists"
- Change your bundle ID in `capacitor.config.ts`
- Run `npx cap sync ios`
- Update in Xcode General settings

### "No Signing Certificate"
- Xcode → Preferences → Accounts
- Select account → Manage Certificates
- Click + → Apple Development

### "App Crashes on Launch"
- Check Console in Xcode (View → Debug Area → Show Debug Area)
- Look for error messages
- Often caused by missing Capacitor plugins or web resources

### "Build Failed"
- Clean build folder: Product → Clean Build Folder
- Restart Xcode
- Delete `ios/` folder, run `npx cap add ios` again

---

## Timeline Estimate

| Phase | Time |
|-------|------|
| Cloud Mac setup | 1-2 hours |
| Apple Developer enrollment | 1-2 days (approval wait) |
| Xcode installation | 1 hour |
| Project setup | 30 minutes |
| Testing & debugging | 2-4 hours |
| App Store assets | 2-3 hours |
| Upload & submission | 1 hour |
| **Review wait time** | **1-3 days** |
| **Total active work** | **~10 hours** |
| **Total calendar time** | **4-6 days** |

---

## Next Steps

1. ✅ Read this guide completely
2. ⬜ Sign up for Cloud Mac service
3. ⬜ Create Apple Developer account
4. ⬜ Follow PHASE 4-12 step by step
5. ⬜ Read `AD_INTEGRATION_GUIDE.md` for monetization setup

---

**Questions?** Create an issue on GitHub or refer to:
- [Capacitor iOS Docs](https://capacitorjs.com/docs/ios)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Xcode Help](https://developer.apple.com/documentation/xcode)
