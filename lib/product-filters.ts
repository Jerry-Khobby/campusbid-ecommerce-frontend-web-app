import type { mockItems } from "@/lib/mock-data"

export type MarketplaceItem = (typeof mockItems)[number]
export type SortOption = "price-low" | "price-high" | "distance"

export function getCategories(items: MarketplaceItem[]): string[] {
  return Array.from(new Set(items.map((item) => item.category)))
}

export function filterItems(
  items: MarketplaceItem[],
  searchQuery: string,
  selectedCategory: string | null,
): MarketplaceItem[] {
  const query = searchQuery.toLowerCase()
  return items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(query) ||
      item.vendor.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    const matchesCategory = !selectedCategory || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })
}

export function sortItems(items: MarketplaceItem[], sortBy: SortOption): MarketplaceItem[] {
  const sorted = [...items]
  if (sortBy === "price-low") return sorted.sort((a, b) => a.price - b.price)
  if (sortBy === "price-high") return sorted.sort((a, b) => b.price - a.price)
  return sorted.sort((a, b) => a.distance - b.distance)
}
