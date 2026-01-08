const TARGET_GAME_ID = 23010;
const WINDOW_NAME = 'in_game';

function toggleWindow() {
  overwolf.windows.obtainDeclaredWindow(WINDOW_NAME, function (result: any) {
    if (result.status === 'success') {
      if (result.window.isVisible) {
        overwolf.windows.hide(WINDOW_NAME);
      } else {
        overwolf.windows.restore(WINDOW_NAME);
      }
    }
  });
}

overwolf.settings.hotkeys.onPressed.addListener((arg) => {
  if (arg.name === 'show_hide_wiki') {
    toggleWindow();
  }
});

overwolf.games.onGameInfoUpdated.addListener(function (res) {
  if (res && res.gameInfo && res.gameInfo.isRunning && res.gameInfo.classId === TARGET_GAME_ID) {
    // Prepara la finestra ma non mostrarla ancora
    overwolf.windows.obtainDeclaredWindow(WINDOW_NAME, () => {});
  }
});
