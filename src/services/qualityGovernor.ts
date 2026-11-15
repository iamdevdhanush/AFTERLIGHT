/**
 * AFTERLIGHT — Adaptive Quality Governor & Performance Monitor
 * Dynamically scales WebGL rendering parameters (DPR, shadows, displacement)
 * to maintain 60 FPS on desktop and 30+ FPS on mid-range Android/mobile.
 */

class QualityGovernor {
  private frameTimes: number[] = [];
  private lastTime = performance.now();
  private lowFpsCounter = 0;
  private highFpsCounter = 0;

  public currentFps = 60;
  public tier: 'high' | 'medium' | 'low' = 'high';
  public dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
  public enableShadows = true;
  public enableDisplacement = true;
  public shadowMapSize: [number, number] = [1024, 1024];

  constructor() {
    // Detect mobile or low-memory devices on startup
    if (typeof window !== 'undefined') {
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const lowMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory <= 4;
      if (isMobile || lowMemory) {
        this.tier = 'medium';
        this.dpr = 1.0;
        this.shadowMapSize = [512, 512];
      }
    }
  }

  /**
   * Called once per frame inside useFrame()
   */
  public update(delta: number): void {
    const now = performance.now();
    const frameDuration = now - this.lastTime;
    this.lastTime = now;

    this.frameTimes.push(frameDuration);
    if (this.frameTimes.length > 45) {
      this.frameTimes.shift();
    }

    const avgDuration = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.currentFps = Math.round(1000 / Math.max(avgDuration, 1));

    // Downgrade if FPS is consistently under 28
    if (this.currentFps < 28) {
      this.lowFpsCounter++;
      this.highFpsCounter = 0;
      if (this.lowFpsCounter > 60 && this.tier !== 'low') {
        this.downgrade();
        this.lowFpsCounter = 0;
      }
    } else if (this.currentFps > 55) {
      this.highFpsCounter++;
      this.lowFpsCounter = 0;
    }
  }

  private downgrade(): void {
    if (this.tier === 'high') {
      console.warn('[QualityGovernor] Adaptive throttle to MEDIUM tier for performance');
      this.tier = 'medium';
      this.dpr = 1.0;
      this.shadowMapSize = [512, 512];
    } else if (this.tier === 'medium') {
      console.warn('[QualityGovernor] Adaptive throttle to LOW tier for performance');
      this.tier = 'low';
      this.dpr = 0.85;
      this.enableShadows = false;
      this.enableDisplacement = false;
    }
  }

  public setManualTier(tier: 'high' | 'medium' | 'low'): void {
    this.tier = tier;
    if (tier === 'high') {
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.enableShadows = true;
      this.enableDisplacement = true;
      this.shadowMapSize = [1024, 1024];
    } else if (tier === 'medium') {
      this.dpr = 1.0;
      this.enableShadows = true;
      this.enableDisplacement = true;
      this.shadowMapSize = [512, 512];
    } else {
      this.dpr = 0.85;
      this.enableShadows = false;
      this.enableDisplacement = false;
      this.shadowMapSize = [256, 256];
    }
  }
}

export const qualityGovernor = new QualityGovernor();
