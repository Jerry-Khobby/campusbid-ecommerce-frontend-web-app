import { apiFetch } from "./client"

export interface Category {
  id: string
  name: string
  icon?: string
  productCount: number
}

/** Fetches every active category. The backend returns this list unpaginated. */
export async function fetchCategories(): Promise<Category[]> {
  const json = await apiFetch<{ data: Category[] }>("/categories")
  return json.data
}
