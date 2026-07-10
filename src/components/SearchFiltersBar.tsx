"use client";

import { X, Sparkles, LogIn } from "lucide-react";
import { signIn } from "next-auth/react";
import {
  RARITY_OPTIONS,
  SET_OPTIONS,
  SearchFilters,
  EMPTY_FILTERS,
} from "@/data/filterOptions";

interface SearchFiltersBarProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  useLlmFilter: boolean;
  onLlmFilterChange: (enabled: boolean) => void;
  isSignedIn: boolean;
  disabled?: boolean;
}

export default function SearchFiltersBar({
  filters,
  onChange,
  useLlmFilter,
  onLlmFilterChange,
  isSignedIn,
  disabled = false,
}: SearchFiltersBarProps) {
  const hasActiveFilters = Boolean(filters.rarity || filters.setName);
  const aiLocked = !isSignedIn;

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

      <div className="flex w-full flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={useLlmFilter && !aiLocked}
            disabled={disabled || aiLocked}
            onClick={() => {
              if (aiLocked) return;
              onLlmFilterChange(!useLlmFilter);
            }}
            title={
              aiLocked
                ? "Sign in with Google to use AI filter"
                : "Toggle AI relevance filter"
            }
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-all duration-200 disabled:cursor-not-allowed ${
              aiLocked
                ? "border-white/10 bg-white/5 text-white/35 opacity-70"
                : useLlmFilter
                  ? "border-white/20 bg-white/10 text-white/80"
                  : "border-white/10 bg-white/5 text-white/40 hover:border-white/20 hover:text-white/60"
            }`}
          >
            <Sparkles className="h-3 w-3" />
            AI filter {aiLocked ? "locked" : useLlmFilter ? "on" : "off"}
            <span
              className={`relative h-4 w-7 rounded-full transition-colors duration-200 ${
                !aiLocked && useLlmFilter ? "bg-white/30" : "bg-white/10"
              }`}
            >
              <span
                className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform duration-200 ${
                  !aiLocked && useLlmFilter ? "left-3.5" : "left-0.5"
                }`}
              />
            </span>
          </button>

          {aiLocked && (
            <button
              type="button"
              onClick={() => signIn("google")}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white/70 transition-all duration-200 hover:border-white/25 hover:bg-white/15 hover:text-white"
            >
              <LogIn className="h-3 w-3" />
              Sign in for AI filter
            </button>
          )}
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
    </div>
  );
}
