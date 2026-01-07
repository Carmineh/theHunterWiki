export interface NeedZone {
    Time: string;
    Activity: string; // "Resting", "Feeding", "Drinking"
}

export interface FurVariant {
    Sex: string;
    Details: {
        Common: string[];
        "Very Rare"?: string[];
        Rare?: string[];
    };
}

export interface Animal {
    id: string;
    Name: string;
    Class: string; 
    Difficulty: string;
    "Trophy Type": string;
    Weight: string;
    Need_Zones: NeedZone[];
    Variants: FurVariant[];
}