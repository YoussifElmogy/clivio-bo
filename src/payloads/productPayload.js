import { productDefaultValues } from '../schemas/productSchema';

export function mergeProductFromApi(data) {
  const row =
    data && typeof data === 'object' && data.product && typeof data.product === 'object'
      ? data.product
      : data;
  if (!row || typeof row !== 'object') return { ...productDefaultValues };

  const type = row.type === 'syringe' ? 'syringe' : 'veil';
  const serviceRaw = row.service ?? row.service_id;
  const service =
    serviceRaw !== '' && serviceRaw != null && !Number.isNaN(Number(serviceRaw)) ? Number(serviceRaw) : '';

  return {
    service,
    name: typeof row.name === 'string' ? row.name : '',
    type,
    quantity:
      row.quantity !== '' && row.quantity != null && !Number.isNaN(Number(row.quantity))
        ? Number(row.quantity)
        : '',
    volume:
      row.volume !== '' && row.volume != null && !Number.isNaN(Number(row.volume))
        ? Number(row.volume)
        : '',
    price: row.price !== '' && row.price != null && !Number.isNaN(Number(row.price)) ? Number(row.price) : '',
  };
}

export function buildProductPayload(values) {
  const payload = {
    service: Number(values.service),
    name: String(values.name ?? '').trim(),
    type: values.type === 'syringe' ? 'syringe' : 'veil',
    quantity: Number(values.quantity),
    price: Number(values.price),
  };

  if (payload.type === 'veil') {
    payload.volume = Number(values.volume);
  }

  return payload;
}
