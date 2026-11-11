import type { OwAd as OwAdInstance } from '@overwolf/types/owads';
import { ADS_SDK_URL, AD_UNITS } from './constants';

/** The Ads SDK script defines `OwAd` as a global once loaded. */
declare const OwAd: typeof OwAdInstance;

/**
 * Loads the Overwolf Ads SDK and manages the ad units of a window.
 *
 * Overwolf policy: ads must not run while their window is not visible,
 * so they are removed on minimize/hide and refreshed on restore.
 */
export class AdsManager {
  private readonly ads: OwAdInstance[] = [];

  constructor(private readonly windowName: string) {}

  async init(): Promise<void> {
    try {
      await this.loadSdk();
    } catch (e) {
      console.warn('Overwolf Ads SDK could not be loaded:', e);
      return;
    }

    for (const unit of AD_UNITS) {
      const container = document.getElementById(unit.elementId);
      if (!container) continue;
      const size = { width: unit.width, height: unit.height };
      this.ads.push(new OwAd(container, { size }));
    }

    overwolf.windows.onStateChanged.addListener((event) => {
      if (event.window_name !== this.windowName) return;
      this.onWindowStateChanged(event.window_state_ex, event.window_previous_state_ex);
    });
  }

  private onWindowStateChanged(state: string, previousState: string): void {
    const isVisible = (s: string) => s === 'normal' || s === 'maximized';

    if (isVisible(previousState) && !isVisible(state)) {
      this.ads.forEach((ad) => ad.removeAd());
    } else if (!isVisible(previousState) && isVisible(state)) {
      this.ads.forEach((ad) => ad.refreshAd({}));
    }
  }

  private loadSdk(): Promise<void> {
    if (typeof OwAd !== 'undefined') return Promise.resolve();

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = ADS_SDK_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${ADS_SDK_URL}`));
      document.head.appendChild(script);
    });
  }
}
