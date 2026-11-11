/** theHunter: Call of the Wild game id on Overwolf. */
export const GAME_ID = 23010;

/** Window names, as declared in public/manifest.json. */
export const WINDOWS = {
  BACKGROUND: 'background',
  DESKTOP: 'desktop',
  IN_GAME: 'in_game',
} as const;

/** Hotkey name, as declared in public/manifest.json. */
export const TOGGLE_HOTKEY = 'show_hide_wiki';

/**
 * Opens Overwolf's "Overlay & Hotkeys" settings focused on our hotkey.
 * The hotkey is global (no game_ids in the manifest), so no gameId is passed.
 */
export const HOTKEY_SETTINGS_URL = `overwolf://settings/games-overlay?hotkey=${TOGGLE_HOTKEY}`;

export const BUG_REPORT_URL = 'https://github.com/Carmineh/theHunterWiki/issues';

/** Survey opened in the user's browser when the app is uninstalled. Empty = disabled. */
export const UNINSTALL_SURVEY_URL = 'https://tally.so/r/NqlD5p';

/**
 * Ad units for the "Studio" layout recommended by Overwolf:
 * a 400x300 unit in the side column + a 728x90 banner under the content.
 */
export const AD_UNITS = [
  { elementId: 'ad-side', width: 400, height: 300 },
  { elementId: 'ad-bottom', width: 728, height: 90 },
] as const;

export const ADS_SDK_URL = 'https://content.overwolf.com/libs/ads/latest/owads.min.js';
