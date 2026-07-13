import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { PokemonCard } from "@/types/pokemon";
import { isDebugMode } from "@/lib/appMode";
import { auth } from "@/auth";
import {
  enforceRateLimit,
  getClientIp,
  rateLimitHeaders,
} from "@/lib/rateLimit";

const INDEX_NAME = "pokemon-card-art";
const TOP_K = 36;
const BROWSE_TOP_K = 100;
const EMBED_DIM = 1536;
const MIN_PINECONE_SCORE = 0.2;
const MIN_LLM_CANDIDATES = 12;
const RERANK_MODEL = "gpt-4o-mini";
const MAX_DESCRIPTION_CHARS = 400;

// Pinecone requires a query vector; for filter-only "browse" we use a neutral
// non-zero vector and re-sort the filtered matches alphabetically.
const NEUTRAL_VECTOR = new Array(EMBED_DIM).fill(1 / Math.sqrt(EMBED_DIM));

function sortByNameAsc(cards: PokemonCard[]): PokemonCard[] {
  return [...cards].sort((a, b) => a.name.localeCompare(b.name));
}

const FILTER_SYSTEM_PROMPT = `Strict filter for Pokémon card art search. Return which candidate ids to INCLUDE.

INCLUDE only if the query term (or a clear synonym) appears explicitly in the card name or art description as a depicted subject, setting, weather, color, mood, or art medium.
EXCLUDE if merely related, implied, same habitat/category, or "close enough." When unsure, EXCLUDE.

Examples of EXCLUDE: "snow" ≠ rocky/brown terrain; "whale" ≠ seal or generic ocean; "watercolor" ≠ polished anime art.
Ignore energy symbols, attacks, and frame chrome.

JSON only: { "include": ["id1", ...] }
Use only provided ids. If none qualify: { "include": [] }`;

function normalizeQuery(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

function getString(
  metadata: Record<string, unknown>,
  ...keys: string[]
): string {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

function mapMatchToCard(
  id: string,
  metadata: Record<string, unknown>,
  score?: number
): PokemonCard {
  return {
    id,
    name: getString(metadata, "name", "card_name", "cardName") || "Unknown",
    setName:
      getString(metadata, "setName", "set_name", "set") || "Unknown Set",
    rarity: getString(metadata, "rarity") || "—",
    imageUrl:
      getString(metadata, "imageUrl", "image_url", "image") || undefined,
    artDescription:
      getString(
        metadata,
        "search_string",
        "artDescription",
        "art_description",
        "description",
        "ai_description"
      ) || "No description available.",
    keywords: Array.isArray(metadata.keywords)
      ? metadata.keywords.filter((k): k is string => typeof k === "string")
      : [],
    score,
  };
}

function buildMetadataFilter(
  rarities: string[],
  sets: string[]
): Record<string, unknown> | undefined {
  const conditions: Record<string, unknown>[] = [];

  if (rarities.length > 0) {
    conditions.push({ rarity: { $in: rarities } });
  }
  if (sets.length > 0) {
    conditions.push({ setName: { $in: sets } });
  }

  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return { $and: conditions };
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item === "string" && item.trim()) seen.add(item.trim());
  }
  return [...seen];
}

function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars - 1)}…`;
}

function sortByScoreDesc(cards: PokemonCard[]): PokemonCard[] {
  return [...cards].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

function stripScoresForClient(cards: PokemonCard[]): PokemonCard[] {
  if (isDebugMode()) return cards;
  return cards.map(({ score: _score, ...card }) => card);
}

function buildSearchResponse(
  cards: PokemonCard[],
  meta: Record<string, unknown>,
  headers?: HeadersInit
) {
  const payload: { cards: PokemonCard[]; meta?: Record<string, unknown> } = {
    cards: stripScoresForClient(cards),
  };
  if (isDebugMode()) {
    payload.meta = meta;
  }
  return NextResponse.json(payload, headers ? { headers } : undefined);
}

async function filterRelevantCardIds(
  openai: OpenAI,
  query: string,
  cards: PokemonCard[]
): Promise<string[] | null> {
  if (cards.length === 0) return [];

  const candidates = cards.map((card) => ({
    id: card.id,
    name: card.name,
    description: truncate(card.artDescription, MAX_DESCRIPTION_CHARS),
  }));

  try {
    const completion = await openai.chat.completions.create({
      model: RERANK_MODEL,
      response_format: { type: "json_object" },
      temperature: 0,
      messages: [
        { role: "system", content: FILTER_SYSTEM_PROMPT },
        {
          role: "user",
          content: JSON.stringify({ query, candidates }),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      console.warn("Relevance filter returned empty content; falling back.");
      return null;
    }

    const parsed = JSON.parse(raw) as { include?: unknown };
    if (!Array.isArray(parsed.include)) {
      console.warn("Relevance filter JSON missing include array; falling back.");
      return null;
    }

    const allowed = new Set(cards.map((card) => card.id));
    return parsed.include.filter(
      (id): id is string => typeof id === "string" && allowed.has(id)
    );
  } catch (error) {
    console.error("Relevance filter failed; falling back to Pinecone order:", error);
    return null;
  }
}

function publicErrorMessage(error: unknown): string {
  if (!isDebugMode()) {
    return "Failed to perform search.";
  }

  if (error instanceof Error && error.message) {
    return `Search failed: ${error.message}`;
  }

  return "Failed to perform search.";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query =
      typeof body.query === "string" ? normalizeQuery(body.query) : "";
    const rarities = parseStringArray(body.rarities);
    const sets = parseStringArray(body.sets);
    const requestedLlm = body.useLlmFilter === true;
    const hasFilters = rarities.length > 0 || sets.length > 0;
    // "Browse" mode: no text query, but filters are set — list matching cards.
    const isBrowse = !query && hasFilters;

    if (!query && !hasFilters) {
      return NextResponse.json(
        { error: "Query string is required." },
        { status: 400 }
      );
    }

    let session = null;
    try {
      session = await auth();
    } catch (error) {
      console.error("Auth session error:", error);
      // Continue as guest if auth misconfigured
    }

    const userId = session?.user?.id ?? session?.user?.email ?? null;
    const isSignedIn = Boolean(userId);
    const ip = getClientIp(request);

    // Guests cannot use AI filter — enforced server-side. Browse never uses it.
    const useLlmFilter = requestedLlm && isSignedIn && !isBrowse;

    const searchLimit = await enforceRateLimit(
      isSignedIn ? "signedIn" : "anon",
      isSignedIn ? String(userId) : ip
    );

    if (!searchLimit.success) {
      return NextResponse.json(
        {
          error: isSignedIn
            ? "Search rate limit reached. Try again later."
            : "Too many searches from this network. Sign in for higher limits, or try again later.",
        },
        { status: 429, headers: rateLimitHeaders(searchLimit) }
      );
    }

    if (requestedLlm && !isSignedIn) {
      return NextResponse.json(
        { error: "Sign in with Google to use AI filter." },
        { status: 401, headers: rateLimitHeaders(searchLimit) }
      );
    }

    if (useLlmFilter) {
      const aiLimit = await enforceRateLimit("ai", String(userId));
      if (!aiLimit.success) {
        return NextResponse.json(
          {
            error:
              "AI filter rate limit reached. Search without AI filter, or try again later.",
          },
          { status: 429, headers: rateLimitHeaders(aiLimit) }
        );
      }
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    if (!process.env.PINECONE_API_KEY) {
      return NextResponse.json(
        { error: "PINECONE_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    let vector: number[];
    if (isBrowse) {
      vector = NEUTRAL_VECTOR;
    } else {
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
      });
      vector = embeddingResponse.data[0].embedding;
    }

    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    const index = pinecone.index(INDEX_NAME);

    const filter = buildMetadataFilter(rarities, sets);

    const queryResponse = await index.query({
      vector,
      topK: isBrowse ? BROWSE_TOP_K : TOP_K,
      includeMetadata: true,
      ...(filter ? { filter } : {}),
    });

    const mappedMatches: PokemonCard[] = (queryResponse.matches ?? []).map(
      (match) =>
        mapMatchToCard(
          match.id,
          (match.metadata ?? {}) as Record<string, unknown>,
          match.score
        )
    );

    // Browse has no meaningful relevance scores — list matches alphabetically.
    if (isBrowse) {
      const browseCards = sortByNameAsc(mappedMatches);
      return buildSearchResponse(
        browseCards,
        {
          retrieved: browseCards.length,
          candidates: 0,
          kept: browseCards.length,
          filtered: false,
          minScore: 0,
          toppedUp: false,
          llmEnabled: false,
          browse: true,
        },
        rateLimitHeaders(searchLimit)
      );
    }

    const allMatches: PokemonCard[] = sortByScoreDesc(mappedMatches);

    const aboveThreshold = allMatches.filter(
      (card) => (card.score ?? 0) > MIN_PINECONE_SCORE
    );
    const candidates =
      aboveThreshold.length >= MIN_LLM_CANDIDATES
        ? aboveThreshold
        : allMatches.slice(0, Math.min(MIN_LLM_CANDIDATES, allMatches.length));

    if (!useLlmFilter) {
      return buildSearchResponse(
        aboveThreshold,
        {
          retrieved: allMatches.length,
          candidates: 0,
          kept: aboveThreshold.length,
          filtered: false,
          minScore: MIN_PINECONE_SCORE,
          toppedUp: false,
          llmEnabled: false,
        },
        rateLimitHeaders(searchLimit)
      );
    }

    const includedIds = await filterRelevantCardIds(openai, query, candidates);

    let cards: PokemonCard[];
    if (includedIds === null) {
      cards = candidates.slice(0, 12);
    } else {
      const includeSet = new Set(includedIds);
      cards = sortByScoreDesc(
        candidates.filter((card) => includeSet.has(card.id))
      );
    }

    return buildSearchResponse(
      cards,
      {
        retrieved: allMatches.length,
        candidates: candidates.length,
        kept: cards.length,
        filtered: includedIds !== null,
        minScore: MIN_PINECONE_SCORE,
        toppedUp: aboveThreshold.length < MIN_LLM_CANDIDATES,
        llmEnabled: true,
      },
      rateLimitHeaders(searchLimit)
    );
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: publicErrorMessage(error) },
      { status: 500 }
    );
  }
}
