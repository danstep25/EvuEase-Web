export const UNIT_DECIMAL_PLACES = 2;

export function countDecimalPlaces(value: number | string): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  const raw = typeof value === 'number' ? value.toString() : String(value).trim();
  const dot = raw.indexOf('.');
  if (dot === -1) {
    return 0;
  }

  return raw.length - dot - 1;
}

export function normalizeUnitValue(
  value: number | string | null | undefined,
  decimalPlaces: number = UNIT_DECIMAL_PLACES
): number {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value ?? '').trim());
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  const factor = 10 ** decimalPlaces;
  return Math.round(Math.min(99, Math.max(0, parsed)) * factor) / factor;
}
