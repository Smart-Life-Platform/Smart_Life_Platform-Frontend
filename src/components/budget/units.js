export const UNITS = ['pcs', 'kg', 'g', 'L', 'ml', 'packs', 'bottles'];
export const DEFAULT_UNIT = 'pcs';

export const formatQuantity = (quantity, unit = DEFAULT_UNIT) =>
  `${Number(quantity).toLocaleString('en-US', { maximumFractionDigits: 2 })} ${unit}`;
