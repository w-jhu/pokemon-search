"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { PokemonCard } from "@/types/pokemon";

interface CardZoomProps {
  card: PokemonCard | null;
  onClose: () => void;
}

export default function CardZoom({ card, onClose }: CardZoomProps) {
  useEffect(() => {
    if (!card) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [card, onClose]);

  if (!card) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8">
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        onClick={onClose}
        aria-label="Close zoomed card"
      />

      <div
        role="dialog"
        aria-label={`${card.name} enlarged card art`}
        className="relative z-10 flex max-h-full w-full max-w-lg flex-col items-center animate-in fade-in duration-300"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-2 right-0 z-20 rounded-lg border border-white/10 bg-black/40 p-2 text-white/60 backdrop-blur-md transition-all duration-200 hover:bg-white/10 hover:text-white sm:-right-2"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="w-full overflow-hidden rounded-2xl border border-white/15 bg-white/5 shadow-2xl shadow-black/50 backdrop-blur-xl">
          {card.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.imageUrl}
              alt={`${card.name} card art`}
              className="mx-auto max-h-[min(80vh,900px)] w-full object-contain"
            />
          ) : (
            <div className="flex aspect-[2.5/3.5] w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-white/5 to-white/[0.02] p-8">
              <div className="h-16 w-16 rounded-full border border-white/10 bg-white/5" />
              <span className="font-mono text-xs uppercase tracking-widest text-white/25">
                No art available
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 text-center">
          <h3 className="text-lg font-semibold tracking-tight text-white">
            {card.name}
          </h3>
          <p className="mt-1 text-sm text-white/45">
            {card.setName} · {card.rarity}
          </p>
        </div>
      </div>
    </div>
  );
}
