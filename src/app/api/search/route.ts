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
const MIN_PINECONE_SCORE = 0.2;
const MIN_LLM_CANDIDATES = 12;
const RERANK_MODEL = "gpt-4o-mini";
const MAX_DESCRIPTION_CHARS = 400;

const FILTER_SYSTEM_PROMPT = `Strict filter for Pokémon card art search. Return which candidate ids to INCLUDE.

INCLUDE only if the query term (or a clear synonym) appears explicitly in the card name or art description as a depicted subject, setting, weather, color, mood, or art medium.
EXCLUDE if merely related, implied, same habitat/category, or "close enough." When unsure, EXCLUDE.

Examples of EXCLUDE: "snow" ≠ rocky/brown terrain; "whale" ≠ seal or generic ocean; "watercolor" ≠ polished anime art.
Ignore energy symbols, attacks, and frame chrome.

JSON only: { "include": ["id1", ...] }
Use only provided ids. If none qualify: { "include": [] }`;

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
  rarity?: string,
  setName?: string
): Record<string, unknown> | undefined {
  const conditions: Record<string, unknown>[] = [];

  if (rarity) {
    conditions.push({ rarity: { $eq: rarity } });
  }
  if (setName) {
    conditions.push({ setName: { $eq: setName } });
  }

  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return { $and: conditions };
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
    const query = typeof body.query === "string" ? body.query.trim() : "";
    const rarity =
      typeof body.rarity === "string" ? body.rarity.trim() : "";
    const setName =
      typeof body.setName === "string" ? body.setName.trim() : "";
    const requestedLlm = body.useLlmFilter === true;

    if (!query) {
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

    // Guests cannot use AI filter — enforced server-side
    const useLlmFilter = requestedLlm && isSignedIn;

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

    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });

    const vector = embeddingResponse.data[0].embedding;

    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    const index = pinecone.index(INDEX_NAME);

    const filter = buildMetadataFilter(rarity || undefined, setName || undefined);

    const queryResponse = await index.query({
      vector,
      topK: TOP_K,
      includeMetadata: true,
      ...(filter ? { filter } : {}),
    });

    const allMatches: PokemonCard[] = sortByScoreDesc(
      (queryResponse.matches ?? []).map((match) =>
        mapMatchToCard(
          match.id,
          (match.metadata ?? {}) as Record<string, unknown>,
          match.score
        )
      )
    );

    const aboveThreshold = allMatches.filter(
      (card) => (card.score ?? 0) > MIN_PINECONE_SCORE
    );
    const candidates =
      aboveThreshold.length >= MIN_LLM_CANDIDATES
        ? aboveThreshold
        : allMatches.slice(0, Math.min(MIN_LLM_CANDIDATES, allMatches.length));

    if (!useLlmFilter) {
      return buildSearchResponse(
        allMatches,
        {
          retrieved: allMatches.length,
          candidates: 0,
          kept: allMatches.length,
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
