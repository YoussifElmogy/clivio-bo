import { configurationDefaultValues } from '../schemas/configurationSchema';

/** File field names sent with multipart configuration (adjust if your API differs). */
export const CONFIG_FORM_FILE_FIELDS = {
  logo: 'logo',
  heroImage: 'hero_image',
};

/**
 * Builds multipart body for PATCH /configuration. Do not set Content-Type — the browser sets the boundary.
 * Sends image files under `logo` and `hero_image`; existing remote URLs go as `logo_url` / `hero_image_url` strings.
 */
export function buildConfigurationFormData(values) {
  const fd = new FormData();
  const { logo: logoKey, heroImage: heroKey } = CONFIG_FORM_FILE_FIELDS;

  fd.append('clinic_name', values.clinic_name.trim());
  fd.append('primary_color', values.primary_color.trim());

  if (values.logo_url instanceof File) {
    fd.append(logoKey, values.logo_url);
  } else if (typeof values.logo_url === 'string' && values.logo_url.trim()) {
    fd.append('logo_url', values.logo_url.trim());
  }

  if (values.hero_image_url instanceof File) {
    fd.append(heroKey, values.hero_image_url);
  } else if (typeof values.hero_image_url === 'string' && values.hero_image_url.trim()) {
    fd.append('hero_image_url', values.hero_image_url.trim());
  }

  const appendOptional = (key, raw) => {
    if (raw == null || raw === undefined) return;
    const s = typeof raw === 'string' ? raw.trim() : '';
    if (s) fd.append(key, s);
  };

  appendOptional('slogan', values.slogan);
  appendOptional('sub_slogan', values.sub_slogan);
  appendOptional('footer_info', values.footer_info);
  appendOptional('linkedin_url', values.linkedin_url);
  appendOptional('instagram_url', values.instagram_url);
  appendOptional('facebook_url', values.facebook_url);
  appendOptional('whatsapp_url', values.whatsapp_url);
  appendOptional('secondary_color', values.secondary_color);

  const interval = Number(values.slot_interval);
  if (!Number.isNaN(interval) && Number.isInteger(interval)) {
    fd.append('slot_interval', String(interval));
  }

  return fd;
}

export function mergeConfigFromApi(data) {
  if (!data || typeof data !== 'object') return { ...configurationDefaultValues };
  const merged = {
    ...configurationDefaultValues,
    ...Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined && v !== null)
    ),
  };
  if (merged.slot_interval != null && merged.slot_interval !== '') {
    const n = Number(merged.slot_interval);
    merged.slot_interval = Number.isNaN(n) ? '' : n;
  } else {
    merged.slot_interval = '';
  }
  return merged;
}
