// lib/format.ts
// Deterministic number formatting utilities.
// Using Intl with an explicit locale keeps SSR and client output identical,
// preventing React hydration mismatches.

const INR_FULL = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const INR_INT = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Format as Indian Rupees with 2 decimal places: ₹1,23,456.78 */
export function formatINR(value: number): string {
  return `₹${INR_FULL.format(value)}`;
}

/** Format as Indian Rupees with no decimals: ₹1,23,457 */
export function formatINRInt(value: number): string {
  return `₹${INR_INT.format(value)}`;
}

/** Format number with Indian grouping (no rupee symbol): 1,23,456.78 */
export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
