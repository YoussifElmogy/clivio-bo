import * as yup from 'yup';

const hexColor = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

const trimOrEmpty = v =>
  v == null || String(v).trim() === '' ? undefined : String(v).trim();

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function isNonEmptyStringUrl(v) {
  if (typeof v !== 'string') return false;
  const t = v.trim();
  if (!t) return false;
  return /^https?:\/\//i.test(t);
}

function isValidLogoOrHero(v) {
  if (v instanceof File) {
    return (
      v.type.startsWith('image/') &&
      v.size > 0 &&
      v.size <= MAX_IMAGE_BYTES
    );
  }
  return isNonEmptyStringUrl(v);
}

export const configurationDefaultValues = {
  clinic_name: '',
  logo_url: '',
  hero_image_url: '',
  primary_color: '',
  slogan: '',
  sub_slogan: '',
  footer_info: '',
  linkedin_url: '',
  instagram_url: '',
  facebook_url: '',
  whatsapp_url: '',
  secondary_color: '',
  slot_interval: '',
};

const optionalUrl = yup
  .string()
  .transform(trimOrEmpty)
  .optional()
  .url('Enter a valid URL');

const optionalHex = yup
  .string()
  .transform(trimOrEmpty)
  .optional()
  .matches(hexColor, 'Use a valid hex color (#RGB or #RRGGBB)');

export const configurationSchema = yup.object({
  clinic_name: yup.string().trim().required('Clinic name is required'),
  logo_url: yup
    .mixed()
    .required('Logo is required')
    .test(
      'logo',
      'Add a logo image (PNG, JPG, WebP — up to 8 MB) or a valid URL',
      value => isValidLogoOrHero(value)
    ),
  hero_image_url: yup
    .mixed()
    .required('Background image is required')
    .test(
      'hero',
      'Add a background image (PNG, JPG, WebP — up to 8 MB) or a valid URL',
      value => isValidLogoOrHero(value)
    ),
  primary_color: yup
    .string()
    .trim()
    .required('Primary color is required')
    .matches(hexColor, 'Use a valid hex color (#RGB or #RRGGBB)'),
  slogan: yup.string().transform(trimOrEmpty).optional(),
  sub_slogan: yup.string().transform(trimOrEmpty).optional(),
  footer_info: yup.string().transform(trimOrEmpty).optional(),
  linkedin_url: optionalUrl,
  instagram_url: optionalUrl,
  facebook_url: optionalUrl,
  whatsapp_url: optionalUrl,
  secondary_color: optionalHex,
  slot_interval: yup
    .number()
    .transform((_, originalValue) => {
      if (originalValue === '' || originalValue === null || originalValue === undefined) {
        return undefined;
      }
      return Number(originalValue);
    })
    .typeError('Enter a number')
    .integer('Use a whole number (minutes)')
    .min(1, 'At least 1 minute')
    .max(1440, 'At most 1440 minutes (24 hours)')
    .required('Slot interval is required'),
});
