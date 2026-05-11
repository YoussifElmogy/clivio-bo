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

export default function DoctorMedicineForm({
  doctors,
  disableDoctor = false,
  showDoctorField = true,
  onSubmit,
  submitLabel = 'Save medicine',
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
                  <InputLabel id="doctor-medicine-doctor-label" sx={{ mb: 0.75 }}>
                    Doctor
                  </InputLabel>
                  <FormControl fullWidth error={Boolean(fieldState.error)}>
                    <Select
                      labelId="doctor-medicine-doctor-label"
                      id="doctor-medicine-doctor"
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
                    {fieldState.error?.message ? <FormHelperText>{fieldState.error.message}</FormHelperText> : null}
                  </FormControl>
                </Box>
              )}
            />
          </Grid>
        ) : null}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <FormTextField
                field={field}
                id="doctor-medicine-name"
                label="Medicine name"
                required
                placeholder="e.g. Amoxicillin"
                invalid={Boolean(errors.name)}
                errorMessage={errors.name?.message}
                disabled={isSubmitting}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="concentration"
            control={control}
            render={({ field }) => (
              <FormTextField
                field={field}
                id="doctor-medicine-concentration"
                label="Concentration"
                required
                placeholder="e.g. 500mg"
                invalid={Boolean(errors.concentration)}
                errorMessage={errors.concentration?.message}
                disabled={isSubmitting}
              />
            )}
          />
        </Grid>
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
        <Button type="submit" variant="contained" size="large" disabled={isSubmitting} sx={{ minWidth: 170 }}>
          {isSubmitting ? <CircularProgress size={24} color="inherit" /> : submitLabel}
        </Button>
      </Box>
    </Box>
  );
}
