"use client";

import { useEffect } from "react";
import { X, Sparkles } from "lucide-react";

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AboutModal({ open, onClose }: AboutModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close about"
      />
      <div
        role="dialog"
        aria-labelledby="about-modal-title"
        className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-white/10 p-8 shadow-2xl shadow-black/40 backdrop-blur-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/50 transition-all duration-200 hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <Sparkles className="h-5 w-5 text-white/70" />
          </div>
          <h2
            id="about-modal-title"
            className="font-mono text-xl font-semibold tracking-tight text-white"
          >
            About PokeArt.ai
          </h2>
        </div>

        <div className="space-y-4 text-sm leading-relaxed text-white/60">
          <p>
            PokeArt.ai helps you find Pokémon cards by how they look. Describe
            a scene, color, mood, or art style — like &ldquo;snowy beach&rdquo;
            or &ldquo;watercolor&rdquo; — and we&apos;ll surface cards whose
            artwork matches.
          </p>
          <p>
            Under the hood, each card&apos;s illustration is described by AI and
            stored as a vector embedding. Your search is compared against those
            descriptions so results are ranked by meaning, not just card name.
            Use Info on any result to read the art description that powered the
            match.
          </p>
          <p>
            Optional filters narrow by rarity or set. Sign in with Google to
            unlock AI filter, which reviews the top matches and drops cards that
            are only loosely related.
          </p>
        </div>
      </div>
    </div>
  );
}
