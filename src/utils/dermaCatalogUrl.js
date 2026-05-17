/** Page size when loading full catalogs for derma zone mapping. */
export const DERMA_CATALOG_PAGE_SIZE = 100;

export function dermaServicesListUrl() {
  const params = new URLSearchParams({
    page: '1',
    page_size: String(DERMA_CATALOG_PAGE_SIZE),
  });
  return `/services?${params.toString()}`;
}

export function isMachineServiceCategory(category) {
  return String(category ?? '').toLowerCase() === 'machine';
}

export function isInjectableServiceCategory(category) {
  return String(category ?? '').toLowerCase() === 'injectable';
}

export function productsByServiceUrl(serviceId) {
  const params = new URLSearchParams({
    page: '1',
    page_size: String(DERMA_CATALOG_PAGE_SIZE),
    service_id: String(serviceId),
  });
  return `/products?${params.toString()}`;
}

/** All injectable products (e.g. machine type `injectables` — no service filter). */
export function allProductsUrl() {
  const params = new URLSearchParams({
    page: '1',
    page_size: String(DERMA_CATALOG_PAGE_SIZE),
  });
  return `/products?${params.toString()}`;
}

export function machinesByServiceUrl(serviceId) {
  const params = new URLSearchParams({
    page: '1',
    page_size: String(DERMA_CATALOG_PAGE_SIZE),
    service_id: String(serviceId),
  });
  return `/machines?${params.toString()}`;
}

/** Injectable services → products; machine services → machines. */
export function dermaCatalogItemsUrl(serviceId, category) {
  if (isMachineServiceCategory(category)) {
    return machinesByServiceUrl(serviceId);
  }
  return productsByServiceUrl(serviceId);
}

export function dermaCatalogListKeys(category) {
  return isMachineServiceCategory(category) ? ['machines'] : ['products'];
}
