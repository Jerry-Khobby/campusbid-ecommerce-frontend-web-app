"use client"

import { Filter } from "lucide-react"
import type { SortOption } from "@/lib/product-filters"

interface CategorySortBarProps {
  categories: string[]
  selectedCategory: string | null
  onSelectCategory: (category: string | null) => void
  sortBy: SortOption
  onChangeSortBy: (sortBy: SortOption) => void
}

export function CategorySortBar({
  categories,
  selectedCategory,
  onSelectCategory,
  sortBy,
  onChangeSortBy,
}: CategorySortBarProps) {
  return (
    <div className="mb-6 flex flex-wrap gap-3 items-center">
      <div className="flex items-center gap-2">
        <Filter size={18} className="text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">Category:</span>
      </div>
      <button
        onClick={() => onSelectCategory(null)}
        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
          selectedCategory === null
            ? "bg-accent text-accent-foreground"
            : "bg-muted text-muted-foreground hover:text-foreground"
        }`}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelectCategory(category)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === category
              ? "bg-accent text-accent-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          {category}
        </button>
      ))}

      <div className="ml-auto flex items-center gap-2">
        <span className="text-sm font-semibold text-foreground">Sort:</span>
        <select
          value={sortBy}
          onChange={(e) => onChangeSortBy(e.target.value as SortOption)}
          className="px-3 py-1 rounded-lg bg-muted text-foreground text-sm font-medium border border-border"
        >
          <option value="distance">Nearest</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
        </select>
      </div>
    </div>
  )
}
