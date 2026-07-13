// Filter taxonomy for PokeArt.ai
//
// Two-layer model: user-facing labels map to one or more raw metadata values
// stored in Pinecone. This collapses synonym rarities (e.g. "Ultra Rare" and
// "Rare Ultra"), groups sets by TCG era, and lets a parent selection expand to
// all of its children. The API filters with `$in` over the raw `values`.

export interface FilterOption {
  /** User-facing label for a single selectable leaf. */
  label: string;
  /** Raw metadata values in Pinecone this label maps to. */
  values: string[];
}

export interface FilterGroup {
  /** Parent group label (rarity tier or set era). */
  label: string;
  options: FilterOption[];
}

// ─── Rarities ──────────────────────────────────────────────────────────────
// Grouped into collector-recognized tiers. Synonym strings from different eras
// are merged under one label (e.g. Ultra Rare + Rare Ultra, ACE SPEC Rare +
// Rare ACE, Rare Shiny + Shiny Rare).

export const RARITY_GROUPS: FilterGroup[] = [
  {
    label: "Base",
    options: [
      { label: "Common", values: ["Common"] },
      { label: "Uncommon", values: ["Uncommon"] },
      { label: "Rare", values: ["Rare"] },
      { label: "Rare Holo", values: ["Rare Holo"] },
    ],
  },
  {
    label: "Double Rare (ex)",
    options: [{ label: "Double Rare (ex)", values: ["Double Rare"] }],
  },
  {
    label: "Ultra Rare",
    options: [
      { label: "EX", values: ["Rare Holo EX"] },
      { label: "GX", values: ["Rare Holo GX"] },
      { label: "V", values: ["Rare Holo V"] },
      { label: "VMAX", values: ["Rare Holo VMAX"] },
      { label: "VSTAR", values: ["Rare Holo VSTAR"] },
      { label: "LV.X", values: ["Rare Holo LV.X"] },
      { label: "Full Art / Ultra Rare", values: ["Ultra Rare", "Rare Ultra"] },
    ],
  },
  {
    label: "Illustration Rare",
    options: [
      { label: "Illustration Rare (IR)", values: ["Illustration Rare"] },
      {
        label: "Special Illustration Rare (SIR)",
        values: ["Special Illustration Rare"],
      },
    ],
  },
  {
    label: "Secret / Gold",
    options: [
      { label: "Secret Rare", values: ["Rare Secret"] },
      { label: "Rainbow Rare", values: ["Rare Rainbow"] },
      { label: "Hyper Rare (Gold)", values: ["Hyper Rare"] },
      { label: "Mega Hyper Rare", values: ["Mega Hyper Rare"] },
    ],
  },
  {
    label: "Shiny",
    options: [
      { label: "Shiny Rare", values: ["Rare Shiny", "Shiny Rare"] },
      { label: "Shiny GX", values: ["Rare Shiny GX"] },
      { label: "Shiny Ultra Rare", values: ["Shiny Ultra Rare"] },
      { label: "Radiant", values: ["Radiant Rare"] },
      { label: "Shining", values: ["Rare Shining"] },
    ],
  },
  {
    label: "Special Mechanics",
    options: [
      { label: "Gold Star", values: ["Rare Holo Star"] },
      { label: "Prime", values: ["Rare Prime"] },
      { label: "LEGEND", values: ["LEGEND"] },
      { label: "BREAK", values: ["Rare BREAK"] },
      { label: "Prism Star", values: ["Rare Prism Star"] },
      { label: "Amazing Rare", values: ["Amazing Rare"] },
      { label: "ACE SPEC", values: ["ACE SPEC Rare", "Rare ACE"] },
    ],
  },
  {
    label: "Subsets & Reprints",
    options: [
      { label: "Trainer Gallery", values: ["Trainer Gallery Rare Holo"] },
      { label: "Classic Collection", values: ["Classic Collection"] },
    ],
  },
  {
    label: "Promo",
    options: [{ label: "Promo", values: ["Promo"] }],
  },
  {
    label: "Other",
    options: [
      {
        label: "Other / Unknown",
        values: ["Unknown", "MEGA_ATTACK_RARE", "Black White Rare"],
      },
    ],
  },
];

// ─── Sets ────────────────────────────────────────────────────────────────
// Grouped by TCG era, newest to oldest. Each set maps to its exact metadata
// value. Promos, energies, and tie-in products live in a Promos & Misc bucket.

function sets(...names: string[]): FilterOption[] {
  return names.map((name) => ({ label: name, values: [name] }));
}

export const SET_GROUPS: FilterGroup[] = [
  {
    label: "Scarlet & Violet Era",
    options: sets(
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
      "Destined Rivals",
      "Black Bolt",
      "White Flare",
      "Phantasmal Flames",
      "Mega Evolution",
      "Ascended Heroes",
      "Perfect Order",
      "Chaos Rising"
    ),
  },
  {
    label: "Sword & Shield Era",
    options: sets(
      "Sword & Shield",
      "Rebel Clash",
      "Darkness Ablaze",
      "Champion's Path",
      "Vivid Voltage",
      "Shining Fates",
      "Shining Fates Shiny Vault",
      "Battle Styles",
      "Chilling Reign",
      "Evolving Skies",
      "Fusion Strike",
      "Brilliant Stars",
      "Brilliant Stars Trainer Gallery",
      "Astral Radiance",
      "Astral Radiance Trainer Gallery",
      "Pokémon GO",
      "Lost Origin",
      "Lost Origin Trainer Gallery",
      "Silver Tempest",
      "Silver Tempest Trainer Gallery",
      "Crown Zenith",
      "Crown Zenith Galarian Gallery"
    ),
  },
  {
    label: "Sun & Moon Era",
    options: sets(
      "Sun & Moon",
      "Guardians Rising",
      "Burning Shadows",
      "Shining Legends",
      "Crimson Invasion",
      "Ultra Prism",
      "Forbidden Light",
      "Celestial Storm",
      "Dragon Majesty",
      "Lost Thunder",
      "Team Up",
      "Detective Pikachu",
      "Unbroken Bonds",
      "Unified Minds",
      "Hidden Fates",
      "Hidden Fates Shiny Vault",
      "Cosmic Eclipse"
    ),
  },
  {
    label: "XY Era",
    options: sets(
      "Kalos Starter Set",
      "XY",
      "Flashfire",
      "Furious Fists",
      "Phantom Forces",
      "Primal Clash",
      "Double Crisis",
      "Roaring Skies",
      "Ancient Origins",
      "BREAKthrough",
      "BREAKpoint",
      "Generations",
      "Fates Collide",
      "Steam Siege",
      "Evolutions"
    ),
  },
  {
    label: "Black & White Era",
    options: sets(
      "Black & White",
      "Emerging Powers",
      "Noble Victories",
      "Next Destinies",
      "Dark Explorers",
      "Dragons Exalted",
      "Dragon Vault",
      "Boundaries Crossed",
      "Plasma Storm",
      "Plasma Freeze",
      "Plasma Blast",
      "Legendary Treasures"
    ),
  },
  {
    label: "HeartGold SoulSilver / Platinum / Diamond & Pearl",
    options: sets(
      "Diamond & Pearl",
      "Mysterious Treasures",
      "Secret Wonders",
      "Great Encounters",
      "Majestic Dawn",
      "Legends Awakened",
      "Stormfront",
      "Platinum",
      "Rising Rivals",
      "Supreme Victors",
      "Arceus",
      "HeartGold & SoulSilver",
      "HS—Unleashed",
      "HS—Undaunted",
      "HS—Triumphant",
      "Call of Legends"
    ),
  },
  {
    label: "EX / e-Card Era (Ruby & Sapphire)",
    options: sets(
      "Expedition Base Set",
      "Aquapolis",
      "Skyridge",
      "Ruby & Sapphire",
      "Sandstorm",
      "Dragon",
      "Team Magma vs Team Aqua",
      "Hidden Legends",
      "FireRed & LeafGreen",
      "Team Rocket Returns",
      "Deoxys",
      "Emerald",
      "Unseen Forces",
      "Delta Species",
      "Legend Maker",
      "Holon Phantoms",
      "Crystal Guardians",
      "Dragon Frontiers",
      "Power Keepers"
    ),
  },
  {
    label: "Vintage (WotC)",
    options: sets(
      "Base",
      "Jungle",
      "Fossil",
      "Base Set 2",
      "Team Rocket",
      "Gym Heroes",
      "Gym Challenge",
      "Neo Genesis",
      "Neo Discovery",
      "Neo Revelation",
      "Neo Destiny",
      "Legendary Collection",
      "Southern Islands"
    ),
  },
  {
    label: "Promos & Misc",
    options: sets(
      "Scarlet & Violet Black Star Promos",
      "Scarlet & Violet Promos",
      "Scarlet & Violet Energies",
      "SWSH Black Star Promos",
      "SM Black Star Promos",
      "XY Black Star Promos",
      "BW Black Star Promos",
      "DP Black Star Promos",
      "HGSS Black Star Promos",
      "Wizards Black Star Promos",
      "Nintendo Black Star Promos",
      "Celebrations",
      "Celebrations: Classic Collection",
      "McDonald's Collection 2011",
      "McDonald's Collection 2012",
      "McDonald's Collection 2016",
      "McDonald's Collection 2019",
      "McDonald's Collection 2021",
      "McDonald's Collection 2022",
      "POP Series 1",
      "POP Series 2",
      "POP Series 3",
      "POP Series 4",
      "POP Series 5",
      "POP Series 6",
      "POP Series 7",
      "POP Series 8",
      "POP Series 9",
      "EX Trainer Kit Latias",
      "EX Trainer Kit Latios",
      "EX Trainer Kit 2 Minun",
      "EX Trainer Kit 2 Plusle",
      "Pokémon Rumble",
      "Pokémon Futsal Collection",
      "Best of Game"
    ),
  },
];

// ─── Selection state ─────────────────────────────────────────────────────
// Filters hold the raw metadata values (already expanded from labels), so the
// API can pass them straight into a Pinecone `$in` filter.

export interface SearchFilters {
  rarities: string[];
  sets: string[];
}

export const EMPTY_FILTERS: SearchFilters = {
  rarities: [],
  sets: [],
};
