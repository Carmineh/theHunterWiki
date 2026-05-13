const TARGET_GAME_ID = 23010;
const IN_GAME_WINDOW = 'in_game';
const DESKTOP_WINDOW = 'desktop';

async function openWindow(windowName: string): Promise<void> {
  return new Promise((resolve) => {
    overwolf.windows.obtainDeclaredWindow(windowName, (result: any) => {
      if (result.status === 'success') {
        overwolf.windows.restore(windowName, () => resolve());
      }
    });
  });
}

function isGameRunning(): Promise<boolean> {
  return new Promise((resolve) => {
    overwolf.games.getRunningGameInfo((res) => {
      if (res && res.isRunning && res.classId === TARGET_GAME_ID) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}

async function toggleWindow() {
  const gameRunning = await isGameRunning();
  const windowName = gameRunning ? IN_GAME_WINDOW : DESKTOP_WINDOW;

  overwolf.windows.obtainDeclaredWindow(windowName, (result: any) => {
    if (result.status === 'success') {
      if (result.window.isVisible) {
        overwolf.windows.hide(windowName);
      } else {
        overwolf.windows.restore(windowName);
      }
    }
  });
}

async function onAppLaunch() {
  const gameRunning = await isGameRunning();
  if (gameRunning) {
    await openWindow(IN_GAME_WINDOW);
  } else {
    await openWindow(DESKTOP_WINDOW);
  }
}

// Handle app launch from Overwolf client
overwolf.extensions.onAppLaunchTriggered.addListener(onAppLaunch);
overwolf.windows.onMainWindowRestored.addListener(onAppLaunch);

// Handle hotkeys
overwolf.settings.hotkeys.onPressed.addListener((arg) => {
  if (arg.name === 'show_hide_wiki') {
    toggleWindow();
  }
});

// Handle game launch/close events
overwolf.games.onGameInfoUpdated.addListener(async (res) => {
  const isRunning = res && res.gameInfo && res.gameInfo.isRunning && res.gameInfo.classId === TARGET_GAME_ID;
  
  if (isRunning) {
    // Game is running, close the desktop window if open
    overwolf.windows.close(DESKTOP_WINDOW);
  } else if (res.gameChanged && res.runningChanged && !res.gameInfo?.isRunning) {
    // Game closed, close the in-game window
    overwolf.windows.close(IN_GAME_WINDOW);
  }
});

// Initial check on load
onAppLaunch();

