"use client"

import { Filter } from "lucide-react"
import type { Category } from "@/lib/api/categories"

interface CategorySortBarProps {
  categories: Category[]
  selectedCategory: string | null
  onSelectCategory: (category: string | null) => void
}

// Only category filtering is offered here: the backend's product list has no
// sort parameter (results are always ordered by createdAt descending) and
// Product carries no distance field to sort by.
export function CategorySortBar({ categories, selectedCategory, onSelectCategory }: CategorySortBarProps) {
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
          key={category.id}
          onClick={() => onSelectCategory(category.name)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === category.name
              ? "bg-accent text-accent-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  )
}
