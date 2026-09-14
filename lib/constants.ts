export const DELIVERY_FEE = 2
// The pre-existing checkout UI never charged a separate service fee; kept at 0
// here (rather than omitted) so the pricing breakdown sent to
// POST /orders/create always includes the field the backend requires.
export const SERVICE_FEE = 0
