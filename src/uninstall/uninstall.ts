import { UNINSTALL_SURVEY_URL } from '../wiki/constants';

/**
 * Runs (invisibly) while the app is being uninstalled — see `uninstall_window` in the manifest.
 * Opens a short feedback survey in the user's browser.
 */
if (UNINSTALL_SURVEY_URL) {
  overwolf.utils.openUrlInDefaultBrowser(UNINSTALL_SURVEY_URL);
}
