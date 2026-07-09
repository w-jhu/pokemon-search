import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { PokemonCard } from "@/types/pokemon";

const INDEX_NAME = "pokemon-card-art";
const TOP_K = 12;

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
  metadata: Record<string, unknown>
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
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query = typeof body.query === "string" ? body.query.trim() : "";

    if (!query) {
      return NextResponse.json(
        { error: "Query string is required." },
        { status: 400 }
      );
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

    const queryResponse = await index.query({
      vector,
      topK: TOP_K,
      includeMetadata: true,
    });

    const cards: PokemonCard[] = (queryResponse.matches ?? []).map((match) =>
      mapMatchToCard(match.id, (match.metadata ?? {}) as Record<string, unknown>)
    );

    return NextResponse.json({ cards });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Failed to perform search." },
      { status: 500 }
    );
  }
}
