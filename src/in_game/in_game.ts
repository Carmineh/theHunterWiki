import {
  OWGames,
  OWGamesEvents,
  OWHotkeys
} from "@overwolf/overwolf-api-ts";

/*
Medved-Taiga National Park (based on the Siberian taiga)
Vurhonga Savanna Reserve (representing the South African savannah)
Parque Fernando (modeled after South American forests)
Yukon Valley (based on Alaska's Fall season with little snow)
Cuatro Colinas Game Reserve (inspired by Spain's Corn Fields and Hills)
Silver Ridge Peaks (modeled after the Rocky Mountains in the United States)
Te Awaroa National Park (based on New Zealand's tall mountains and long coasts)
Rancho del Arroyo (representing Mexico's Hilly landscape and jagged hills)
Mississippi Acres Preserve (located in the swamps of the southern United States)
Revontuli Coast (based on Finland's cold mossy forests and big lakes)
New England Mountains (inspired by the states of the US in the New England region)
Emerald Coast (based on the Australian Coast and thick bushy forests)
Sundarpatan (located in Nepal's swampy lowlands and tall, snowy mountains)
Salzwiesen Park (representing north German wetlands)
Askiy Ridge Hunting Preserve (located in Alberta, Canada)
Tòrr nan Sithean (based on the Scottish highlands)
*/
const AVAILABLE_MAPS = [
  { name: "Hirschfelden", id: "hirschfelden_hunting_reserve" },
  { name: "Layton Lake District ", id: "layton_lake_district" },
  { name: "Medved-Taiga National Park", id: "medved-taiga_national_park" },
  { name: "Vurhonga Savanna Reserve", id: "vurhonga_savanna_reserve" },
  { name: "Parque Fernando", id: "parque_fernando" },
  { name: "Yukon Valley", id: "yukon_valley" },
  { name: "Cuatro Colinas Reserve", id: "cuatro_colinas_reserve" },
  { name: "Silver Ridge Peaks", id: "silver_ridge_peaks" },
  { name: "Te Awaroa National Park", id: "te_awaroa_national_park" },
  { name: "Rancho del Arroyo", id: "rancho_del_arroyo" },
  { name: "Mississippi Acres Preserve", id: "mississippi_acres_preserve" },
  { name: "Revontuli Coast", id: "revontuli_coast" },
  { name: "New England Mountains", id: "new_england_mountains" },
  { name: "Emerald Coast", id: "emerald_coast" },
  { name: "Sundarpatan", id: "sundarpatan" },
  { name: "Salzwiesen Park", id: "salzwiesen_park" },
  { name: "Askiy Ridge Hunting Preserve", id: "askiy_ridge_hunting_preserve" },
  { name: "Tòrr nan Sithean", id: "torr_nan_sithean" }
  
];

// --- INTERFACCE ---
interface NeedZone {
  Time: string;
  Activity: string;
}

interface FurDetails {
  Common: string[];
  "Very Rare"?: string[];
  Rare?: string[];
}

interface Variant {
  Sex: string;
  Details: FurDetails;
}

interface AnimalData {
  id: string;
  Name: string;
  Class: string;
  Difficulty: string;
  "Trophy Type": string;
  Weight: string;
  Need_Zones: NeedZone[];
  Variants: Variant[];
}

// --- CONTROLLER PRINCIPALE ---
class InGameController {
  
  private animalsData: Record<string, AnimalData> = {};
  private mapsData: Record<string, string[]> = {};

  constructor() {
    this.init();
  }

  async init() {
    // 1. Carica i dati
    await this.loadData();

    // 2. Setup UI
    this.renderMaps();

    // 3. Listeners Navigazione
    document.getElementById('btn-back-home')?.addEventListener('click', () => this.switchView('view-home'));
    document.getElementById('btn-back-map')?.addEventListener('click', () => this.switchView('view-map'));

    // 4. Search Bar
    const searchInput = document.getElementById('search-bar') as HTMLInputElement;
    searchInput?.addEventListener('input', (e) => this.handleSearch((e.target as HTMLInputElement).value));
  }

  // --- CARICAMENTO DATI ---
  async loadData() {
    try {
        const promises = AVAILABLE_MAPS.map(async (mapInfo) => {
            try {
                // I dati rimangono in data/, le immagini in img/
                const response = await fetch(`data/${mapInfo.id}.json`);
                if (!response.ok) return; // Salta se il file non esiste
                
                const animalsList: AnimalData[] = await response.json();
                
                this.mapsData[mapInfo.name] = [];

                animalsList.forEach(animal => {
                    this.animalsData[animal.id] = animal;
                    this.mapsData[mapInfo.name].push(animal.id);
                });

            } catch (err) {
                console.warn(`Errore caricamento ${mapInfo.name}:`, err);
            }
        });

        await Promise.all(promises);
        console.log("Database caricato.", Object.keys(this.animalsData).length, "animali totali.");

    } catch (error) {
        console.error("Errore critico loadData:", error);
    }
  }
  renderMaps() {
    const container = document.getElementById('maps-container');
    if (!container) return;
    container.innerHTML = '';

    AVAILABLE_MAPS.forEach(mapInfo => {
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
    const animalIds = this.mapsData[mapName] || [];
    const container = document.getElementById('map-animals-container');
    const title = document.getElementById('current-map-title');
    
    if (title) title.innerText = mapName;
    if (container) {
      container.innerHTML = '';
      
      if (animalIds.length === 0) {
          container.innerHTML = '<p style="padding:20px; color:#aaa;">Nessun dato per questa mappa.</p>';
      }

      animalIds.forEach(id => {
        const animal = this.animalsData[id];
        if (animal) { 
            const div = document.createElement('div');
            div.className = 'minimal-item';
            
            // PATH IMMAGINI: img/animals/.. e img/classes/..
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

    // Genera icone Need Zones
    const zonesHtml = animal.Need_Zones.map(z => {
        const iconName = z.Activity.toLowerCase().split(' ')[0]; 
        // PATH: img/need_zones/...
        return `
            <li class="zone-item">
                <img src="img/need_zones/${iconName}.png" class="zone-icon" onerror="this.style.display='none'">
                <span class="zone-time">${z.Time}</span>
                <span class="zone-activity">${z.Activity}</span>
            </li>
        `;
    }).join('');

    // Genera Varianti
    let variantsHtml = '';
    animal.Variants.forEach(v => {
        const d = v.Details;
        if(d.Common) variantsHtml += `<div class="variant-category"><h4>Common</h4><div class="variant-tags">${d.Common.map(s => `<span>${s}</span>`).join('')}</div></div>`;
        if(d["Very Rare"]) variantsHtml += `<div class="variant-category"><h4 style="color:#d4af37">Very Rare</h4><div class="variant-tags rare">${d["Very Rare"].map(s => `<span>${s}</span>`).join('')}</div></div>`;
    });

    // HEADER: Icona Grande SX | Info centrali | Classe DX
    const animalIcon = `img/animals/${animal.id}.png`;
    const classIcon = `img/classes/class_${animal.Class}.png`;

    container.innerHTML = `
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

        <div class="stats-row">
            <div class="stat-box"><span class="stat-label">Difficulty</span><span class="stat-value">${animal.Difficulty}</span></div>
            <div class="stat-box"><span class="stat-label">Trophy</span><span class="stat-value">${animal["Trophy Type"]}</span></div>
            <div class="stat-box"><span class="stat-label">Weight</span><span class="stat-value">${animal.Weight}</span></div>
        </div>

        <div class="details-split">
            <div>
                <h3 class="section-title">Need Zones</h3>
                ${zonesHtml ? `<ul class="zone-list">${zonesHtml}</ul>` : '<p style="color:#666;">No data.</p>'}
            </div>
            <div>
                <h3 class="section-title">Fur Variants</h3>
                ${variantsHtml || '<p style="color:#666;">No data.</p>'}
            </div>
        </div>
    `;

    this.switchView('view-animal');
  }

  // --- UTILS ---

  switchView(viewId: string) {
    document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
    document.getElementById(viewId)?.classList.remove('hidden');
    document.querySelector('main')?.scrollTo(0,0);
  }

  handleSearch(query: string) {
    const resultsContainer = document.getElementById('search-results');
    if(!resultsContainer) return;
    
    if(query.length < 2) {
        resultsContainer.classList.add('hidden');
        return;
    }

    const matches = Object.values(this.animalsData).filter(a => a.Name.toLowerCase().includes(query.toLowerCase()));
    const uniqueMatches = Array.from(new Set(matches.map(a => a.id))).map(id => matches.find(a => a.id === id)!);

    resultsContainer.innerHTML = '';
    if(uniqueMatches.length > 0) {
        resultsContainer.classList.remove('hidden');
        uniqueMatches.forEach(animal => {
            const div = document.createElement('div');
            div.className = 'search-item';
            div.innerText = animal.Name;
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