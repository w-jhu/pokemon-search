"use client";

import { LayoutDensity, PokemonCard } from "@/types/pokemon";
import PokemonCardItem from "./PokemonCardItem";

interface CardGridProps {
  cards: PokemonCard[];
  layout: LayoutDensity;
  onInfoClick: (card: PokemonCard) => void;
  onZoomClick: (card: PokemonCard) => void;
}

export default function CardGrid({
  cards,
  layout,
  onInfoClick,
  onZoomClick,
}: CardGridProps) {
  const isList = layout === "list";

  return (
    <div
      className={`transition-opacity duration-500 ${
        isList
          ? "flex flex-col gap-4"
          : "grid grid-cols-2 gap-6 md:grid-cols-4 xl:grid-cols-6"
      }`}
    >
      {cards.map((card) => (
        <PokemonCardItem
          key={card.id}
          card={card}
          layout={layout}
          onInfoClick={onInfoClick}
          onZoomClick={onZoomClick}
        />
      ))}
    </div>
  );
}
