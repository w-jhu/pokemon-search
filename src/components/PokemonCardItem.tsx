"use client";

import { Info } from "lucide-react";
import { PokemonCard, LayoutDensity } from "@/types/pokemon";

interface PokemonCardItemProps {
  card: PokemonCard;
  layout: LayoutDensity;
  onInfoClick: (card: PokemonCard) => void;
}

export default function PokemonCardItem({
  card,
  layout,
  onInfoClick,
}: PokemonCardItemProps) {
  const isList = layout === "list";

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg shadow-black/20 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-white/20 hover:bg-white/10 hover:shadow-xl hover:shadow-black/30 ${
        isList ? "flex gap-4 p-3" : "flex flex-col"
      }`}
    >
      <div
        className={`relative overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] ${
          isList
            ? "h-28 w-20 shrink-0 rounded-xl"
            : "aspect-[2.5/3.5] w-full rounded-t-2xl"
        }`}
      >
        {card.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.imageUrl}
            alt={`${card.name} card art`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4">
            <div className="h-12 w-12 rounded-full border border-white/10 bg-white/5" />
            <span className="text-center font-mono text-[10px] uppercase tracking-widest text-white/25">
              Art Preview
            </span>
          </div>
        )}
      </div>

      <div className={`flex flex-1 flex-col ${isList ? "justify-center py-1" : "p-4"}`}>
        <h3 className="font-semibold tracking-tight text-white">{card.name}</h3>
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
