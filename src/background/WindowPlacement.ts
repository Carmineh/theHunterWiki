/**
 * Monitor-aware placement of the desktop window (Overwolf "2nd screen" guidelines):
 * - opens on the main monitor the first time;
 * - reopens on the monitor it was last closed on;
 * - while the game runs, lives on the 2nd monitor (if there is one).
 */

type Display = overwolf.utils.Display;
type WindowInfo = overwolf.windows.WindowInfo;

const LAST_MONITOR_KEY = 'desktop.lastMonitorId';
const TRACK_INTERVAL_MS = 3000;

export type MonitorTarget = 'primary' | 'secondary' | 'last';

export class WindowPlacement {
  private trackTimer: number | undefined;

  constructor(private readonly windowName: string) {}

  /** Restores the window on the requested monitor and brings it to the front. */
  async show(target: MonitorTarget, grabFocus = true): Promise<void> {
    const monitor = await this.resolveMonitor(target);
    const win = await this.obtain();
    if (!win) return;

    await this.call<overwolf.Result>((cb) => overwolf.windows.restore(win.id, cb));
    if (monitor && win.monitorId !== monitor.id) await this.moveTo(win, monitor);
    overwolf.windows.bringToFront(win.id, grabFocus, () => undefined);

    this.startTracking();
  }

  /** Opens the window if needed and keeps it minimized (still "open" for Overwolf). */
  async minimize(): Promise<void> {
    const win = await this.obtain();
    if (win) overwolf.windows.minimize(win.id);
  }

  /** Brings the window back on the requested monitor, unless it was closed. */
  async moveIfOpen(target: MonitorTarget): Promise<void> {
    const win = await this.obtain();
    if (!win || win.stateEx === 'closed') return;
    await this.show(target, false);
  }

  async hasSecondaryMonitor(): Promise<boolean> {
    return (await this.getMonitors()).some((m) => !m.is_primary);
  }

  /** Makes the next "last monitor" open go to the main screen. */
  forgetLastMonitor(): void {
    this.setLastMonitorId(null);
  }

  // ------------------------------------------------------------ internals

  /**
   * Remembers which monitor the window is on, so it can reopen there.
   * Polled because Overwolf has no "window moved" event.
   */
  private startTracking(): void {
    if (this.trackTimer !== undefined) return;

    this.trackTimer = window.setInterval(async () => {
      const win = await this.obtain();
      if (!win || win.stateEx === 'closed') return this.stopTracking();
      if (win.isVisible && win.monitorId) this.setLastMonitorId(win.monitorId);
    }, TRACK_INTERVAL_MS);
  }

  private stopTracking(): void {
    window.clearInterval(this.trackTimer);
    this.trackTimer = undefined;
  }

  private async resolveMonitor(target: MonitorTarget): Promise<Display | undefined> {
    const monitors = await this.getMonitors();
    const primary = monitors.find((m) => m.is_primary) || monitors[0];

    switch (target) {
      case 'secondary':
        return monitors.find((m) => !m.is_primary) || primary;
      case 'last':
        return monitors.find((m) => m.id === this.getLastMonitorId()) || primary;
      default:
        return primary;
    }
  }

  /** Centers the window on the monitor. */
  private async moveTo(win: WindowInfo, monitor: Display): Promise<void> {
    const left = monitor.x + Math.max(0, Math.round((monitor.width - win.width) / 2));
    const top = monitor.y + Math.max(0, Math.round((monitor.height - win.height) / 2));
    await this.call((cb) => overwolf.windows.changePosition(win.id, left, top, cb));
  }

  private async obtain(): Promise<WindowInfo | undefined> {
    const result = await this.call<overwolf.windows.WindowResult>((cb) =>
      overwolf.windows.obtainDeclaredWindow(this.windowName, cb)
    );
    return result?.success ? result.window : undefined;
  }

  private async getMonitors(): Promise<Display[]> {
    const result = await this.call<{ displays: Display[] }>((cb) =>
      overwolf.utils.getMonitorsList(cb)
    );
    return result?.displays || [];
  }

  private getLastMonitorId(): string | null {
    try {
      return localStorage.getItem(LAST_MONITOR_KEY);
    } catch {
      return null;
    }
  }

  private setLastMonitorId(id: string | null): void {
    try {
      if (id) localStorage.setItem(LAST_MONITOR_KEY, id);
      else localStorage.removeItem(LAST_MONITOR_KEY);
    } catch {
      // storage unavailable: placement falls back to the main monitor
    }
  }

  /** Wraps a callback-style Overwolf API in a Promise. */
  private call<T = unknown>(fn: (cb: (result: T) => void) => void): Promise<T> {
    return new Promise((resolve) => fn(resolve));
  }
}
