/** Ghana Cedis formatting — the only currency this app deals in. */
export function formatCurrency(value: number): string {
  return `₵${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** "1 item", "3 items" — pass `plural` for irregular words. */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}
