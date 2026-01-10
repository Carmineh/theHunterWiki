export const AVAILABLE_MAPS = [
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

export type NeedZoneGroup = Record<string, NeedZone[]>;

export interface TrophyRatings {
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
  Need_Zones: (NeedZone | NeedZoneGroup)[];
  Variants: FurVariant[];
  Trophies?: TrophyRatings;
  Trophy_Ratings?: TrophyRatings;
}

export interface MapInfo {
  name: string;
  id: string;
}
