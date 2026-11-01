/** Romanian standard VAT rate (21 % since August 2025). */
export const VAT_RATE = 0.21;

/**
 * The listed price is the gross price (TTC, VAT included). For a VAT-deductible
 * vehicle the net price (HT) is shown too: HT + HT × 21 % = TTC, so
 * HT = TTC / 1.21, rounded to the euro.
 */
export function netFromGross(gross: number): number {
  return Math.round(gross / (1 + VAT_RATE));
}

/** "21" — for labels like "TVA 21 %". */
export const VAT_PERCENT = Math.round(VAT_RATE * 100);
