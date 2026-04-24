/**
 * List URL for service dropdowns scoped by backend `category` (injectable vs machine).
 */
export function servicesCatalogUrl(category) {
  const params = new URLSearchParams({ page: '1', page_size: '500' });
  params.set('category', category);
  return `/services?${params.toString()}`;
}
