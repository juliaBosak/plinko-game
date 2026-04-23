import { describe, it, expect } from 'vitest';
import { round2, formatUSD } from '@/utils/money';

describe('round2', () => {
  it('rounds to 2 decimal places', () => {
    expect(round2(1.234)).toBe(1.23);
    expect(round2(1.236)).toBe(1.24);
    expect(round2(1.125)).toBe(1.13); // 1.125 * 100 = 112.5 exactly → rounds to 1.13
    expect(round2(2.555)).toBe(2.56); // 2.555 * 100 = 255.5 exactly → rounds to 2.56
  });

  it('handles integers unchanged', () => {
    expect(round2(5)).toBe(5);
    expect(round2(0)).toBe(0);
  });

  it('handles floating point multiplication artifacts', () => {
    // 0.1 + 0.2 = 0.30000000000000004 in JS
    expect(round2(0.1 + 0.2)).toBe(0.3);
  });

  it('handles negative numbers', () => {
    expect(round2(-1.005)).toBe(-1);
    expect(round2(-1.234)).toBe(-1.23);
  });
});

describe('formatUSD', () => {
  it('formats with dollar sign and two decimals', () => {
    expect(formatUSD(10)).toBe('$10.00');
    expect(formatUSD(0.5)).toBe('$0.50');
    expect(formatUSD(1234.5)).toBe('$1234.50');
  });

  it('formats zero correctly', () => {
    expect(formatUSD(0)).toBe('$0.00');
  });
});
