"use client";

import { X } from "lucide-react";
import {
  RARITY_OPTIONS,
  SET_OPTIONS,
  SearchFilters,
  EMPTY_FILTERS,
} from "@/data/filterOptions";

interface SearchFiltersBarProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  disabled?: boolean;
}

export default function SearchFiltersBar({
  filters,
  onChange,
  disabled = false,
}: SearchFiltersBarProps) {
  const hasActiveFilters = Boolean(filters.rarity || filters.setName);

  return (
    <div className="mt-4 flex w-full max-w-2xl flex-col items-center gap-3">
      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <label className="flex flex-1 flex-col gap-1.5 text-left">
          <span className="px-1 font-mono text-[10px] uppercase tracking-widest text-white/35">
            Rarity
          </span>
          <select
            value={filters.rarity}
            disabled={disabled}
            onChange={(e) =>
              onChange({ ...filters, rarity: e.target.value })
            }
            className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/80 backdrop-blur-md outline-none transition-all duration-200 hover:border-white/20 focus:border-white/25 focus:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <option value="" className="bg-zinc-900 text-white">
              Any rarity
            </option>
            {RARITY_OPTIONS.map((rarity) => (
              <option
                key={rarity}
                value={rarity}
                className="bg-zinc-900 text-white"
              >
                {rarity}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-1 flex-col gap-1.5 text-left">
          <span className="px-1 font-mono text-[10px] uppercase tracking-widest text-white/35">
            Set
          </span>
          <select
            value={filters.setName}
            disabled={disabled}
            onChange={(e) =>
              onChange({ ...filters, setName: e.target.value })
            }
            className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/80 backdrop-blur-md outline-none transition-all duration-200 hover:border-white/20 focus:border-white/25 focus:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <option value="" className="bg-zinc-900 text-white">
              Any set
            </option>
            {SET_OPTIONS.map((setName) => (
              <option
                key={setName}
                value={setName}
                className="bg-zinc-900 text-white"
              >
                {setName}
              </option>
            ))}
          </select>
        </label>
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(EMPTY_FILTERS)}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/45 transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-white/70 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <X className="h-3 w-3" />
          Clear filters
        </button>
      )}
    </div>
  );
}
