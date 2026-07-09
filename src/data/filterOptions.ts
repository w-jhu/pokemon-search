export const RARITY_OPTIONS = [
  "Common",
  "Uncommon",
  "Rare",
  "Rare Holo",
  "Double Rare",
  "Ultra Rare",
  "Illustration Rare",
  "Special Illustration Rare",
  "Hyper Rare",
  "ACE SPEC Rare",
  "Amazing Rare",
  "Radiant Rare",
  "Rare Secret",
  "Rare Rainbow",
  "Rare Shiny",
  "Promo",
] as const;

export const SET_OPTIONS = [
  "Base Set",
  "Jungle",
  "Fossil",
  "Team Rocket",
  "Neo Genesis",
  "EX Ruby & Sapphire",
  "Diamond & Pearl",
  "HeartGold & SoulSilver",
  "Black & White",
  "XY",
  "Sun & Moon",
  "Sword & Shield",
  "Brilliant Stars",
  "Astral Radiance",
  "Lost Origin",
  "Silver Tempest",
  "Crown Zenith",
  "Scarlet & Violet",
  "Paldea Evolved",
  "Obsidian Flames",
  "151",
  "Paradox Rift",
  "Paldean Fates",
  "Temporal Forces",
  "Twilight Masquerade",
  "Shrouded Fable",
  "Stellar Crown",
  "Surging Sparks",
  "Prismatic Evolutions",
  "Journey Together",
] as const;

export interface SearchFilters {
  rarity: string;
  setName: string;
}

export const EMPTY_FILTERS: SearchFilters = {
  rarity: "",
  setName: "",
};
