type Weighted = { typeOfFractionation?: string; cap?: number };
export const canChooseHalf = (p?: Weighted | null) => p?.typeOfFractionation === 'Pesado' && Number.isFinite(Number(p.cap)) && Number(p.cap) >= 4;
export const validHormaQuantity = (q: number) => Number.isFinite(q) && q > 0 && Number.isInteger(q * 2);
export function addPresentation(current: number, amount: number, half: boolean) {
  if (current !== 0 && !validHormaQuantity(current)) throw new Error('Revisá la cantidad que ya tenés en el carrito.');
  if (half) return Math.floor(current) + 0.5; // At most ONE half per product, including repeated clicks.
  if (!Number.isInteger(amount) || amount < 1) throw new Error('Ingresá una cantidad entera.');
  return current + amount;
}
export function hormaLabel(q: number) {
  if (!validHormaQuantity(q)) return `${q} hormas`;
  const whole = Math.floor(q);
  return [whole ? `${whole} horma${whole === 1 ? '' : 's'} entera${whole === 1 ? '' : 's'}` : '', q % 1 ? '1 media horma' : ''].filter(Boolean).join(' + ');
}
export function presentationMetadata(item: Weighted & {quantity:number}) {
  return item.typeOfFractionation === 'Pesado' ? {fractionationType:'Pesado', hormaQuantity:item.quantity, capKg:Number(item.cap), displayUnit:'horma'} : {fractionationType:item.typeOfFractionation || 'No', displayUnit:'un'};
}

export type OrderQuantity = {
  quantity: number;
  fractionationType?: string | null;
  hormaQuantity?: number | null;
  displayUnit?: string | null;
};

// Persisted quantity is kg for weighted orders, NOT number of pieces.
// Never infer historical presentations from today's product weight or name.
export function orderQuantityLabel(item: OrderQuantity) {
  if (item.quantity == null || !Number.isFinite(Number(item.quantity)) || Number(item.quantity) < 0) return '—';
  const q = Number(item.quantity);
  const amount = q.toLocaleString('es-AR', {maximumFractionDigits: 3});
  if (item.fractionationType === 'Pesado' || item.displayUnit === 'horma' || item.displayUnit === 'kg') {
    const pieces = item.hormaQuantity == null ? NaN : Number(item.hormaQuantity);
    return validHormaQuantity(pieces) ? `${hormaLabel(pieces)} · ${amount} kg` : `${amount} kg`;
  }
  if (item.fractionationType === 'Unitario' || item.displayUnit === 'un') return `${amount} ${q === 1 ? 'unidad' : 'unidades'}`;
  return amount; // Legacy order without unit metadata: preserve its recorded value.
}
