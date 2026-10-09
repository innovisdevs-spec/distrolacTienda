const ars = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Display only: never use a localized value in calculations or API payloads. */
export function formatMoney(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '$ —';
  const amount = Number(value);
  return Number.isFinite(amount) ? `$ ${ars.format(amount)}` : '$ —';
}
