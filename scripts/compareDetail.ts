import { config } from "dotenv";
import { resolve } from "path";
import OpenAI from "openai";

config({ path: resolve(process.cwd(), ".env.local") });

const VISION_SYSTEM_PROMPT =
  "Analyze the artwork of this Pokémon card. Return a JSON object with a single key 'search_string' containing a detailed descriptive paragraph of the visual elements, character poses, background environment, colors, and overall artistic medium/style.";

type DetailLevel = "low" | "high";

interface VisionResponse {
  search_string?: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function captionImage(
  openai: OpenAI,
  imageUrl: string,
  detail: DetailLevel
): Promise<{ searchString: string; promptTokens?: number; completionTokens?: number }> {
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
            image_url: { url: imageUrl, detail },
          },
        ],
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error(`Empty response for detail=${detail}`);
  }

  const parsed = JSON.parse(raw) as VisionResponse;
  const searchString = parsed.search_string?.trim();
  if (!searchString) {
    throw new Error(`Missing search_string for detail=${detail}`);
  }

  return {
    searchString,
    promptTokens: completion.usage?.prompt_tokens,
    completionTokens: completion.usage?.completion_tokens,
  };
}

async function main(): Promise<void> {
  const imageUrl = process.argv[2];

  if (!imageUrl) {
    console.error(`
Usage:
  npx tsx scripts/compareDetail.ts <image-url>

Example (Pokémon TCG large art URL):
  npx tsx scripts/compareDetail.ts https://images.pokemontcg.io/sv3/123_hires.png
`);
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey: requireEnv("OPENAI_API_KEY") });

  console.log("═".repeat(60));
  console.log("Comparing Vision detail: low vs high");
  console.log(`Image: ${imageUrl}`);
  console.log("═".repeat(60));

  console.log("\nRunning detail=low...");
  const low = await captionImage(openai, imageUrl, "low");

  console.log("Running detail=high...");
  const high = await captionImage(openai, imageUrl, "high");

  console.log("\n" + "─".repeat(60));
  console.log("LOW DETAIL");
  console.log(
    `Tokens — prompt: ${low.promptTokens ?? "?"} | completion: ${low.completionTokens ?? "?"}`
  );
  console.log("─".repeat(60));
  console.log(low.searchString);

  console.log("\n" + "─".repeat(60));
  console.log("HIGH DETAIL");
  console.log(
    `Tokens — prompt: ${high.promptTokens ?? "?"} | completion: ${high.completionTokens ?? "?"}`
  );
  console.log("─".repeat(60));
  console.log(high.searchString);

  console.log("\n" + "═".repeat(60));
  if (low.promptTokens && high.promptTokens) {
    const ratio = (high.promptTokens / low.promptTokens).toFixed(1);
    console.log(
      `Prompt token ratio (high/low): ${ratio}x  (${high.promptTokens} / ${low.promptTokens})`
    );
  }
  console.log("═".repeat(60));
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
