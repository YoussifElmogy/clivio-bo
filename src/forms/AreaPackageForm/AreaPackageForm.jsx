import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import FormTextField from '../../components/FormTextField/FormTextField';
import { useToast } from '../../context/ToastContext';

export default function AreaPackageForm({ onSubmit, submitLabel = 'Save' }) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useFormContext();
  const { showError: showValidationToast } = useToast();

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit(onSubmit, () =>
        showValidationToast('Please fix the errors highlighted below.')
      )}
    >
      <Grid container spacing={2.5}>
        <Grid size={12}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <FormTextField
                field={field}
                id="area-package-name"
                label="Name"
                required
                placeholder="e.g. Full Body"
                invalid={Boolean(errors.name)}
                errorMessage={errors.name?.message}
                disabled={isSubmitting}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="price"
            control={control}
            render={({ field }) => (
              <FormTextField
                field={field}
                id="area-package-price"
                label="Price"
                required
                placeholder="e.g. 2500.00"
                invalid={Boolean(errors.price)}
                errorMessage={errors.price?.message}
                disabled={isSubmitting}
              />
            )}
          />
        </Grid>
        <Grid size={12}>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <FormTextField
                field={field}
                id="area-package-description"
                label="Description"
                placeholder="Optional"
                invalid={Boolean(errors.description)}
                errorMessage={errors.description?.message}
                disabled={isSubmitting}
                multiline
                minRows={3}
              />
            )}
          />
        </Grid>
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
        <Button type="submit" variant="contained" size="large" disabled={isSubmitting} sx={{ minWidth: 160 }}>
          {isSubmitting ? <CircularProgress size={24} color="inherit" /> : submitLabel}
        </Button>
      </Box>
    </Box>
  );
}
