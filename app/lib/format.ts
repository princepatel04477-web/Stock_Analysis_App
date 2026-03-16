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

/** ₹1,23,456.78 */
export function formatINR(value: number): string {
  return `₹${INR_FULL.format(value)}`;
}

/** ₹1,23,457 (no decimals) */
export function formatINRInt(value: number): string {
  return `₹${INR_INT.format(value)}`;
}

/** 1,23,456.78 (no rupee symbol) */
export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
