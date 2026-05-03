export type StyleType = 
  | 'modern' 
  | 'classic_european' 
  | 'hamptons' 
  | 'french_country' 
  | 'french_chateau' 
  | 'english_townhouse';

export type RoomType = 
  | 'Kitchen' 
  | 'Dining Room' 
  | 'Lounge Room' 
  | 'Pantry' 
  | 'Butler\'s Pantry' 
  | 'Laundry Room' 
  | 'Boot Room' 
  | 'Bedroom' 
  | 'Bathroom' 
  | 'En-suite';

export interface RoomDesignData {
  type: RoomType;
  style: StyleType;
  specificAnswers: Record<string, string>;
  existingFurniture: string;
  referenceImages?: string[]; // Array of base64 images
  technicalBrief?: string;
}

export interface ProjectData {
  projectName: string;
  propertyAge: string;
  floorPlanImage: string | null;
  rooms: RoomDesignData[];
}

export interface DesignReport {
  layoutDescription: string;
  materialList: { name: string; quantity: string; dimensions: string }[];
  wallColors: { name: string; hex: string; brand: string }[];
  renderPrompt: string;
  renderImageUrl?: string;
}
