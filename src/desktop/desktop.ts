import { AppWindow } from '../AppWindow';
import { DataManager } from '../in_game/DataManager';
import { MapRenderer } from '../in_game/MapRenderer';
import { AnimalDetailRenderer } from '../in_game/AnimalDetailRenderer';
import { SearchHandler } from '../in_game/SearchHandler';

class DesktopController extends AppWindow {
  private dataManager: DataManager;
  private mapRenderer: MapRenderer;
  private animalDetailRenderer: AnimalDetailRenderer;
  private searchHandler: SearchHandler;

  constructor() {
    super('desktop');
    this.dataManager = new DataManager();
    this.mapRenderer = new MapRenderer();
    this.animalDetailRenderer = new AnimalDetailRenderer();
    this.searchHandler = new SearchHandler();
    this.init();
  }

  async init() {
    await this.dataManager.loadData();
    this.renderMaps();
    this.updateHotkeyDisplay();

    document
      .getElementById('btn-back-home')
      ?.addEventListener('click', () => this.switchView('view-home'));
    document
      .getElementById('btn-back-map')
      ?.addEventListener('click', () => this.switchView('view-map'));

    const searchInput = document.getElementById('search-bar') as HTMLInputElement;
    searchInput?.addEventListener('input', (e) =>
      this.handleSearch((e.target as HTMLInputElement).value)
    );

    document.getElementById('hotkey-link')?.addEventListener('click', () => {
      window.location.href = 'overwolf://settings/hotkeys-editing/theHunterWiki/show_hide_wiki';
    });

    document.getElementById('bug-report-link')?.addEventListener('click', () => {
      overwolf.utils.openUrlInDefaultBrowser('https://github.com/Carmineh/theHunterWiki/issues');
    });

    // Listen for hotkey changes
    overwolf.settings.hotkeys.onChanged.addListener(() => this.updateHotkeyDisplay());
  }

  private async updateHotkeyDisplay() {
    overwolf.settings.hotkeys.get((res) => {
      if (res && res.games && res.games[23010]) {
        const hotkey = res.games[23010].find((h) => h.name === 'show_hide_wiki');
        if (hotkey) {
          const displays = document.querySelectorAll('.hotkey-display');
          displays.forEach((el) => ((el as HTMLElement).innerText = hotkey.binding));
        }
      }
    });
  }

  renderMaps() {
    const container = document.getElementById('maps-container');
    if (!container) return;

    this.mapRenderer.renderMapsGrid(container, (mapName) => this.openMap(mapName));
  }

  openMap(mapName: string) {
    const animalIds = this.dataManager.getMapAnimals(mapName);
    const container = document.getElementById('map-animals-container');
    const title = document.getElementById('current-map-title');

    if (title) title.innerText = mapName;
    if (!container) return;

    this.mapRenderer.renderMapAnimals(
      container,
      animalIds,
      this.dataManager.getAllAnimals(),
      (animal) => this.openAnimal(animal)
    );

    this.switchView('view-map');
  }

  openAnimal(animal: any) {
    const container = document.getElementById('animal-detail-content');
    if (!container) return;

    this.animalDetailRenderer.render(animal, container);
    this.switchView('view-animal');
  }

  switchView(viewId: string) {
    document.querySelectorAll('.view').forEach((el) => el.classList.add('hidden'));
    document.getElementById(viewId)?.classList.remove('hidden');
    document.querySelector('main')?.scrollTo(0, 0);
  }

  handleSearch(query: string) {
    const resultsContainer = document.getElementById('search-results');
    const searchInput = document.getElementById('search-bar') as HTMLInputElement;
    if (!resultsContainer || !searchInput) return;

    this.searchHandler.handleSearch(
      query,
      this.dataManager.getAllAnimals(),
      resultsContainer,
      searchInput,
      (animal) => this.openAnimal(animal)
    );
  }
}

new DesktopController();
