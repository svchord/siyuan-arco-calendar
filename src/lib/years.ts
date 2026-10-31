const YEAR_RADIUS = 50;

export function buildYearOptions(around = new Date().getFullYear()) {
  return Array.from({ length: YEAR_RADIUS * 2 + 1 }, (_, index) => around - YEAR_RADIUS + index);
}
