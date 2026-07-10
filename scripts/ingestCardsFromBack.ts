import { config } from "dotenv";
import { existsSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { resolve } from "path";
import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";

config({ path: resolve(process.cwd(), ".env.local") });

// ─── Configuration ───────────────────────────────────────────────────────────

const PAGE_SIZE = 50;
const CARD_DELAY_MS = 500;
const PAGE_DELAY_MS = 2000;
const INDEX_NAME = "pokemon-card-art";

/** Stop after this many consecutive pages with zero new cards (met the other worker). */
const CONSECUTIVE_COVERED_PAGES_TO_STOP = 5;

const POKEMON_TCG_BASE_URL = "https://api.pokemontcg.io/v2/cards";

const VISION_SYSTEM_PROMPT =
  "Analyze the artwork of this Pokémon card. Return a JSON object with a single key 'search_string' containing a detailed descriptive paragraph of the visual elements, character poses, background environment, colors, and overall artistic medium/style.";

const RETRY_MAX_ATTEMPTS = 10;
const RETRY_BASE_DELAY_MS = 1000;
const FAILED_CARDS_PATH = resolve(process.cwd(), "failed_cards_from_back.json");

// ─── Types ───────────────────────────────────────────────────────────────────

interface PokemonTcgImages {
  small?: string;
  large?: string;
}

interface PokemonTcgSet {
  name: string;
}

interface PokemonTcgCard {
  id: string;
  name: string;
  rarity?: string;
  images?: PokemonTcgImages;
  set: PokemonTcgSet;
}

interface PokemonTcgResponse {
  data: PokemonTcgCard[];
  page: number;
  pageSize: number;
  count: number;
  totalCount: number;
}

interface VisionResponse {
  search_string?: string;
}

interface FailedCardRecord {
  failedAt: string;
  error: string;
  card: PokemonTcgCard;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function isRateLimitError(error: unknown): boolean {
  const message = getErrorMessage(error);
  if (message.includes("429") || message.includes("Rate limit reached")) {
    return true;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    error.status === 429
  ) {
    return true;
  }
  return false;
}

function extractRetryDelayMs(
  error: unknown,
  attempt: number,
  baseDelayMs: number
): number {
  const message = getErrorMessage(error);

  const msMatch = message.match(/try again in ([\d.]+)\s*ms/i);
  if (msMatch) {
    return Math.ceil(parseFloat(msMatch[1]));
  }

  const secondsMatch = message.match(
    /try again in ([\d.]+)\s*s(?:ec(?:ond)?s?)?/i
  );
  if (secondsMatch) {
    return Math.ceil(parseFloat(secondsMatch[1]) * 1000);
  }

  return baseDelayMs * Math.pow(2, attempt - 1);
}

async function executeWithRetry<T>(
  fn: () => Promise<T>,
  cardName: string,
  maxAttempts: number = RETRY_MAX_ATTEMPTS,
  baseDelayMs: number = RETRY_BASE_DELAY_MS
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const isLastAttempt = attempt === maxAttempts;
      if (!isRateLimitError(error) || isLastAttempt) {
        throw error;
      }

      const delayMs = extractRetryDelayMs(error, attempt, baseDelayMs);
      console.warn(
        `⚠ Rate limit hit for ${cardName}. Retrying in ${delayMs}ms... (attempt ${attempt}/${maxAttempts - 1})`
      );
      await sleep(delayMs);
    }
  }

  throw lastError;
}

async function appendFailedCard(
  card: PokemonTcgCard,
  error: unknown
): Promise<void> {
  const record: FailedCardRecord = {
    failedAt: new Date().toISOString(),
    error: getErrorMessage(error),
    card,
  };

  let existing: FailedCardRecord[] = [];
  if (existsSync(FAILED_CARDS_PATH)) {
    try {
      const raw = await readFile(FAILED_CARDS_PATH, "utf-8");
      const parsed = JSON.parse(raw) as unknown;
      existing = Array.isArray(parsed) ? (parsed as FailedCardRecord[]) : [];
    } catch {
      existing = [];
    }
  }

  existing.push(record);
  await writeFile(FAILED_CARDS_PATH, JSON.stringify(existing, null, 2) + "\n");
}

// ─── Clients ─────────────────────────────────────────────────────────────────

const openai = new OpenAI({ apiKey: requireEnv("OPENAI_API_KEY") });
const pinecone = new Pinecone({ apiKey: requireEnv("PINECONE_API_KEY") });
const index = pinecone.index(INDEX_NAME);

const pokemonTcgHeaders: HeadersInit = {
  "X-Api-Key": requireEnv("POKEMONTCG_API_KEY"),
};

// ─── API Functions ───────────────────────────────────────────────────────────

async function fetchCardsPage(page: number): Promise<PokemonTcgResponse> {
  const url = `${POKEMON_TCG_BASE_URL}?pageSize=${PAGE_SIZE}&page=${page}`;
  const response = await fetch(url, { headers: pokemonTcgHeaders });

  if (!response.ok) {
    throw new Error(
      `Pokémon TCG API error on page ${page}: ${response.status} ${response.statusText}`
    );
  }

  return response.json() as Promise<PokemonTcgResponse>;
}

async function getExistingCardIds(cardIds: string[]): Promise<Set<string>> {
  if (cardIds.length === 0) return new Set();
  const fetchResponse = await index.fetch({ ids: cardIds });
  return new Set(Object.keys(fetchResponse.records));
}

async function generateSearchString(imageUrl: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: VISION_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: imageUrl, detail: "low" },
          },
        ],
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("OpenAI returned an empty vision response.");
  }

  const parsed = JSON.parse(raw) as VisionResponse;
  const searchString = parsed.search_string?.trim();

  if (!searchString) {
    throw new Error("Vision response missing 'search_string' field.");
  }

  return searchString;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  const vector = response.data[0]?.embedding;
  if (!vector) {
    throw new Error("OpenAI returned an empty embedding.");
  }

  return vector;
}

async function upsertToPinecone(
  cardId: string,
  vector: number[],
  metadata: Record<string, string>
): Promise<void> {
  await index.upsert({
    records: [
      {
        id: cardId,
        values: vector,
        metadata,
      },
    ],
  });
}

// ─── Per-Card Pipeline ───────────────────────────────────────────────────────

async function processCard(
  card: PokemonTcgCard,
  page: number,
  cardIndex: number,
  totalInPage: number
): Promise<"success" | "skipped" | "failed"> {
  const label = `[BACK] Page ${page}: Card ${cardIndex}/${totalInPage} - ${card.name}`;

  const imageUrl = card.images?.large;
  if (!imageUrl) {
    console.log(`${label}... Skipped (no images.large)`);
    return "skipped";
  }

  try {
    const searchString = await executeWithRetry(
      () => generateSearchString(imageUrl),
      card.name
    );
    const vector = await generateEmbedding(searchString);

    await upsertToPinecone(card.id, vector, {
      name: card.name,
      imageUrl,
      setName: card.set.name,
      rarity: card.rarity || "Unknown",
      search_string: searchString,
    });

    console.log(`${label}... Success`);
    return "success";
  } catch (error) {
    const message = getErrorMessage(error);
    console.error(`${label}... Failed — ${message}`);
    await appendFailedCard(card, error);
    console.error(`  → Appended to failed_cards_from_back.json`);
    return "failed";
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("═".repeat(60));
  console.log("Pokémon Card Art Ingest (from back → front)");
  console.log(
    `Index: ${INDEX_NAME} | Skips existing | Stops after ${CONSECUTIVE_COVERED_PAGES_TO_STOP} fully-covered pages`
  );
  console.log("═".repeat(60));

  console.log("\nResolving last page from API...");
  const firstPage = await fetchCardsPage(1);
  const totalCount = firstPage.totalCount;
  const lastPage = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  console.log(
    `Catalog: ${totalCount} cards → pages 1–${lastPage} (walking ${lastPage} → 1)`
  );

  let totalSuccess = 0;
  let totalSkippedNoImage = 0;
  let totalSkippedExisting = 0;
  let totalFailed = 0;
  let consecutiveCoveredPages = 0;

  for (let page = lastPage; page >= 1; page--) {
    console.log(`\n[BACK] Fetching page ${page}/${lastPage}...`);

    let batch: PokemonTcgCard[];
    try {
      const response = await fetchCardsPage(page);
      batch = response.data;

      console.log(
        `[BACK] Page ${page}: received ${batch.length} cards (${response.totalCount} total in API)`
      );

      if (batch.length === 0) {
        console.log("[BACK] Empty page — continuing toward front...");
        continue;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[BACK] Failed to fetch page ${page}: ${message}`);
      await sleep(PAGE_DELAY_MS);
      continue;
    }

    const existingIds = await getExistingCardIds(batch.map((c) => c.id));

    let pageSuccess = 0;

    for (let i = 0; i < batch.length; i++) {
      const card = batch[i];
      const label = `[BACK] Page ${page}: Card ${i + 1}/${batch.length} - ${card.name}`;

      if (existingIds.has(card.id)) {
        console.log(`${label}... Skipped (already in Pinecone)`);
        totalSkippedExisting++;
        continue;
      }

      if (!card.images?.large) {
        console.log(`${label}... Skipped (no images.large)`);
        totalSkippedNoImage++;
        continue;
      }

      const result = await processCard(card, page, i + 1, batch.length);

      if (result === "success") {
        totalSuccess++;
        pageSuccess++;
      } else if (result === "skipped") {
        totalSkippedNoImage++;
      } else {
        totalFailed++;
      }

      await sleep(CARD_DELAY_MS);
    }

    if (pageSuccess === 0) {
      consecutiveCoveredPages++;
      console.log(
        `[BACK] Page ${page}: no new cards (${consecutiveCoveredPages}/${CONSECUTIVE_COVERED_PAGES_TO_STOP} consecutive covered pages)`
      );

      if (consecutiveCoveredPages >= CONSECUTIVE_COVERED_PAGES_TO_STOP) {
        console.log(
          `\n[BACK] Hit ${CONSECUTIVE_COVERED_PAGES_TO_STOP} consecutive fully-covered pages — likely met the forward ingest. Exiting cleanly.`
        );
        break;
      }
    } else {
      consecutiveCoveredPages = 0;
      console.log(`[BACK] Page ${page}: ingested ${pageSuccess} new cards`);
    }

    if (page > 1) {
      console.log(`\n[BACK] Waiting ${PAGE_DELAY_MS}ms before previous page...`);
      await sleep(PAGE_DELAY_MS);
    }
  }

  console.log("\n" + "═".repeat(60));
  console.log("Back-to-front ingest complete");
  console.log(`  Success:           ${totalSuccess}`);
  console.log(`  Skipped (exists):  ${totalSkippedExisting}`);
  console.log(`  Skipped (no img):  ${totalSkippedNoImage}`);
  console.log(`  Failed:            ${totalFailed}`);
  console.log("═".repeat(60));
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
