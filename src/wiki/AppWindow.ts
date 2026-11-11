import { OWWindow } from '@overwolf/overwolf-api-ts';

/**
 * Base class for the app's foreground windows.
 * Wires the custom title bar: dragging, minimize, maximize/restore and close.
 */
export class AppWindow {
  protected readonly currWindow: OWWindow;
  private maximized = false;

  constructor(windowName: string) {
    this.currWindow = new OWWindow(windowName);

    const header = document.getElementById('window-header');
    if (header) this.currWindow.dragMove(header);

    this.onClick('minimizeButton', () => this.currWindow.minimize());
    this.onClick('maximizeButton', () => this.toggleMaximize());
    this.onClick('closeButton', () => this.currWindow.close());
  }

  /** Adds a click listener to the element with the given id, if it exists. */
  protected onClick(elementId: string, handler: () => void): void {
    document.getElementById(elementId)?.addEventListener('click', handler);
  }

  private async toggleMaximize(): Promise<void> {
    if (this.maximized) {
      await this.currWindow.restore();
    } else {
      await this.currWindow.maximize();
    }
    this.maximized = !this.maximized;
    document.body.classList.toggle('maximized', this.maximized);
  }
}
