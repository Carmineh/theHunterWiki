import { AnimalData, AVAILABLE_MAPS } from './types';

export class DataManager {
  private animalsData: Record<string, AnimalData> = {};
  private mapsData: Record<string, string[]> = {};

  async loadData(): Promise<void> {
    try {
      const promises = AVAILABLE_MAPS.map(async (mapInfo) => {
        try {
          const response = await fetch(`data/${mapInfo.id}.json`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const animalsList: AnimalData[] = await response.json();
          this.mapsData[mapInfo.name] = [];

          animalsList.forEach((animal) => {
            const animalId = animal.id || animal.Name.toLowerCase().replace(/\s+/g, '_');
            animal.id = animalId;

            if (!this.animalsData[animalId]) {
              this.animalsData[animalId] = animal;
            } else {
              const existing = this.animalsData[animalId];

              // Merge need zones
              if (animal.Need_Zones && animal.Need_Zones.length > 0) {
                if (!existing.Need_Zones) {
                  existing.Need_Zones = [];
                }
                const newEntry: any = {};
                newEntry[mapInfo.id] = animal.Need_Zones;
                existing.Need_Zones.push(newEntry);
              }

              // Merge variants
              if (animal.Variants && animal.Variants.length > 0) {
                animal.Variants.forEach((newVar) => {
                  const existingVar = existing.Variants.find((v) => v.Sex === newVar.Sex);
                  if (existingVar) {
                    ['Common', 'Rare', 'Very Rare'].forEach((rarity) => {
                      const rarityKey = rarity as keyof typeof newVar.Details;
                      const newList = newVar.Details[rarityKey];
                      if (newList && newList.length > 0) {
                        if (!existingVar.Details[rarityKey]) {
                          existingVar.Details[rarityKey] = [];
                        }
                        newList.forEach((item) => {
                          if (!existingVar.Details[rarityKey]!.includes(item)) {
                            existingVar.Details[rarityKey]!.push(item);
                          }
                        });
                      }
                    });
                  } else {
                    existing.Variants.push(newVar);
                  }
                });
              }
            }

            if (!this.mapsData[mapInfo.name].includes(animalId)) {
              this.mapsData[mapInfo.name].push(animalId);
            }
          });
        } catch (err) {
          console.warn(`Error loading ${mapInfo.name}:`, err);
        }
      });

      await Promise.all(promises);
    } catch (error) {
      console.error('Critical error in loadData:', error);
    }
  }

  getAnimal(id: string): AnimalData | undefined {
    return this.animalsData[id];
  }

  getAllAnimals(): Record<string, AnimalData> {
    return this.animalsData;
  }

  getMapAnimals(mapName: string): string[] {
    return this.mapsData[mapName] || [];
  }

  getAllMaps(): Record<string, string[]> {
    return this.mapsData;
  }
}
