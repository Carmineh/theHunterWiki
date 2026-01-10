import { AnimalData, AVAILABLE_MAPS } from './types';

export class MapRenderer {
  renderMapsGrid(container: HTMLElement, onMapClick: (mapName: string) => void): void {
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

      div.addEventListener('click', () => onMapClick(mapInfo.name));
      container.appendChild(div);
    });
  }

  renderMapAnimals(
    container: HTMLElement,
    animalIds: string[],
    animalsData: Record<string, AnimalData>,
    onAnimalClick: (animal: AnimalData) => void
  ): void {
    container.innerHTML = '';

    if (animalIds.length === 0) {
      container.innerHTML = '<p style="padding:20px; color:#aaa;">No data for this map.</p>';
      return;
    }

    animalIds.forEach((id) => {
      const animal = animalsData[id];
      if (!animal) return;

      const div = document.createElement('div');
      div.className = 'minimal-item';

      const animalImg = `img/animals/${animal.id}.png`;
      const classImg = `img/classes/class_${animal.Class}.png`;

      div.innerHTML = `
        <div class="item-img-wrapper">
            <img src="${animalImg}" class="item-img" alt="${animal.Name}" onerror="this.src='https://via.placeholder.com/150'">
            <img src="${classImg}" class="grid-class-badge" onerror="this.style.display='none'">
        </div>
        <span class="item-title">${animal.Name}</span>
      `;

      div.addEventListener('click', () => onAnimalClick(animal));
      container.appendChild(div);
    });
  }
}
