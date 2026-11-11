import { AnimalData } from './types';

export class SearchHandler {
  handleSearch(
    query: string,
    animalsData: Record<string, AnimalData>,
    resultsContainer: HTMLElement,
    searchInput: HTMLInputElement,
    onAnimalClick: (animal: AnimalData) => void
  ): void {
    if (query.length < 2) {
      resultsContainer.classList.add('hidden');
      return;
    }

    const matches = Object.values(animalsData).filter((a) =>
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
          onAnimalClick(animal);
          resultsContainer.classList.add('hidden');
          searchInput.value = '';
        };

        resultsContainer.appendChild(div);
      });
    } else {
      resultsContainer.classList.add('hidden');
    }
  }
}
