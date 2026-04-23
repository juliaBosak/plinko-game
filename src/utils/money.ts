export const round2 = (x: number): number => Math.round(x * 100) / 100;

export const formatUSD = (x: number): string => `$${x.toFixed(2)}`;
