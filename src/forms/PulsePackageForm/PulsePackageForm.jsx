import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import FormTextField from '../../components/FormTextField/FormTextField';
import { useToast } from '../../context/ToastContext';

export default function PulsePackageForm({ onSubmit, submitLabel = 'Save' }) {
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
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="pulses"
            control={control}
            render={({ field }) => (
              <FormTextField
                field={{ ...field, value: field.value === '' ? '' : field.value }}
                id="pulse-package-pulses"
                label="Pulses"
                required
                type="number"
                placeholder="e.g. 5000"
                invalid={Boolean(errors.pulses)}
                errorMessage={errors.pulses?.message}
                disabled={isSubmitting}
                slotProps={{ htmlInput: { min: 1, step: 1 } }}
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
                id="pulse-package-price"
                label="Price"
                required
                placeholder="e.g. 10000.00"
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
                id="pulse-package-description"
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
