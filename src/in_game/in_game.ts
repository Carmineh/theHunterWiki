import { OWGames, OWGamesEvents, OWHotkeys } from '@overwolf/overwolf-api-ts';

const AVAILABLE_MAPS = [
  { name: 'Hirschfelden', id: 'hirschfelden_hunting_reserve' },
  { name: 'Layton Lake District ', id: 'layton_lake_district' },
  { name: 'Medved-Taiga National Park', id: 'medved-taiga_national_park' },
  { name: 'Vurhonga Savanna Reserve', id: 'vurhonga_savanna' },
  { name: 'Parque Fernando', id: 'parque_fernando' },
  { name: 'Yukon Valley', id: 'yukon_valley' },
  { name: 'Cuatro Colinas Reserve', id: 'cuatro_colinas_reserve' },
  { name: 'Silver Ridge Peaks', id: 'silver_ridge_peaks' },
  { name: 'Te Awaroa National Park', id: 'te_awaroa_national_park' },
  { name: 'Rancho del Arroyo', id: 'rancho_del_arroyo' },
  { name: 'Mississippi Acres Preserve', id: 'mississippi_acres_preserve' },
  { name: 'Revontuli Coast', id: 'revontuli_coast' },
  { name: 'New England Mountains', id: 'new_england_mountains' },
  { name: 'Emerald Coast', id: 'emerald_coast' },
  { name: 'Sundarpatan', id: 'sundarpatan' },
  { name: 'Salzwiesen Park', id: 'salzwiesen_park' },
  { name: 'Askiy Ridge Hunting Preserve', id: 'askiy_ridge_hunting_preserve' },
  { name: 'Tòrr nan Sithean', id: 'torr_nan_sithean' },
];

export interface NeedZone {
  Time: string;
  Activity: string;
}

// Support new structure: array of objects keyed by reserve id
// e.g. [{ "medved-taiga_national_park": [ { Time, Activity }, ... ] }, ...]
type NeedZoneGroup = Record<string, NeedZone[]>;

interface TrophyRatings {
  Silver: string | number;
  Gold: string | number;
  Diamond: string | number;
}

export interface FurVariant {
  Sex: string;
  Details: {
    Common?: string[];
    'Very Rare'?: string[];
    Rare?: string[];
  };
}

export interface AnimalData {
  id: string;
  Name: string;
  Class: string;
  Difficulty: string;
  'Trophy Type': string;
  Weight: string;
  // Accept legacy flat array or new grouped-by-reserve structure
  Need_Zones: (NeedZone | NeedZoneGroup)[];
  Variants: FurVariant[];
  Trophies?: TrophyRatings;
  Trophy_Ratings?: TrophyRatings;
}

class InGameController {
  private animalsData: Record<string, AnimalData> = {};
  private mapsData: Record<string, string[]> = {};
  private lastOpenedMapName: string | null = null;

  constructor() {
    this.init();
  }

  async init() {
    await this.loadData();
    this.renderMaps();

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
  }

  async loadData() {
    try {
      const promises = AVAILABLE_MAPS.map(async (mapInfo) => {
        try {
          const response = await fetch(`data/${mapInfo.id}.json`);
          if (!response.ok) return;

          const animalsList: AnimalData[] = await response.json();

          this.mapsData[mapInfo.name] = [];

          animalsList.forEach((animal) => {
            const normalizeNeedZonesForMap = (
              zones: (NeedZone | NeedZoneGroup)[] | undefined,
              mapId: string
            ): NeedZoneGroup[] => {
              if (!zones) return [];
              const grouped: NeedZoneGroup[] = [];
              const flat: NeedZone[] = [];

              zones.forEach((z) => {
                if (z && typeof z === 'object' && 'Time' in z) {
                  flat.push(z as NeedZone);
                } else if (z && typeof z === 'object') {
                  grouped.push(z as NeedZoneGroup);
                }
              });

              if (flat.length > 0) grouped.push({ [mapId]: flat });
              return grouped;
            };

            const mergeNeedZones = (
              existingGroups: NeedZoneGroup[],
              incomingGroups: NeedZoneGroup[]
            ): NeedZoneGroup[] => {
              const merged = new Map<string, NeedZone[]>();

              const add = (groups: NeedZoneGroup[]) => {
                groups.forEach((g) => {
                  Object.entries(g).forEach(([reserveId, zones]) => {
                    const list = merged.get(reserveId) || [];
                    // Dedup by Time+Activity
                    const combined = [...list, ...(zones || [])];
                    const seen = new Set<string>();
                    const unique = combined.filter((z) => {
                      const key = `${z.Time}|${z.Activity}`;
                      if (seen.has(key)) return false;
                      seen.add(key);
                      return true;
                    });
                    merged.set(reserveId, unique);
                  });
                });
              };

              add(existingGroups);
              add(incomingGroups);

              return Array.from(merged.entries()).map(([reserveId, zones]) => ({
                [reserveId]: zones,
              }));
            };

            const existing = this.animalsData[animal.id];
            const incomingGroups = normalizeNeedZonesForMap(animal.Need_Zones, mapInfo.id);

            if (existing) {
              const existingGroups = existing.Need_Zones as NeedZoneGroup[];
              const merged: AnimalData = {
                ...existing,
                ...animal,
                Need_Zones: mergeNeedZones(existingGroups, incomingGroups),
              };
              this.animalsData[animal.id] = merged;
            } else {
              this.animalsData[animal.id] = {
                ...animal,
                Need_Zones: incomingGroups,
              };
            }
            this.mapsData[mapInfo.name].push(animal.id);
          });
        } catch (err) {
          console.warn(`Error loading ${mapInfo.name}:`, err);
        }
      });

      await Promise.all(promises);
      console.log('Database loaded.', Object.keys(this.animalsData).length, 'total animals.');
    } catch (error) {
      console.error('Critical error in loadData:', error);
    }
  }

  renderMaps() {
    const container = document.getElementById('maps-container');
    if (!container) return;
    container.innerHTML = '';

    AVAILABLE_MAPS.forEach((mapInfo) => {
      const div = document.createElement('div');
      div.className = 'minimal-item';

      const imgPath = `img/maps/${mapInfo.id}.png`;

      div.innerHTML = `
        <div class="item-img-wrapper">
            <img src="${imgPath}" class="item-img" alt="${mapInfo.name}" onerror="this.src='https://via.placeholder.com/300x169?text=${mapInfo.name}'">
        </div>
        <span class="item-title">${mapInfo.name}</span>
      `;

      div.addEventListener('click', () => this.openMap(mapInfo.name));
      container.appendChild(div);
    });
  }

  openMap(mapName: string) {
    this.lastOpenedMapName = mapName;
    const animalIds = this.mapsData[mapName] || [];
    const container = document.getElementById('map-animals-container');
    const title = document.getElementById('current-map-title');

    if (title) title.innerText = mapName;
    if (container) {
      container.innerHTML = '';

      if (animalIds.length === 0) {
        container.innerHTML =
          '<p style="padding:20px; color:#aaa;">Nessun dato per questa mappa.</p>';
      }

      animalIds.forEach((id) => {
        const animal = this.animalsData[id];
        if (animal) {
          const div = document.createElement('div');
          div.className = 'minimal-item';

          const animalImg = `img/animals/${animal.id}.png`;
          const classImg = `img/classes/class_${animal.Class}.png`;

          div.innerHTML = `
                <div class="item-img-wrapper">
                    <img src="${animalImg}" class="item-img" onerror="this.src='https://via.placeholder.com/300x169?text=${animal.Name}'">
                    <img src="${classImg}" class="grid-class-badge" onerror="this.style.display='none'">
                </div>
                <span class="item-title">${animal.Name}</span>
            `;
          div.addEventListener('click', () => this.openAnimal(animal));
          container.appendChild(div);
        }
      });
    }

    this.switchView('view-map');
  }

  openAnimal(animal: AnimalData) {
    const container = document.getElementById('animal-detail-content');
    if (!container) return;

    const findFirstMapForAnimal = (): string | null => {
      for (const [mapName, ids] of Object.entries(this.mapsData)) {
        if (ids.includes(animal.id)) return mapName;
      }
      return null;
    };

    // Normalize need zones to grouped-by-reserve format
    const normalizeNeedZones = (): { reserveId: string; zones: NeedZone[] }[] => {
      if (!animal.Need_Zones || animal.Need_Zones.length === 0) return [];

      const mergedByReserve = new Map<string, NeedZone[]>();

      const addZones = (reserveId: string, zones: NeedZone[] | undefined) => {
        if (!zones || zones.length === 0) return;
        const existing = mergedByReserve.get(reserveId) || [];
        mergedByReserve.set(reserveId, [...existing, ...zones]);
      };

      (animal.Need_Zones as Array<NeedZone | NeedZoneGroup>).forEach((entry) => {
        if (entry && typeof entry === 'object' && 'Time' in entry) {
          addZones('unknown', [entry as NeedZone]);
          return;
        }
        if (entry && typeof entry === 'object') {
          Object.entries(entry as NeedZoneGroup).forEach(([reserveId, zones]) => {
            addZones(reserveId, zones);
          });
        }
      });

      return Array.from(mergedByReserve.entries()).map(([reserveId, zones]) => ({
        reserveId,
        zones,
      }));
    };

    const needZoneGroups = normalizeNeedZones();
    let currentZoneGroupIndex = 0;

    const mapIdToName = (id: string): string => {
      const found = AVAILABLE_MAPS.find((m) => m.id === id || m.name === id);
      if (found) return found.name;
      if (id && id !== 'unknown') return id.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
      return 'Unknown Reserve';
    };

    // --- Recupero Dati Trofei ---
    const trophies = animal.Trophies ||
      animal.Trophy_Ratings || { Silver: '-', Gold: '-', Diamond: '-' };

    const parseDifficulty = (diffRaw: string) => {
      const hasGreatOne = /fabled|great\s*one/i.test(diffRaw);
      const regex = /(\d+)\s*:\s*([^—\-\d]+)/g;
      const matches: { num: string; label: string }[] = [];
      let m: RegExpExecArray | null;
      while ((m = regex.exec(diffRaw)) !== null) {
        const label = m[2].replace(/fabled/gi, '').trim();
        if (label) matches.push({ num: m[1], label });
      }

      if (matches.length > 0) {
        const last = matches[matches.length - 1];
        const text = `${last.num} ${last.label.toUpperCase()}`;
        return { text, hasGreatOne };
      }

      const cleaned = diffRaw.replace(/fabled/gi, '').trim();
      return { text: cleaned || diffRaw, hasGreatOne };
    };

    const { text: difficultyText, hasGreatOne } = parseDifficulty(animal.Difficulty || '');

    // --- Logica Varianti Fur ---
    const furMap = new Map<string, { rarity: string; sexes: Set<string> }>();

    const cleanVariantName = (name: string): string => {
      return name
        .replace(/,/g, '')
        .replace(/\s*\(.*?\)/g, '')
        .trim();
    };

    animal.Variants.forEach((variantGroup) => {
      const sex = variantGroup.Sex;
      const addToMap = (list: string[] | undefined, rarity: string) => {
        if (!list) return;
        list.forEach((rawName) => {
          const name = cleanVariantName(rawName);
          if (!name) return;
          if (!furMap.has(name)) furMap.set(name, { rarity, sexes: new Set() });
          furMap.get(name)!.sexes.add(sex);
        });
      };
      addToMap(variantGroup.Details.Common, 'Common');
      addToMap(variantGroup.Details.Rare, 'Rare');
      addToMap(variantGroup.Details['Very Rare'], 'Very Rare');
    });

    // Generazione HTML Varianti
    let furListHtml = '';
    const rarityPriority: Record<string, number> = { 'Very Rare': 1, Rare: 2, Common: 3 };

    const sortedFurs = Array.from(furMap.entries()).sort((a, b) => {
      const rA = rarityPriority[a[1].rarity] || 99;
      const rB = rarityPriority[b[1].rarity] || 99;
      if (rA !== rB) return rA - rB;
      return a[0].localeCompare(b[0]);
    });

    sortedFurs.forEach(([name, info]) => {
      let dotColorClass = 'dot-common';
      if (info.rarity === 'Rare') dotColorClass = 'dot-rare';
      if (info.rarity === 'Very Rare') dotColorClass = 'dot-very-rare';

      let sexIconHtml = '';
      if (info.sexes.size === 1) {
        if (info.sexes.has('Female'))
          sexIconHtml = `<img src="img/icons/female.png" class="fur-sex-icon" alt="F">`;
        else if (info.sexes.has('Male'))
          sexIconHtml = `<img src="img/icons/male.png" class="fur-sex-icon" alt="M">`;
      }

      furListHtml += `
            <li class="detail-list-item">
                <div class="detail-left">
                    <span class="fur-dot ${dotColorClass}"></span>
                    <span class="detail-name">${name}</span>
                </div>
                <div class="detail-right">
                    ${sexIconHtml}
                </div>
            </li>
        `;
    });

    // --- Icone Header ---
    const animalIcon = `img/animals/${animal.id}.png`;
    const classIcon = `img/classes/class_${animal.Class}.png`;

    // --- CSS Personalizzato (Aggiornato per supportare entrambi) ---
    const customStyle = `
        <style>
            .details-header { margin-top: 0; margin-bottom: 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #ccc; }
            
            /* Badge Rarità */
            .rarity-badges { display: flex; gap: 8px; margin-bottom: 15px; }
            .rarity-badge { padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; color: #fff; text-transform: uppercase; }
            .badge-common { background-color: #7f8c8d; }
            .badge-rare { background-color: #3498db; }
            .badge-very-rare { background-color: #9b59b6; }
            
            /* Lista Condivisa (Need Zones & Fur) */
            .details-list { list-style: none; padding: 0; margin: 0; }
            .detail-list-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
            .detail-left { display: flex; align-items: center; gap: 10px; }
            .detail-right { display: flex; align-items: center; }

            /* Stili Specifici Elementi */
            .detail-name { font-size: 14px; color: #ecf0f1; text-transform: capitalize; }
            .fur-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
            .dot-common { background-color: #7f8c8d; }
            .dot-rare { background-color: #3498db; }
            .dot-very-rare { background-color: #9b59b6; }
            
            .zone-icon { height: 20px; width: auto; opacity: 0.9; }
            .zone-time { font-size: 13px; color: #bdc3c7; font-family: 'Consolas', monospace; letter-spacing: 0.5px; }
            .fur-sex-icon { height: 14px; width: auto; opacity: 0.8; }
        </style>
    `;

    container.innerHTML = `
        ${customStyle}
        <div class="animal-header">
            <div class="header-left">
                <img src="${animalIcon}" class="animal-icon-large" onerror="this.src='https://via.placeholder.com/100'">
                <h1>${animal.Name}</h1>
            </div>
            
            <div class="header-right">
                <img src="${classIcon}" class="header-class-icon" onerror="this.style.display='none'">
                <span class="class-label">Class ${animal.Class}</span>
            </div>
        </div>

        <div class="stats-row-trophies">
            <div class="stat-group-basic stat-group-wide">
                <div class="stat-box-small">
                    <span class="stat-label">Max Difficulty</span>
                    <span class="stat-value">${difficultyText}</span>
                </div>
                <div class="stat-box-small">
                    <span class="stat-label">Trophy Type</span>
                    <span class="stat-value">${animal['Trophy Type']}</span>
                </div>
            </div>

            <div class="stat-group-medals">
                <div class="medal-box">
                    <img src="img/icons/silver.png" class="medal-icon" alt="Silver" width="64" height="64">
                    <span class="medal-value">${trophies.Silver}</span>
                </div>
                <div class="medal-box">
                    <img src="img/icons/gold.png" class="medal-icon" alt="Gold" width="64" height="64">
                    <span class="medal-value">${trophies.Gold}</span>
                </div>
                <div class="medal-box">
                    <img src="img/icons/diamond.png" class="medal-icon" alt="Diamond" width="64" height="64">
                    <span class="medal-value">${trophies.Diamond}</span>
                </div>
                ${
                  hasGreatOne
                    ? `
                <div class="medal-box greatone-box">
                    <img src="img/icons/greatone.png" class="medal-icon" alt="Great One" width="64" height="64">
                    <span class="medal-value"></span>
                </div>`
                    : ''
                }
            </div>
        </div>

        <div class="details-split">
            <div>
                <h3 class="details-header">NEED ZONES</h3>
                <div class="need-zone-switcher">
                    <button class="zone-nav-btn" id="zone-prev">⟵</button>
                    <span class="zone-label" id="zone-label"></span>
                    <button class="zone-nav-btn" id="zone-next">⟶</button>
                </div>
                <ul class="details-list" id="need-zone-list"></ul>
            </div>
            
            <div>
                <h3 class="details-header">FUR TYPES</h3>
                
                <div class="rarity-badges">
                    <span class="rarity-badge badge-common">Common</span>
                    <span class="rarity-badge badge-rare">Rare</span>
                    <span class="rarity-badge badge-very-rare">Very Rare</span>
                </div>

                <ul class="details-list">
                    ${furListHtml || '<li style="color:#666; padding:10px 0;">No variant data.</li>'}
                </ul>
            </div>
        </div>
    `;

    // Need zone navigation rendering
    const zoneLabelEl = container.querySelector('#zone-label') as HTMLElement | null;
    const zoneListEl = container.querySelector('#need-zone-list') as HTMLElement | null;
    const prevBtn = container.querySelector('#zone-prev') as HTMLButtonElement | null;
    const nextBtn = container.querySelector('#zone-next') as HTMLButtonElement | null;

    const renderZoneGroup = () => {
      if (!zoneLabelEl || !zoneListEl) return;
      if (needZoneGroups.length === 0) {
        zoneLabelEl.innerText = 'No Zones';
        zoneListEl.innerHTML = '<li style="color:#666; padding:10px 0;">No data available.</li>';
        if (prevBtn) prevBtn.disabled = true;
        if (nextBtn) nextBtn.disabled = true;
        return;
      }

      const group = needZoneGroups[currentZoneGroupIndex];
      zoneLabelEl.innerText = mapIdToName(group.reserveId);

      const sortedZones = [...group.zones].sort((a, b) => a.Time.localeCompare(b.Time));
      const html = sortedZones
        .map((z) => {
          const iconName = z.Activity.toLowerCase().split(' ')[0];
          return `
                <li class="detail-list-item">
                    <div class="detail-left">
                        <img src="img/need_zones/${iconName}.png" class="zone-icon" onerror="this.style.display='none'">
                        <span class="detail-name">${z.Activity}</span>
                    </div>
                    <div class="detail-right">
                        <span class="zone-time">${z.Time}</span>
                    </div>
                </li>
            `;
        })
        .join('');

      zoneListEl.innerHTML =
        html || '<li style="color:#666; padding:10px 0;">No data available.</li>';

      const multiple = needZoneGroups.length > 1;
      if (prevBtn) prevBtn.disabled = !multiple;
      if (nextBtn) nextBtn.disabled = !multiple;
    };

    prevBtn?.addEventListener('click', () => {
      if (needZoneGroups.length < 2) return;
      currentZoneGroupIndex =
        (currentZoneGroupIndex - 1 + needZoneGroups.length) % needZoneGroups.length;
      renderZoneGroup();
    });

    nextBtn?.addEventListener('click', () => {
      if (needZoneGroups.length < 2) return;
      currentZoneGroupIndex = (currentZoneGroupIndex + 1) % needZoneGroups.length;
      renderZoneGroup();
    });

    renderZoneGroup();

    this.switchView('view-animal');
  }

  switchView(viewId: string) {
    document.querySelectorAll('.view').forEach((el) => el.classList.add('hidden'));
    document.getElementById(viewId)?.classList.remove('hidden');
    document.querySelector('main')?.scrollTo(0, 0);
  }

  handleSearch(query: string) {
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) return;

    if (query.length < 2) {
      resultsContainer.classList.add('hidden');
      return;
    }

    const matches = Object.values(this.animalsData).filter((a) =>
      a.Name.toLowerCase().includes(query.toLowerCase())
    );
    const uniqueMatches = Array.from(new Set(matches.map((a) => a.id))).map(
      (id) => matches.find((a) => a.id === id)!
    );

    resultsContainer.innerHTML = '';
    if (uniqueMatches.length > 0) {
      resultsContainer.classList.remove('hidden');
      uniqueMatches.forEach((animal) => {
        const div = document.createElement('div');
        div.className = 'search-item';
        const animalImg = `img/animals/${animal.id}.png`;
        const classImg = `img/classes/class_${animal.Class}.png`;
        div.innerHTML = `
                <div class="search-item-left">
                    <img src="${animalImg}" class="search-thumb" onerror="this.style.display='none'">
                    <span class="search-name">${animal.Name}</span>
                </div>
                <div class="search-item-right">
                    <img src="${classImg}" class="search-class" onerror="this.style.display='none'">
                </div>
            `;
        div.onclick = () => {
          this.openAnimal(animal);
          resultsContainer.classList.add('hidden');
          (document.getElementById('search-bar') as HTMLInputElement).value = '';
        };
        resultsContainer.appendChild(div);
      });
    } else {
      resultsContainer.classList.add('hidden');
    }
  }
}

new InGameController();
