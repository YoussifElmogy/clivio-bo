import React from 'react';
import { Controller } from 'react-hook-form';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormTextField from '../../components/FormTextField/FormTextField';
import ImagePickerField from '../../components/ImagePickerField/ImagePickerField';

export default function ConfigurationForm({
  control,
  errors,
  isSubmitting,
  handleSubmit,
  onSubmit,
}) {
  return (
    <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2.5} sx={{ mb: 1 }}>
        <Grid size={12}>
          <Controller
            name="clinic_name"
            control={control}
            render={({ field }) => (
              <FormTextField
                field={field}
                id="config-clinic-name"
                label="Clinic name"
                required
                placeholder="e.g. Clivio Dermatology"
                invalid={Boolean(errors.clinic_name)}
                errorMessage={errors.clinic_name?.message}
                disabled={isSubmitting}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="logo_url"
            control={control}
            render={({ field }) => (
              <ImagePickerField
                id="config-logo-file"
                label="Logo"
                required
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={Boolean(errors.logo_url)}
                helperText={errors.logo_url?.message}
                disabled={isSubmitting}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="hero_image_url"
            control={control}
            render={({ field }) => (
              <ImagePickerField
                id="config-hero-file"
                label="Background image"
                required
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={Boolean(errors.hero_image_url)}
                helperText={errors.hero_image_url?.message}
                disabled={isSubmitting}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="primary_color"
            control={control}
            render={({ field }) => (
              <FormTextField
                field={field}
                id="config-primary-color"
                label="Primary color"
                required
                placeholder="#1ABC9C"
                invalid={Boolean(errors.primary_color)}
                errorMessage={errors.primary_color?.message}
                disabled={isSubmitting}
                colorPicker={{ emptyFallback: '#000000' }}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="secondary_color"
            control={control}
            render={({ field }) => (
              <FormTextField
                field={field}
                id="config-secondary-color"
                label="Secondary color"
                placeholder="#0F172A"
                invalid={Boolean(errors.secondary_color)}
                errorMessage={errors.secondary_color?.message}
                disabled={isSubmitting}
                colorPicker={{ emptyFallback: '#FFFFFF' }}
              />
            )}
          />
        </Grid>


        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="slogan"
            control={control}
            render={({ field }) => (
              <FormTextField
                field={field}
                id="config-slogan"
                label="Slogan"
                placeholder="e.g. Your skin, our care"
                invalid={Boolean(errors.slogan)}
                errorMessage={errors.slogan?.message}
                disabled={isSubmitting}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="sub_slogan"
            control={control}
            render={({ field }) => (
              <FormTextField
                field={field}
                id="config-sub-slogan"
                label="Sub slogan"
                placeholder="e.g. Expert dermatology since 2015"
                invalid={Boolean(errors.sub_slogan)}
                errorMessage={errors.sub_slogan?.message}
                disabled={isSubmitting}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="linkedin_url"
            control={control}
            render={({ field }) => (
              <FormTextField
                field={field}
                id="config-linkedin"
                label="LinkedIn"
                placeholder="https://linkedin.com/company/…"
                invalid={Boolean(errors.linkedin_url)}
                errorMessage={errors.linkedin_url?.message}
                disabled={isSubmitting}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="instagram_url"
            control={control}
            render={({ field }) => (
              <FormTextField
                field={field}
                id="config-instagram"
                label="Instagram"
                placeholder="https://instagram.com/…"
                invalid={Boolean(errors.instagram_url)}
                errorMessage={errors.instagram_url?.message}
                disabled={isSubmitting}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="facebook_url"
            control={control}
            render={({ field }) => (
              <FormTextField
                field={field}
                id="config-facebook"
                label="Facebook"
                placeholder="https://facebook.com/…"
                invalid={Boolean(errors.facebook_url)}
                errorMessage={errors.facebook_url?.message}
                disabled={isSubmitting}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="whatsapp_url"
            control={control}
            render={({ field }) => (
              <FormTextField
                field={field}
                id="config-whatsapp"
                label="WhatsApp"
                placeholder="https://wa.me/201000000000"
                invalid={Boolean(errors.whatsapp_url)}
                errorMessage={errors.whatsapp_url?.message}
                disabled={isSubmitting}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="slot_interval"
            control={control}
            render={({ field }) => (
              <FormTextField
                field={field}
                id="config-slot-interval"
                label="Slot interval (minutes)"
                required
                type="number"
                placeholder="30"
                invalid={Boolean(errors.slot_interval)}
                errorMessage={errors.slot_interval?.message}
                disabled={isSubmitting}
                slotProps={{ htmlInput: { min: 1, max: 1440, step: 1 } }}
              />
            )}
          />
        </Grid>

        <Grid size={12}>
          <Controller
            name="footer_info"
            control={control}
            render={({ field }) => (
              <FormTextField
                field={field}
                id="config-footer-info"
                label="Footer info"
                placeholder="e.g. © 2026 Clivio Dermatology. All rights reserved."
                invalid={Boolean(errors.footer_info)}
                errorMessage={errors.footer_info?.message}
                disabled={isSubmitting}
                multiline
                minRows={2}
              />
            )}
          />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={isSubmitting}
          sx={{ minWidth: 160, py: 1.25 }}
        >
          {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Save'}
        </Button>
      </Box>
    </Box>
  );
}
