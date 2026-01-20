
export interface Ingredient {
  name: string;
  qty: number;
  unit: string;
}

export interface MissingIngredient {
  name: string;
  reason: string;
  sub: string;
}

export interface Recipe {
  id: number;
  name: string;
  real_world_match: string;
  cuisine: string;
  time: string;
  difficulty: string;
  ingredients: string[];
  instructions: string[];
  missing?: MissingIngredient[];
  imageUrl?: string | null;
  imageLoading?: boolean;
}

export enum CuisineType {
  Survival = 'Survival (Basic)',
  Italian = 'Italian Sector',
  Asian = 'Asian Sector',
  Latin = 'Latin Sector',
  MiddleEastern = 'Arid/Desert Sector',
  Nordic = 'Arctic/Cold Sector',
  French = 'Gourmet/Luxury Sector',
  Military = 'Military/High-Cal',
  Healthy = 'Nutritional/Vitality',
  PlantBased = 'Foraged/Botanical',
  Comfort = 'Morale/Sweet Sector'
}

export const UNITS = ['pcs', 'g', 'kg', 'ml', 'l', 'cups', 'tbsp', 'tsp', 'packs'];
export const COMMON_STAPLES = ['salt', 'pepper', 'oil', 'water', 'sugar', 'butter', 'soy sauce', 'flour'];
