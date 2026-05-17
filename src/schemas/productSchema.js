import * as yup from 'yup';

export const PRODUCT_TYPE_OPTIONS = [
  { value: 'veil', label: 'Vial' },
  { value: 'syringe', label: 'Syringe' },
];

/** API type remains `veil` for vial products. */
export function normalizeProductType(type) {
  return type === 'syringe' ? 'syringe' : 'veil';
}

export function isSyringeProduct(type) {
  return normalizeProductType(type) === 'syringe';
}

/** Label for amount used on a zone (syringe count vs vial ml). */
export function dermaZoneUsageFieldLabel(type) {
  return isSyringeProduct(type) ? 'Quantity' : 'Volume (ml)';
}

export function productPriceFieldLabel(type) {
  if (type === 'syringe') return 'Price per syringe';
  return 'Price per ml';
}

/** @returns {{ valid: boolean, message?: string, quantity?: number, volume_ml?: number }} */
export function parseDermaZoneProductUsage(type, rawValue) {
  const trimmed = String(rawValue ?? '').trim();
  if (!trimmed) {
    return { valid: false, message: `${dermaZoneUsageFieldLabel(type)} is required` };
  }
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n <= 0) {
    return { valid: false, message: 'Enter a number greater than 0' };
  }
  if (isSyringeProduct(type)) {
    if (!Number.isInteger(n)) {
      return { valid: false, message: 'Quantity must be a whole number' };
    }
    return { valid: true, quantity: n };
  }
  return { valid: true, volume_ml: n };
}

export function formatDermaZoneProductChipLabel(product) {
  const name = product.name?.trim?.() || 'Product';
  if (product.catalogKind === 'machine') {
    if (product.type === 'duration' && product.minutes != null) {
      return `${name} — ${product.minutes} min`;
    }
    if (product.type === 'pulses' && product.pulses != null) {
      return `${name} — ${product.pulses} pulses`;
    }
    return name;
  }
  const prefix = product.machineName ? `${product.machineName}: ` : '';
  if (isSyringeProduct(product.type) && product.quantity != null) {
    return `${prefix}${name} × ${product.quantity}`;
  }
  if (product.volume_ml != null) {
    return `${prefix}${name} — ${product.volume_ml} ml`;
  }
  return prefix ? `${prefix}${name}` : name;
}

export const productDefaultValues = {
  service: '',
  name: '',
  type: 'veil',
  quantity: '',
  volume: '',
  price: '',
};

export const productSchema = yup.object({
  service: yup
    .mixed()
    .required('Select a service')
    .test('service', 'Select a service', v => v !== '' && v != null && !Number.isNaN(Number(v))),
  name: yup.string().trim().required('Name is required'),
  type: yup.string().oneOf(['veil', 'syringe']).required('Type is required'),
  quantity: yup
    .number()
    .typeError('Quantity must be a number')
    .integer('Quantity must be an integer')
    .min(0, 'Quantity must be at least 0')
    .required('Quantity is required'),
  volume: yup
    .number()
    .transform((value, originalValue) => {
      if (originalValue === '' || originalValue == null) return undefined;
      return value;
    })
    .when('type', {
      is: 'veil',
      then: schema =>
        schema
          .typeError('Volume must be a number')
          .moreThan(0, 'Volume must be greater than 0')
          .required('Volume is required for vial'),
      otherwise: schema => schema.notRequired(),
    }),
  price: yup
    .number()
    .typeError('Price must be a number')
    .moreThan(0, 'Price must be greater than 0')
    .required('Price is required'),
});
