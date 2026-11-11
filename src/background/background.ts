import { GAME_ID, TOGGLE_HOTKEY, WINDOWS } from '../wiki/constants';
import { WindowPlacement } from './WindowPlacement';

/**
 * Background controller: decides which window to show.
 *
 * Game not running -> desktop window (on the monitor it was last closed on).
 * Game running     -> in-game overlay; with 2+ monitors the desktop window
 *                     also opens on the 2nd screen, otherwise it is minimized.
 * Game closed      -> in-game overlay closes, desktop window goes back to the main screen.
 */

const desktop = new WindowPlacement(WINDOWS.DESKTOP);

function isGameRunning(): Promise<boolean> {
  return new Promise((resolve) => {
    overwolf.games.getRunningGameInfo((info) => {
      resolve(Boolean(info?.isRunning && info.classId === GAME_ID));
    });
  });
}

function showInGameWindow(): void {
  overwolf.windows.obtainDeclaredWindow(WINDOWS.IN_GAME, (result) => {
    if (result.success) overwolf.windows.restore(WINDOWS.IN_GAME);
  });
}

function toggleInGameWindow(): void {
  overwolf.windows.obtainDeclaredWindow(WINDOWS.IN_GAME, (result) => {
    if (!result.success) return;
    if (result.window.isVisible) {
      overwolf.windows.hide(WINDOWS.IN_GAME);
    } else {
      overwolf.windows.restore(WINDOWS.IN_GAME);
    }
  });
}

function toggleDesktopWindow(): void {
  overwolf.windows.obtainDeclaredWindow(WINDOWS.DESKTOP, (result) => {
    if (!result.success) return;
    if (result.window.isVisible) {
      overwolf.windows.hide(WINDOWS.DESKTOP);
    } else {
      desktop.show('last');
    }
  });
}

/** While playing, the desktop window belongs on the 2nd screen (if any). */
async function onGameStarted(): Promise<void> {
  if (await desktop.hasSecondaryMonitor()) {
    desktop.show('secondary', false); // don't steal focus from the game
  } else {
    // Overwolf requires a desktop window to stay open while the app runs:
    // minimize it instead of closing it (its ads pause while minimized).
    desktop.minimize();
  }
}

function onGameStopped(): void {
  overwolf.windows.close(WINDOWS.IN_GAME);
  desktop.forgetLastMonitor();
  desktop.moveIfOpen('primary');
}

async function onAppLaunch(): Promise<void> {
  if (await isGameRunning()) {
    showInGameWindow();
    await onGameStarted();
  } else {
    await desktop.show('last');
  }
}

// App launched from the Overwolf dock / desktop shortcut
overwolf.extensions.onAppLaunchTriggered.addListener(onAppLaunch);

// Show/Hide hotkey: toggles the overlay in-game, the desktop window otherwise
overwolf.settings.hotkeys.onPressed.addListener(async (event) => {
  if (event.name !== TOGGLE_HOTKEY) return;
  if (await isGameRunning()) toggleInGameWindow();
  else toggleDesktopWindow();
});

// React to the game starting or stopping
overwolf.games.onGameInfoUpdated.addListener((event) => {
  if (!event?.runningChanged) return;

  const gameRunning = Boolean(event.gameInfo?.isRunning && event.gameInfo.classId === GAME_ID);
  if (gameRunning) onGameStarted();
  else onGameStopped();
});

onAppLaunch();
