export const FARM_CATEGORIES = ['Farmhouse', 'Villa', 'Weekend Home', 'Appartment'] as const;

export type FarmCategory = (typeof FARM_CATEGORIES)[number];

export function isFarmCategory(value: unknown): value is FarmCategory {
  return typeof value === 'string' && FARM_CATEGORIES.includes(value as FarmCategory);
}
