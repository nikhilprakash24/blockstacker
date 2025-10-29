/**
 * AdMob Service
 *
 * Handles all ad-related functionality:
 * - Banner ads (bottom of screen during gameplay)
 * - Interstitial ads (after game over, every 3-5 games)
 * - Rewarded video ads (watch to continue from Minor Prize)
 */

import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, AdMobError, AdLoadInfo } from '@capacitor-community/admob';
import { getAdIds, AD_SETTINGS } from '../config/adConfig';

class AdService {
  private initialized = false;
  private bannerVisible = false;
  private interstitialLoaded = false;
  private rewardedLoaded = false;
  private adIds = getAdIds();

  /**
   * Initialize AdMob
   * Call this once when the app starts
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing AdMob...');
      await AdMob.initialize({
        requestTrackingAuthorization: true, // iOS 14+ tracking permission
        initializeForTesting: false,
      });
      this.initialized = true;
      console.log('AdMob initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AdMob:', error);
      // Don't throw - app should work without ads if AdMob fails
    }
  }

  /**
   * Check if running on a real device (not web browser)
   */
  private isNativePlatform(): boolean {
    // @ts-ignore - Capacitor is available at runtime
    return typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.();
  }

  // ==================== BANNER ADS ====================

  /**
   * Show banner ad at bottom of screen
   */
  async showBanner(): Promise<void> {
    if (!this.initialized || !this.isNativePlatform()) {
      console.log('Skipping banner ad (not initialized or not native platform)');
      return;
    }

    if (this.bannerVisible) {
      console.log('Banner already visible');
      return;
    }

    try {
      const options: BannerAdOptions = {
        adId: this.adIds.bannerId,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
      };

      await AdMob.showBanner(options);
      this.bannerVisible = true;
      console.log('Banner ad shown');

      // Preload interstitial ad after banner loads
      this.preloadInterstitial();
    } catch (error) {
      console.error('Failed to show banner ad:', error);
    }
  }

  /**
   * Hide banner ad
   */
  async hideBanner(): Promise<void> {
    if (!this.bannerVisible || !this.isNativePlatform()) {
      return;
    }

    try {
      await AdMob.hideBanner();
      this.bannerVisible = false;
      console.log('Banner ad hidden');
    } catch (error) {
      console.error('Failed to hide banner ad:', error);
    }
  }

  /**
   * Remove banner ad completely
   */
  async removeBanner(): Promise<void> {
    if (!this.isNativePlatform()) {
      return;
    }

    try {
      await AdMob.removeBanner();
      this.bannerVisible = false;
      console.log('Banner ad removed');
    } catch (error) {
      console.error('Failed to remove banner ad:', error);
    }
  }

  // ==================== INTERSTITIAL ADS ====================

  /**
   * Preload interstitial ad
   * Call this early so ad is ready when needed
   */
  async preloadInterstitial(): Promise<void> {
    if (!this.initialized || !this.isNativePlatform()) {
      return;
    }

    if (this.interstitialLoaded) {
      console.log('Interstitial already loaded');
      return;
    }

    try {
      await AdMob.prepareInterstitial({
        adId: this.adIds.interstitialId,
      });
      this.interstitialLoaded = true;
      console.log('Interstitial ad loaded');
    } catch (error) {
      console.error('Failed to load interstitial ad:', error);
      this.interstitialLoaded = false;
    }
  }

  /**
   * Show interstitial ad (full screen ad between games)
   * Returns true if ad was shown, false if ad wasn't ready
   */
  async showInterstitial(): Promise<boolean> {
    if (!this.initialized || !this.isNativePlatform()) {
      console.log('Skipping interstitial (not native platform)');
      return false;
    }

    if (!this.interstitialLoaded) {
      console.log('Interstitial not loaded yet, preloading for next time');
      this.preloadInterstitial();
      return false;
    }

    try {
      await AdMob.showInterstitial();
      this.interstitialLoaded = false;
      console.log('Interstitial ad shown');

      // Preload next interstitial
      this.preloadInterstitial();

      return true;
    } catch (error) {
      console.error('Failed to show interstitial ad:', error);
      this.interstitialLoaded = false;

      // Try to preload again
      this.preloadInterstitial();

      return false;
    }
  }

  // ==================== REWARDED VIDEO ADS ====================

  /**
   * Preload rewarded video ad
   */
  async preloadRewarded(): Promise<void> {
    if (!this.initialized || !this.isNativePlatform()) {
      return;
    }

    if (this.rewardedLoaded) {
      console.log('Rewarded ad already loaded');
      return;
    }

    try {
      await AdMob.prepareRewardVideoAd({
        adId: this.adIds.rewardedId,
      });
      this.rewardedLoaded = true;
      console.log('Rewarded ad loaded');
    } catch (error) {
      console.error('Failed to load rewarded ad:', error);
      this.rewardedLoaded = false;
    }
  }

  /**
   * Show rewarded video ad
   * Returns a promise that resolves when user completes watching
   * Rejects if user closes ad early or ad fails
   */
  async showRewarded(): Promise<{ completed: boolean; reward?: any }> {
    if (!this.initialized || !this.isNativePlatform()) {
      console.log('Skipping rewarded ad (not native platform)');
      return { completed: false };
    }

    if (!this.rewardedLoaded) {
      console.log('Rewarded ad not loaded yet');
      // Try to load it now, but likely will fail (user has to wait)
      await this.preloadRewarded();

      if (!this.rewardedLoaded) {
        throw new Error('Rewarded ad not ready. Please try again in a moment.');
      }
    }

    return new Promise((resolve, reject) => {
      // Listen for reward completion
      AdMob.addListener('onRewardedVideoAdShowed', () => {
        console.log('Rewarded ad started');
      });

      AdMob.addListener('onRewardedVideoAdShowFailed', (error: AdMobError) => {
        console.error('Rewarded ad failed to show:', error);
        this.rewardedLoaded = false;
        this.preloadRewarded(); // Try to preload again
        reject(new Error('Ad failed to load. Please try again.'));
      });

      AdMob.addListener('onRewarded', (reward: any) => {
        console.log('User earned reward:', reward);
        this.rewardedLoaded = false;
        this.preloadRewarded(); // Preload next one
        resolve({ completed: true, reward });
      });

      AdMob.addListener('onRewardedVideoAdDismissed', () => {
        console.log('Rewarded ad dismissed');
        this.rewardedLoaded = false;
        this.preloadRewarded(); // Preload next one
        // If we didn't get onRewarded event, user closed early
        resolve({ completed: false });
      });

      // Show the ad
      AdMob.showRewardVideoAd().catch((error) => {
        console.error('Failed to show rewarded ad:', error);
        this.rewardedLoaded = false;
        reject(error);
      });
    });
  }

  /**
   * Check if rewarded ad is ready to show
   */
  isRewardedReady(): boolean {
    return this.rewardedLoaded && this.isNativePlatform();
  }

  // ==================== UTILITY ====================

  /**
   * Clean up and remove all ads
   * Call this when leaving game or closing app
   */
  async cleanup(): Promise<void> {
    await this.removeBanner();
    // Remove listeners
    AdMob.removeAllListeners();
  }

  /**
   * Get current initialization status
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const adService = new AdService();
