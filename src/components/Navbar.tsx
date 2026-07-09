"use client";

import { LayoutGrid, List, Info } from "lucide-react";
import { LayoutDensity } from "@/types/pokemon";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

interface NavbarProps {
  layout: LayoutDensity;
  onLayoutChange: (layout: LayoutDensity) => void;
  onAboutOpen: () => void;
}

export default function Navbar({
  layout,
  onLayoutChange,
  onAboutOpen,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-white/10 backdrop-blur-md dark:bg-black/20">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <a
          href="#"
          className="font-mono text-lg font-semibold tracking-tight text-white transition-opacity duration-200 hover:opacity-80"
        >
          PokeArt<span className="text-white/40">.ai</span>
        </a>

        <nav className="flex items-center gap-2">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-transparent p-2 text-white/50 transition-all duration-200 hover:border-white/10 hover:bg-white/5 hover:text-white"
            aria-label="GitHub"
          >
            <GitHubIcon className="h-4 w-4" />
          </a>

          <div className="flex rounded-lg border border-white/10 bg-white/5 p-0.5">
            <button
              type="button"
              onClick={() => onLayoutChange("grid")}
              className={`rounded-md p-1.5 transition-all duration-200 ${
                layout === "grid"
                  ? "bg-white/15 text-white"
                  : "text-white/40 hover:text-white/70"
              }`}
              aria-label="Grid layout"
              aria-pressed={layout === "grid"}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onLayoutChange("list")}
              className={`rounded-md p-1.5 transition-all duration-200 ${
                layout === "list"
                  ? "bg-white/15 text-white"
                  : "text-white/40 hover:text-white/70"
              }`}
              aria-label="List layout"
              aria-pressed={layout === "list"}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onAboutOpen}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/60 transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <span className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" />
              About
            </span>
          </button>
        </nav>
      </div>
    </header>
  );
}
