/**
 * Helpers for merging existing prescription data when saving from the appointments list.
 */

export function extractPrescriptionContextFromSummary(data) {
  if (!data || typeof data !== 'object') {
    return { medicines: [], discount: '', status: 'arrived', doctorId: null };
  }

  const medicinesRaw = data.prescription?.medicines ?? data.medicines ?? [];
  const medicines = Array.isArray(medicinesRaw)
    ? medicinesRaw
        .map(entry => {
          const description = String(entry?.description ?? '').trim();
          if (!description) return null;
          const dash = description.indexOf(' - ');
          if (dash !== -1) {
            return {
              name: description.slice(0, dash).trim(),
              description: description.slice(dash + 3).trim(),
            };
          }
          return { name: description, description: '' };
        })
        .filter(Boolean)
    : [];

  const rawDiscount =
    data.reservation?.discount ??
    data.reservation?.discount_amount ??
    data.discount ??
    '';
  const discount =
    rawDiscount === '' || rawDiscount == null || Number.isNaN(Number(rawDiscount))
      ? ''
      : String(rawDiscount);

  const status = String(data.reservation?.status ?? '').trim().toLowerCase() || 'arrived';

  const doctorRaw =
    data.reservation?.doctor_id ??
    data.doctor_id ??
    data.reservation?.doctor?.id ??
    null;
  const doctorId =
    doctorRaw != null && doctorRaw !== '' && !Number.isNaN(Number(doctorRaw))
      ? Number(doctorRaw)
      : null;

  return { medicines, discount, status, doctorId };
}

export function mapGeneralServicesToEditorRows(services) {
  return (Array.isArray(services) ? services : []).map((service, index) => ({
    id: `svc-${service.general_service_id}-${index}`,
    general_service_id: service.general_service_id,
    name: service.name ?? '',
    price: service.price === '' || service.price == null ? '' : String(service.price),
  }));
}

export function enrichServiceRowsWithCatalog(rows, catalog) {
  if (!Array.isArray(catalog) || catalog.length === 0) return rows;
  return (Array.isArray(rows) ? rows : []).map(row => {
    if (row.name) return row;
    const match = catalog.find(s => Number(s.id) === Number(row.general_service_id));
    if (!match) return row;
    const defaultPrice = match.clinic_fees ?? match.price ?? '';
    return {
      ...row,
      name: match.name,
      price:
        row.price !== ''
          ? row.price
          : defaultPrice !== '' && defaultPrice != null
            ? String(defaultPrice)
            : '',
    };
  });
}

export function validateGeneralServiceEditorRows(rows, { requireAtLeastOne = true } = {}) {
  if (requireAtLeastOne && (!Array.isArray(rows) || rows.length === 0)) {
    return 'Add at least one general service.';
  }
  for (const row of rows ?? []) {
    const priceNumber = Number(row.price);
    if (String(row.price ?? '').trim() === '' || !Number.isFinite(priceNumber) || priceNumber < 0) {
      return `Enter a valid price for ${row.name || 'each general service'}.`;
    }
  }
  return null;
}
