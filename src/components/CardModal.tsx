"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { PokemonCard } from "@/types/pokemon";

interface CardModalProps {
  card: PokemonCard | null;
  onClose: () => void;
}

export default function CardModal({ card, onClose }: CardModalProps) {
  useEffect(() => {
    if (!card) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [card, onClose]);

  if (!card) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close card info"
      />
      <div
        role="dialog"
        aria-labelledby="card-modal-title"
        className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom-4 rounded-2xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl duration-300 sm:slide-in-from-bottom-0"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3
              id="card-modal-title"
              className="text-lg font-semibold tracking-tight text-white"
            >
              {card.name}
            </h3>
            <p className="mt-0.5 text-sm text-white/50">
              {card.setName} · {card.rarity}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/50 transition-all duration-200 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-white/40">
            AI Embedding
          </span>
        </div>

        <p className="text-sm leading-relaxed text-white/70">
          {card.artDescription}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {card.keywords.map((keyword) => (
            <span
              key={keyword}
              className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-white/50"
            >
              {keyword}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
