import { config } from "dotenv";
import { writeFile } from "fs/promises";
import { resolve } from "path";
import { Pinecone } from "@pinecone-database/pinecone";

config({ path: resolve(process.cwd(), ".env.local") });

const INDEX_NAME = "pokemon-card-art";
const FETCH_BATCH_SIZE = 100;
const OUTPUT_PATH = resolve(process.cwd(), "db_filters.json");

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getString(
  metadata: Record<string, unknown> | undefined,
  ...keys: string[]
): string {
  if (!metadata) return "";
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

function sortByCountDesc(counts: Map<string, number>): [string, number][] {
  return [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0]);
  });
}

function printTable(title: string, entries: [string, number][]): void {
  console.log(`\n${title} (${entries.length} distinct)`);
  console.log("─".repeat(48));
  const width = entries.reduce((max, [name]) => Math.max(max, name.length), 0);
  for (const [name, count] of entries) {
    console.log(`  ${name.padEnd(width)}  ${count}`);
  }
}

async function collectAllIds(index: ReturnType<Pinecone["index"]>): Promise<string[]> {
  const ids: string[] = [];
  let paginationToken: string | undefined;

  do {
    const page = await index.listPaginated(
      paginationToken ? { paginationToken } : {}
    );
    for (const vector of page.vectors ?? []) {
      if (vector.id) ids.push(vector.id);
    }
    paginationToken = page.pagination?.next;
    process.stdout.write(`\rListing vectors... ${ids.length} found`);
  } while (paginationToken);

  process.stdout.write("\n");
  return ids;
}

async function main(): Promise<void> {
  const pinecone = new Pinecone({ apiKey: requireEnv("PINECONE_API_KEY") });
  const index = pinecone.index(INDEX_NAME);

  console.log("═".repeat(48));
  console.log(`Collecting rarities & sets from "${INDEX_NAME}"`);
  console.log("═".repeat(48));

  const ids = await collectAllIds(index);
  if (ids.length === 0) {
    console.log("No vectors found in the index.");
    return;
  }

  const rarityCounts = new Map<string, number>();
  const setCounts = new Map<string, number>();
  let processed = 0;

  for (const batch of chunk(ids, FETCH_BATCH_SIZE)) {
    const response = await index.fetch({ ids: batch });
    for (const record of Object.values(response.records)) {
      const metadata = record.metadata as Record<string, unknown> | undefined;
      const rarity =
        getString(metadata, "rarity") || "Unknown";
      const setName =
        getString(metadata, "setName", "set_name", "set") || "Unknown Set";
      rarityCounts.set(rarity, (rarityCounts.get(rarity) ?? 0) + 1);
      setCounts.set(setName, (setCounts.get(setName) ?? 0) + 1);
    }
    processed += batch.length;
    process.stdout.write(`\rFetching metadata... ${processed}/${ids.length}`);
  }
  process.stdout.write("\n");

  const rarities = sortByCountDesc(rarityCounts);
  const sets = sortByCountDesc(setCounts);

  printTable("Rarities", rarities);
  printTable("Sets", sets);

  await writeFile(
    OUTPUT_PATH,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        totalCards: ids.length,
        rarities: Object.fromEntries(rarities),
        sets: Object.fromEntries(sets),
      },
      null,
      2
    ) + "\n"
  );

  console.log(`\nTotal cards: ${ids.length}`);
  console.log(`Wrote breakdown to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
