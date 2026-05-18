import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormTextField from '../../components/FormTextField/FormTextField';
import { useToast } from '../../context/ToastContext';

export default function GeneralServiceForm({
  doctors = [],
  disableDoctor = false,
  showDoctorField = false,
  onSubmit,
  submitLabel = 'Save',
}) {
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
        {showDoctorField ? (
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="doctor"
              control={control}
              render={({ field, fieldState }) => (
                <Box>
                  <InputLabel id="general-service-doctor-label" sx={{ mb: 0.75 }}>
                    Doctor
                  </InputLabel>
                  <FormControl fullWidth error={Boolean(fieldState.error)}>
                    <Select
                      labelId="general-service-doctor-label"
                      id="general-service-doctor"
                      value={field.value === '' || field.value == null ? '' : field.value}
                      onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                      disabled={isSubmitting || disableDoctor}
                    >
                      <MenuItem value="">
                        <em>Select doctor</em>
                      </MenuItem>
                      {doctors.map(d => {
                        const id = d.id ?? d.uuid;
                        if (id == null) return null;
                        const label = d.name?.trim?.() || d.full_name?.trim?.() || `Doctor #${id}`;
                        return (
                          <MenuItem key={String(id)} value={Number(id)}>
                            {label}
                          </MenuItem>
                        );
                      })}
                    </Select>
                    {fieldState.error?.message ? (
                      <FormHelperText>{fieldState.error.message}</FormHelperText>
                    ) : null}
                  </FormControl>
                </Box>
              )}
            />
          </Grid>
        ) : null}
        <Grid size={{ xs: 12, sm: showDoctorField ? 6 : 12 }}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <FormTextField
                field={field}
                id="general-service-name"
                label="Name"
                required
                placeholder="e.g. Consultation"
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
                field={{
                  ...field,
                  value: field.value === '' || field.value == null ? '' : field.value,
                  onChange: e => {
                    const v = e.target.value;
                    field.onChange(v === '' ? '' : Number(v));
                  },
                }}
                id="general-service-price"
                label="Price"
                type="number"
                required
                placeholder="e.g. 150"
                invalid={Boolean(errors.price)}
                errorMessage={errors.price?.message}
                disabled={isSubmitting}
                slotProps={{
                  htmlInput: { min: 0, step: 0.01 },
                }}
              />
            )}
          />
        </Grid>
      </Grid>
      <Box sx={{ mt: 3 }}>
        <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ borderRadius: 2, minWidth: 140 }}>
          {isSubmitting ? <CircularProgress size={22} color="inherit" /> : submitLabel}
        </Button>
      </Box>
    </Box>
  );
}
