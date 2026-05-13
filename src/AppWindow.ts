import { OWWindow } from '@overwolf/overwolf-api-ts';

/**
 * Base class for the app's foreground windows.
 * Handles common behaviors like window controls (close, minimize) and dragging.
 */
export class AppWindow {
  protected currWindow: OWWindow;
  protected mainWindow: OWWindow;
  protected maximized: boolean = false;

  constructor(windowName) {
    this.mainWindow = new OWWindow('background');
    this.currWindow = new OWWindow(windowName);

    const closeButton = document.getElementById('closeButton');
    const maximizeButton = document.getElementById('maximizeButton');
    const minimizeButton = document.getElementById('minimizeButton');

    const header = document.getElementById('window-header');

    if (header) {
      this.setDrag(header);
    }

    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.currWindow.close();
      });
    }

    if (minimizeButton) {
      minimizeButton.addEventListener('click', () => {
        this.currWindow.minimize();
      });
    }

    if (maximizeButton) {
      maximizeButton.addEventListener('click', () => {
        if (!this.maximized) {
          this.currWindow.maximize();
        } else {
          this.currWindow.restore();
        }

        this.maximized = !this.maximized;
      });
    }
  }

  public async getWindowState() {
    return await this.currWindow.getWindowState();
  }

  private async setDrag(elem) {
    this.currWindow.dragMove(elem);
  }
}
