import { AnimalData, NeedZone, NeedZoneGroup, AVAILABLE_MAPS } from './types';

export class AnimalDetailRenderer {
  render(animal: AnimalData, container: HTMLElement): void {
    const needZoneGroups = this.normalizeNeedZones(animal);
    let currentZoneGroupIndex = 0;

    const trophies = animal.Trophies ||
      animal.Trophy_Ratings || { Silver: '-', Gold: '-', Diamond: '-' };

    const { text: difficultyText, hasGreatOne } = this.parseDifficulty(animal.Difficulty || '');
    const furListHtml = this.generateFurListHtml(animal);

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

    this.setupNeedZoneNavigation(container, needZoneGroups, currentZoneGroupIndex);
  }

  private normalizeNeedZones(animal: AnimalData): { reserveId: string; zones: NeedZone[] }[] {
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
  }

  private mapIdToName(id: string): string {
    const found = AVAILABLE_MAPS.find((m) => m.id === id || m.name === id);
    if (found) return found.name;
    if (id && id !== 'unknown') return id.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    return 'Unknown Reserve';
  }

  private parseDifficulty(diffRaw: string): { text: string; hasGreatOne: boolean } {
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
  }

  private cleanVariantName(name: string): string {
    return name
      .replace(/,/g, '')
      .replace(/\s*\(.*?\)/g, '')
      .trim();
  }

  private generateFurListHtml(animal: AnimalData): string {
    const furMap = new Map<string, { rarity: string; sexes: Set<string> }>();

    animal.Variants.forEach((variantGroup) => {
      const sex = variantGroup.Sex;
      const addToMap = (list: string[] | undefined, rarity: string) => {
        if (!list) return;
        list.forEach((rawName) => {
          const name = this.cleanVariantName(rawName);
          if (!name) return;
          if (!furMap.has(name)) furMap.set(name, { rarity, sexes: new Set() });
          furMap.get(name)!.sexes.add(sex);
        });
      };
      addToMap(variantGroup.Details.Common, 'Common');
      addToMap(variantGroup.Details.Rare, 'Rare');
      addToMap(variantGroup.Details['Very Rare'], 'Very Rare');
    });

    const rarityPriority: Record<string, number> = { 'Very Rare': 1, Rare: 2, Common: 3 };
    const sortedFurs = Array.from(furMap.entries()).sort((a, b) => {
      const rA = rarityPriority[a[1].rarity] || 99;
      const rB = rarityPriority[b[1].rarity] || 99;
      if (rA !== rB) return rA - rB;
      return a[0].localeCompare(b[0]);
    });

    let furListHtml = '';
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

    return furListHtml;
  }

  private setupNeedZoneNavigation(
    container: HTMLElement,
    needZoneGroups: { reserveId: string; zones: NeedZone[] }[],
    initialIndex: number
  ): void {
    const zoneLabelEl = container.querySelector('#zone-label') as HTMLElement | null;
    const zoneListEl = container.querySelector('#need-zone-list') as HTMLElement | null;
    const prevBtn = container.querySelector('#zone-prev') as HTMLButtonElement | null;
    const nextBtn = container.querySelector('#zone-next') as HTMLButtonElement | null;

    let currentZoneGroupIndex = initialIndex;

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
      zoneLabelEl.innerText = this.mapIdToName(group.reserveId);

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
  }
}
