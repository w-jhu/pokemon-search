export type LayoutDensity = "grid" | "list";

export interface PokemonCard {
  id: string;
  name: string;
  setName: string;
  rarity: string;
  imageUrl?: string;
  artDescription: string;
  keywords: string[];
}
