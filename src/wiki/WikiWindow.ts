import { AppWindow } from './AppWindow';
import { AdsManager } from './AdsManager';
import { AnimalDetailRenderer } from './AnimalDetailRenderer';
import { BUG_REPORT_URL, GAME_ID, HOTKEY_SETTINGS_URL, TOGGLE_HOTKEY, WINDOWS } from './constants';
import { DataManager } from './DataManager';
import { MapRenderer } from './MapRenderer';
import { Onboarding } from './Onboarding';
import { SearchHandler } from './SearchHandler';
import { AnimalData } from './types';

type ViewId = 'view-home' | 'view-map' | 'view-animal';

/**
 * The wiki UI shared by the desktop and in-game windows:
 * maps grid -> animals of a map -> animal details, plus search, ads and toolbar links.
 */
export class WikiWindow extends AppWindow {
  private readonly data = new DataManager();
  private readonly mapRenderer = new MapRenderer();
  private readonly animalRenderer = new AnimalDetailRenderer();
  private readonly searchHandler = new SearchHandler();
  private readonly ads: AdsManager;
  private readonly onboarding: Onboarding;
  private hotkeyLabel = 'Ctrl+B';

  constructor(private readonly windowName: string) {
    super(windowName);
    this.ads = new AdsManager(windowName);
    this.onboarding = new Onboarding(() => this.renderHotkeyLabel());
    this.init();
  }

  private async init(): Promise<void> {
    this.bindToolbar();
    this.bindNavigation();
    this.updateHotkeyDisplay();
    overwolf.settings.hotkeys.onChanged.addListener(() => this.updateHotkeyDisplay());
    if (this.windowName === WINDOWS.DESKTOP) this.trackGameRunning();

    this.ads.init();
    this.onboarding.showIfFirstLaunch();

    await this.data.loadData();
    this.renderMaps();
  }

  // ---------------------------------------------------------------- toolbar

  private bindToolbar(): void {
    this.onClick('bug-report-link', () => overwolf.utils.openUrlInDefaultBrowser(BUG_REPORT_URL));
    this.onClick('help-button', () => this.onboarding.open());

    const hotkeyLink = document.getElementById('hotkey-link') as HTMLAnchorElement | null;
    if (hotkeyLink) hotkeyLink.href = HOTKEY_SETTINGS_URL;

    const searchInput = document.getElementById('search-bar') as HTMLInputElement | null;
    searchInput?.addEventListener('input', () => this.handleSearch(searchInput.value));
  }

  /** Shows the current binding of the show/hide hotkey wherever `.hotkey-display` is used. */
  private updateHotkeyDisplay(): void {
    overwolf.settings.hotkeys.get((res) => {
      if (!res?.success) return;

      const candidates = [...(res.globals || []), ...(res.games?.[GAME_ID] || [])];
      const hotkey = candidates.find((h) => h.name === TOGGLE_HOTKEY);
      this.hotkeyLabel = !hotkey || hotkey.IsUnassigned ? 'Unassigned' : hotkey.binding;
      this.renderHotkeyLabel();
    });
  }

  private renderHotkeyLabel(): void {
    document.querySelectorAll<HTMLElement>('.hotkey-display').forEach((el) => {
      el.innerText = this.hotkeyLabel;
    });
  }

  /**
   * Desktop window only: while the game runs it sits on the 2nd screen,
   * so the side tip switches from "launch the game" to "press the hotkey in-game".
   */
  private trackGameRunning(): void {
    const setRunning = (running: boolean) =>
      document.body.classList.toggle('game-running', running);

    overwolf.games.getRunningGameInfo((info) =>
      setRunning(Boolean(info?.isRunning && info.classId === GAME_ID))
    );
    overwolf.games.onGameInfoUpdated.addListener((event) => {
      if (!event?.runningChanged) return;
      setRunning(Boolean(event.gameInfo?.isRunning && event.gameInfo.classId === GAME_ID));
    });
  }

  // ------------------------------------------------------------- navigation

  private bindNavigation(): void {
    this.onClick('btn-back-home', () => this.showView('view-home'));
    this.onClick('btn-back-map', () => this.showView('view-map'));
  }

  private showView(viewId: ViewId): void {
    document.querySelectorAll('.view').forEach((el) => el.classList.add('hidden'));
    document.getElementById(viewId)?.classList.remove('hidden');
    document.querySelector('main')?.scrollTo(0, 0);
  }

  private renderMaps(): void {
    const container = document.getElementById('maps-container');
    if (container) this.mapRenderer.renderMapsGrid(container, (mapName) => this.openMap(mapName));
  }

  private openMap(mapName: string): void {
    const container = document.getElementById('map-animals-container');
    const title = document.getElementById('current-map-title');
    if (!container) return;

    if (title) title.innerText = mapName;
    this.mapRenderer.renderMapAnimals(
      container,
      this.data.getMapAnimals(mapName),
      this.data.getAllAnimals(),
      (animal) => this.openAnimal(animal)
    );
    this.showView('view-map');
  }

  private openAnimal(animal: AnimalData): void {
    const container = document.getElementById('animal-detail-content');
    if (!container) return;

    this.animalRenderer.render(animal, container);
    this.showView('view-animal');
  }

  private handleSearch(query: string): void {
    const resultsContainer = document.getElementById('search-results');
    const searchInput = document.getElementById('search-bar') as HTMLInputElement | null;
    if (!resultsContainer || !searchInput) return;

    this.searchHandler.handleSearch(
      query,
      this.data.getAllAnimals(),
      resultsContainer,
      searchInput,
      (animal) => this.openAnimal(animal)
    );
  }
}
