import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { useToast } from '../../context/ToastContext';
import FormFieldLabel from '../../components/FormFieldLabel/FormFieldLabel';
import FormTextField from '../../components/FormTextField/FormTextField';
import { SERVICE_CATEGORY_OPTIONS } from '../../schemas/serviceSchema';

export default function ServiceForm({ onSubmit, submitLabel = 'Save service' }) {
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
                id="service-name"
                label="Service name"
                required
                placeholder="e.g. Teeth Cleaning"
                invalid={Boolean(errors.name)}
                errorMessage={errors.name?.message}
                disabled={isSubmitting}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="category"
            control={control}
            render={({ field, fieldState }) => (
              <Box>
                <FormFieldLabel htmlFor="service-category" required>
                  Category
                </FormFieldLabel>
                <FormControl fullWidth error={Boolean(fieldState.error)} variant="outlined">
                  <Select
                    id="service-category"
                    value={field.value ?? ''}
                    onChange={e => field.onChange(String(e.target.value))}
                    disabled={isSubmitting}
                    inputProps={{ 'aria-label': 'Category' }}
                  >
                    <MenuItem value="">
                      <em>Select category</em>
                    </MenuItem>
                    {SERVICE_CATEGORY_OPTIONS.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {fieldState.error?.message ? (
                    <FormHelperText>{fieldState.error.message}</FormHelperText>
                  ) : null}
                </FormControl>
              </Box>
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
                id="service-description"
                label="Description"
                placeholder="Optional description"
                multiline
                minRows={4}
                invalid={Boolean(errors.description)}
                errorMessage={errors.description?.message}
                disabled={isSubmitting}
              />
            )}
          />
        </Grid>
      </Grid>

      <Button
        type="submit"
        variant="contained"
        size="large"
        sx={{ mt: 3, borderRadius: 2, minWidth: 170 }}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Saving…' : submitLabel}
      </Button>
    </Box>
  );
}
