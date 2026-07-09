"use client";

import { useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  isLoading?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export default function SearchBar({
  value,
  onChange,
  onSearch,
  isLoading = false,
  inputRef,
}: SearchBarProps) {
  const internalRef = useRef<HTMLInputElement>(null);
  const ref = inputRef ?? internalRef;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [ref]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(value);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="group relative">
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 via-white/5 to-white/20 opacity-0 blur-xl transition-opacity duration-500 group-focus-within:opacity-100" />
        <div className="relative flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 shadow-lg shadow-black/20 backdrop-blur-xl transition-all duration-300 group-focus-within:border-white/25 group-focus-within:bg-white/10 group-focus-within:shadow-white/5">
          <Search className="h-5 w-5 shrink-0 text-white/40 transition-colors duration-300 group-focus-within:text-white/70" />
          <input
            ref={ref}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Describe the art you're looking for..."
            disabled={isLoading}
            className="flex-1 bg-transparent text-base text-white placeholder:text-white/35 outline-none disabled:opacity-50 md:text-lg"
            aria-label="Search Pokémon card art"
          />
          {isLoading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white/50" />
          ) : (
            <kbd className="hidden shrink-0 items-center gap-0.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1 font-mono text-xs text-white/40 sm:inline-flex">
              <span className="text-[10px]">⌘</span>K
            </kbd>
          )}
        </div>
      </div>
    </form>
  );
}
