"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Check, Minus, Search, X } from "lucide-react";
import { FilterGroup } from "@/data/filterOptions";

interface FilterPopoverProps {
  label: string;
  groups: FilterGroup[];
  selected: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
}

type SelectState = "none" | "some" | "all";

function optionState(values: string[], selected: Set<string>): SelectState {
  const inCount = values.filter((v) => selected.has(v)).length;
  if (inCount === 0) return "none";
  if (inCount === values.length) return "all";
  return "some";
}

function groupValues(group: FilterGroup): string[] {
  return group.options.flatMap((o) => o.values);
}

export default function FilterPopover({
  label,
  groups,
  selected,
  onChange,
  disabled = false,
}: FilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const selectedCount = useMemo(() => {
    let count = 0;
    for (const group of groups) {
      for (const option of group.options) {
        if (optionState(option.values, selectedSet) === "all") count++;
      }
    }
    return count;
  }, [groups, selectedSet]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const trimmedQuery = query.trim().toLowerCase();

  const visibleGroups = useMemo(() => {
    if (!trimmedQuery) return groups;
    return groups
      .map((group) => {
        const groupMatches = group.label.toLowerCase().includes(trimmedQuery);
        const options = groupMatches
          ? group.options
          : group.options.filter((o) =>
              o.label.toLowerCase().includes(trimmedQuery)
            );
        return { ...group, options };
      })
      .filter((group) => group.options.length > 0);
  }, [groups, trimmedQuery]);

  const toggleValues = (values: string[], turnOn: boolean) => {
    const next = new Set(selectedSet);
    for (const v of values) {
      if (turnOn) next.add(v);
      else next.delete(v);
    }
    onChange([...next]);
  };

  const toggleGroup = (group: FilterGroup) => {
    const values = groupValues(group);
    const state = optionState(values, selectedSet);
    toggleValues(values, state !== "all");
  };

  const toggleOption = (values: string[]) => {
    const state = optionState(values, selectedSet);
    toggleValues(values, state !== "all");
  };

  const toggleExpand = (groupLabel: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(groupLabel)) next.delete(groupLabel);
      else next.add(groupLabel);
      return next;
    });
  };

  const isExpanded = (groupLabel: string) =>
    Boolean(trimmedQuery) || expanded.has(groupLabel);

  return (
    <div ref={containerRef} className="relative flex flex-1 flex-col gap-1.5 text-left">
      <span className="px-1 font-mono text-[10px] uppercase tracking-widest text-white/35">
        {label}
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/80 backdrop-blur-md outline-none transition-all duration-200 hover:border-white/20 focus:border-white/25 focus:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="truncate">
          {selectedCount === 0
            ? `Any ${label.toLowerCase()}`
            : `${selectedCount} selected`}
        </span>
        <span className="flex items-center gap-1.5">
          {selectedCount > 0 && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  onChange([]);
                }
              }}
              className="rounded p-0.5 text-white/40 transition-colors hover:text-white"
              aria-label={`Clear ${label} filters`}
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-white/40 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 flex max-h-96 flex-col overflow-hidden rounded-xl border border-white/10 bg-zinc-900/95 shadow-2xl shadow-black/50 backdrop-blur-2xl">
          <div className="border-b border-white/10 p-2">
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5">
              <Search className="h-3.5 w-3.5 shrink-0 text-white/30" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}…`}
                className="w-full bg-transparent text-sm text-white/80 placeholder:text-white/25 outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-white/30 transition-colors hover:text-white"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto p-1">
            {visibleGroups.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-white/30">
                No matches
              </p>
            ) : (
              visibleGroups.map((group) => {
                const state = optionState(groupValues(group), selectedSet);
                const expandable = group.options.length > 1;
                const showChildren = isExpanded(group.label);
                return (
                  <div key={group.label} className="mb-0.5">
                    <div className="flex items-center gap-1 rounded-lg px-1 py-0.5 hover:bg-white/5">
                      {expandable ? (
                        <button
                          type="button"
                          onClick={() => toggleExpand(group.label)}
                          className="rounded p-1 text-white/40 transition-colors hover:text-white"
                          aria-label={showChildren ? "Collapse" : "Expand"}
                        >
                          {showChildren ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                        </button>
                      ) : (
                        <span className="w-[26px]" />
                      )}
                      <button
                        type="button"
                        onClick={() => toggleGroup(group)}
                        className="flex flex-1 items-center gap-2 py-1 text-left"
                      >
                        <Checkbox state={state} />
                        <span className="text-sm font-medium text-white/85">
                          {group.label}
                        </span>
                      </button>
                    </div>

                    {expandable && showChildren && (
                      <div className="ml-[26px] border-l border-white/5 pl-1">
                        {group.options.map((option) => {
                          const optState = optionState(
                            option.values,
                            selectedSet
                          );
                          return (
                            <button
                              key={option.label}
                              type="button"
                              onClick={() => toggleOption(option.values)}
                              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/5"
                            >
                              <Checkbox state={optState} />
                              <span className="text-sm text-white/60">
                                {option.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Checkbox({ state }: { state: SelectState }) {
  return (
    <span
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
        state === "none"
          ? "border-white/25 bg-transparent"
          : "border-white/60 bg-white/80"
      }`}
    >
      {state === "all" && <Check className="h-3 w-3 text-zinc-900" />}
      {state === "some" && <Minus className="h-3 w-3 text-zinc-900" />}
    </span>
  );
}
