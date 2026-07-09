import { PokemonCard } from "@/types/pokemon";

export const mockCards: PokemonCard[] = [
  {
    id: "1",
    name: "Pikachu",
    setName: "Scarlet & Violet — 151",
    rarity: "Illustration Rare",
    artDescription:
      "A cheerful Pikachu stands on golden sand at a tropical beach, turquoise waves curling behind it. Palm trees sway in warm sunset light with vaporwave pink and cyan gradients bleeding into the sky. Tiny footprints trail toward the shoreline.",
    keywords: ["beach", "pikachu", "vaporwave", "sunset", "tropical", "sand"],
  },
  {
    id: "2",
    name: "Pikachu",
    setName: "Sword & Shield — Fusion Strike",
    rarity: "Secret Rare",
    artDescription:
      "Pikachu poses confidently in the foreground while a mischievous Gengar lurks directly behind it, half-hidden in shadow with glowing red eyes and a wide grin. The composition plays on the classic 'someone standing behind you' meme.",
    keywords: ["gengar", "pikachu", "hidden", "shadow", "behind"],
  },
  {
    id: "3",
    name: "Delibird",
    setName: "Sword & Shield — Chilling Reign",
    rarity: "Full Art",
    artDescription:
      "Delibird waddles through a snow-covered village decorated with twinkling Christmas lights, holly wreaths, and wrapped presents. Warm golden glow spills from cottage windows against a deep winter night sky.",
    keywords: ["christmas", "holiday", "snow", "winter", "festive", "delibird"],
  },
  {
    id: "4",
    name: "Charizard ex",
    setName: "Scarlet & Violet — Obsidian Flames",
    rarity: "Special Illustration Rare",
    artDescription:
      "An explosive composition dominated by fiery reds and crimson embers. Charizard erupts from molten rock, wings spread wide, the entire palette saturated in scarlet, vermillion, and deep ruby tones.",
    keywords: ["red", "fire", "charizard", "crimson", "flames"],
  },
  {
    id: "5",
    name: "Eevee",
    setName: "Sword & Shield — Evolving Skies",
    rarity: "Illustration Rare",
    artDescription:
      "Rendered in delicate watercolor washes with visible paper texture and soft pigment bleeds. Eevee rests in a meadow of wildflowers, edges feathered and dreamy, like a hand-painted gallery piece.",
    keywords: ["watercolor", "painting", "soft", "artistic", "eevee", "meadow"],
  },
  {
    id: "6",
    name: "Snorlax",
    setName: "Scarlet & Violet — Paldea Evolved",
    rarity: "Illustration Rare",
    artDescription:
      "A charming claymation-style scene with visible fingerprint textures and stop-motion aesthetic. Snorlax naps on a miniature handcrafted hillside while tiny clay Pokémon figures picnic nearby.",
    keywords: ["claymation", "clay", "stop-motion", "snorlax", "handcrafted"],
  },
  {
    id: "7",
    name: "Ditto",
    setName: "Scarlet & Violet — Paldea Evolved",
    rarity: "Illustration Rare",
    artDescription:
      "At first glance a serene forest landscape, but a purple Ditto is cleverly disguised as a boulder near the center. Its subtle smile and glossy surface betray its true identity upon close inspection.",
    keywords: ["ditto", "hidden", "disguise", "camouflage", "secret"],
  },
  {
    id: "8",
    name: "Lapras",
    setName: "Sword & Shield — Vivid Voltage",
    rarity: "Full Art",
    artDescription:
      "Lapras glides across a neon-lit ocean under a retro vaporwave sky. Grid lines stretch to the horizon, palm tree silhouettes frame the scene, and pink-purple gradients reflect off crystalline water.",
    keywords: ["vaporwave", "beach", "neon", "retro", "lapras", "ocean"],
  },
  {
    id: "9",
    name: "Mimikyu",
    setName: "Sun & Moon — Lost Thunder",
    rarity: "Secret Rare",
    artDescription:
      "Mimikyu hides beneath its tattered Pikachu costume in a dim attic filled with dusty antiques. Cobwebs, old photographs, and a single shaft of moonlight create an eerie yet endearing atmosphere.",
    keywords: ["hidden", "shadow", "mimikyu", "disguise", "eerie"],
  },
  {
    id: "10",
    name: "Bulbasaur",
    setName: "Scarlet & Violet — 151",
    rarity: "Illustration Rare",
    artDescription:
      "Bulbasaur tends a lush greenhouse garden in soft watercolor style. Morning dew glistens on leaves, translucent green washes layer over one another, and sunlight filters through glass panes.",
    keywords: ["watercolor", "garden", "green", "bulbasaur", "nature", "soft"],
  },
];

export const sampleSearches = [
  "gengar behind pikachu",
  "hidden ditto",
  "vaporwave beach",
  "claymation",
  "christmas vibe",
] as const;
