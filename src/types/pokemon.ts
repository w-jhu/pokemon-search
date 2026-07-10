export type LayoutDensity = "grid" | "list";

export interface PokemonCard {
  id: string;
  name: string;
  setName: string;
  rarity: string;
  imageUrl?: string;
  artDescription: string;
  keywords: string[];
  /** Pinecone similarity score — temporary, for choosing a cutoff */
  score?: number;
}
