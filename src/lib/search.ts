import { PokemonCard } from "@/types/pokemon";

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

function scoreCard(card: PokemonCard, tokens: string[]): number {
  if (tokens.length === 0) return 1;

  const haystack = [
    card.name,
    card.setName,
    card.artDescription,
    ...card.keywords,
  ]
    .join(" ")
    .toLowerCase();

  let score = 0;
  for (const token of tokens) {
    if (haystack.includes(token)) score += 2;
    for (const keyword of card.keywords) {
      if (keyword.includes(token) || token.includes(keyword)) score += 1;
    }
  }
  return score;
}

export function searchCards(
  cards: PokemonCard[],
  query: string
): PokemonCard[] {
  const trimmed = query.trim();
  if (!trimmed) return cards;

  const tokens = tokenize(trimmed);
  const scored = cards
    .map((card) => ({ card, score: scoreCard(card, tokens) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map(({ card }) => card);
}

export function simulateSearchDelay(ms = 600): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
