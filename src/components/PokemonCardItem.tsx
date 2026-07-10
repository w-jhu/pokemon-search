"use client";

import { Info, ZoomIn } from "lucide-react";
import { PokemonCard, LayoutDensity } from "@/types/pokemon";
import { isDebugMode } from "@/lib/appMode";

interface PokemonCardItemProps {
  card: PokemonCard;
  layout: LayoutDensity;
  onInfoClick: (card: PokemonCard) => void;
  onZoomClick: (card: PokemonCard) => void;
}

export default function PokemonCardItem({
  card,
  layout,
  onInfoClick,
  onZoomClick,
}: PokemonCardItemProps) {
  const isList = layout === "list";
  const showScore = isDebugMode() && typeof card.score === "number";

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg shadow-black/20 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-white/20 hover:bg-white/10 hover:shadow-xl hover:shadow-black/30 ${
        isList ? "flex gap-4 p-3" : "flex flex-col"
      }`}
    >
      <button
        type="button"
        onClick={() => onZoomClick(card)}
        className={`relative cursor-zoom-in overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
          isList
            ? "h-28 w-20 shrink-0 rounded-xl"
            : "aspect-[2.5/3.5] w-full rounded-t-2xl"
        }`}
        aria-label={`Zoom ${card.name}`}
      >
        {card.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.imageUrl}
            alt={`${card.name} card art`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4">
            <div className="h-12 w-12 rounded-full border border-white/10 bg-white/5" />
            <span className="text-center font-mono text-[10px] uppercase tracking-widest text-white/25">
              Art Preview
            </span>
          </div>
        )}

        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/25 group-hover:opacity-100">
          <span className="rounded-full border border-white/20 bg-black/40 p-2 text-white/80 backdrop-blur-md">
            <ZoomIn className="h-4 w-4" />
          </span>
        </span>
      </button>

      <div className={`flex flex-1 flex-col ${isList ? "justify-center py-1" : "p-4"}`}>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold tracking-tight text-white">{card.name}</h3>
          {showScore && (
            <span
              className="shrink-0 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-white/50"
              title="Pinecone similarity score"
            >
              {card.score!.toFixed(3)}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-white/45">{card.setName}</p>
        <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-white/30">
          {card.rarity}
        </p>

        <button
          type="button"
          onClick={() => onInfoClick(card)}
          className={`mt-3 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white/50 transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-white/80 ${
            isList ? "w-fit" : ""
          }`}
        >
          <Info className="h-3 w-3" />
          Info
        </button>
      </div>
    </article>
  );
}
