/**
 * AdMob Configuration
 *
 * IMPORTANT: Always use test IDs during development!
 * Switch to production IDs only when submitting to App Store.
 */

export interface AdIds {
  appId: string;
  bannerId: string;
  interstitialId: string;
  rewardedId: string;
}

export const AD_CONFIG = {
  // PRODUCTION IDs - Replace these with your actual AdMob IDs from admob.google.com
  production: {
    appId: 'ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY',  // Your AdMob App ID
    bannerId: 'ca-app-pub-XXXXXXXXXXXXXXXX/1111111111',  // Banner Ad Unit ID
    interstitialId: 'ca-app-pub-XXXXXXXXXXXXXXXX/2222222222',  // Interstitial Ad Unit ID
    rewardedId: 'ca-app-pub-XXXXXXXXXXXXXXXX/3333333333',  // Rewarded Video Ad Unit ID
  },

  // TEST IDs - Google's official test IDs (safe to use, won't risk account ban)
  test: {
    appId: 'ca-app-pub-3940256099942544~1458002511',
    bannerId: 'ca-app-pub-3940256099942544/2934735716',
    interstitialId: 'ca-app-pub-3940256099942544/4411468910',
    rewardedId: 'ca-app-pub-3940256099942544/1712485313',
  }
};

// Toggle between test and production ads
// IMPORTANT: Set to false before submitting to App Store!
export const USE_TEST_ADS = true;

// Get the appropriate ad IDs based on mode
export function getAdIds(): AdIds {
  return USE_TEST_ADS ? AD_CONFIG.test : AD_CONFIG.production;
}

// Ad display settings
export const AD_SETTINGS = {
  // Show interstitial ad every 3-5 games (randomized to feel less predictable)
  interstitialFrequencyMin: 3,
  interstitialFrequencyMax: 5,

  // Banner ad refresh rate (seconds)
  bannerRefreshRate: 60,

  // Rewarded ad settings
  rewardedAdReward: 'Continue',
  rewardedAdRewardAmount: 1,
};
