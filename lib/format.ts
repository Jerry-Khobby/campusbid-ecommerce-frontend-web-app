/** Ghana Cedis formatting — the only currency this app deals in. */
export function formatCurrency(value: number): string {
  return `₵${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
