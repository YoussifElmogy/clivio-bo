import React from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormFieldLabel from '../../components/FormFieldLabel/FormFieldLabel';
import FormTextField from '../../components/FormTextField/FormTextField';
import { useToast } from '../../context/ToastContext';
import { MACHINE_TYPE_OPTIONS, machinePriceFieldLabel } from '../../schemas/machineSchema';

export default function MachineForm({ services, onSubmit, submitLabel = 'Save machine' }) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useFormContext();
  const { showError: showValidationToast } = useToast();
  const selectedType = useWatch({ control, name: 'type' });
  const priceLabel = machinePriceFieldLabel(selectedType);

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
            name="service"
            control={control}
            render={({ field, fieldState }) => (
              <Box>
                <FormFieldLabel htmlFor="machine-service" required>
                  Service
                </FormFieldLabel>
                <FormControl fullWidth error={Boolean(fieldState.error)} variant="outlined">
                  <Select
                    id="machine-service"
                    value={field.value === '' || field.value === undefined ? '' : field.value}
                    onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                    disabled={isSubmitting}
                    inputProps={{ 'aria-label': 'Service' }}
                  >
                    <MenuItem value="">
                      <em>Select service</em>
                    </MenuItem>
                    {services.map(s => (
                      <MenuItem key={s.id} value={Number(s.id)}>
                        {s.name?.trim?.() || `Service #${s.id}`}
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

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="type"
            control={control}
            render={({ field, fieldState }) => (
              <Box>
                <FormFieldLabel htmlFor="machine-type" required>
                  Type
                </FormFieldLabel>
                <FormControl fullWidth error={Boolean(fieldState.error)} variant="outlined">
                  <Select
                    id="machine-type"
                    value={field.value ?? 'pulses'}
                    onChange={e => field.onChange(String(e.target.value))}
                    disabled={isSubmitting}
                    inputProps={{ 'aria-label': 'Type' }}
                  >
                    {MACHINE_TYPE_OPTIONS.map(opt => (
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
            name="name"
            control={control}
            render={({ field }) => (
              <FormTextField
                field={field}
                id="machine-name"
                label="Machine name"
                required
                placeholder="e.g. Laser Machine X200"
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
                id="machine-price"
                label={priceLabel}
                required
                type="number"
                placeholder="0.00"
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
                id="machine-description"
                label="Description"
                placeholder="Optional"
                multiline
                minRows={3}
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
