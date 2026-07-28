import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import FormTextField from '../../components/FormTextField/FormTextField';
import { useToast } from '../../context/ToastContext';

function doctorOptionLabel(d) {
  const id = d?.id ?? d?.uuid;
  return d?.name?.trim?.() || d?.full_name?.trim?.() || d?.email?.trim?.() || `Doctor #${id}`;
}

function doctorOptionId(d) {
  const id = d?.id ?? d?.uuid;
  return id == null ? null : Number(id);
}

export default function GeneralServiceForm({
  doctors = [],
  disableDoctor = false,
  showDoctorField = false,
  showDoctorMultiSelect = false,
  onSubmit,
  submitLabel = 'Save',
}) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useFormContext();
  const { showError: showValidationToast } = useToast();

  const doctorOptions = doctors
    .map(d => {
      const id = doctorOptionId(d);
      if (id == null) return null;
      return { id, label: doctorOptionLabel(d) };
    })
    .filter(Boolean);

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
                        const label = doctorOptionLabel(d);
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
            name="clinicFees"
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
                id="general-service-clinic-fees"
                label="Clinic fees"
                type="number"
                placeholder="e.g. 50"
                invalid={Boolean(errors.clinicFees)}
                errorMessage={errors.clinicFees?.message}
                disabled={isSubmitting}
                slotProps={{
                  htmlInput: { min: 0, step: 0.01 },
                }}
              />
            )}
          />
        </Grid>
        {showDoctorMultiSelect ? (
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Assign to doctors
            </Typography>
            <Controller
              name="doctors"
              control={control}
              render={({ field, fieldState }) => {
                const selectedIds = Array.isArray(field.value) ? field.value.map(Number) : [];
                const selectedOptions = selectedIds
                  .map(id => doctorOptions.find(o => o.id === id) ?? { id, label: `Doctor #${id}` })
                  .filter(Boolean);
                return (
                  <Autocomplete
                    multiple
                    disabled={isSubmitting}
                    options={doctorOptions}
                    value={selectedOptions}
                    onChange={(_, next) => field.onChange(next.map(o => o.id))}
                    getOptionLabel={option => option.label}
                    isOptionEqualToValue={(a, b) => Number(a.id) === Number(b.id)}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip {...getTagProps({ index })} key={option.id} size="small" label={option.label} />
                      ))
                    }
                    renderInput={params => (
                      <TextField
                        {...params}
                        size="small"
                        label="Doctors"
                        placeholder="Search and select one or more doctors"
                        error={Boolean(fieldState.error)}
                        helperText={
                          fieldState.error?.message ||
                          'Each selected doctor gets this service with the same clinic fees.'
                        }
                      />
                    )}
                  />
                );
              }}
            />
          </Grid>
        ) : null}
      </Grid>
      <Box sx={{ mt: 3 }}>
        <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ borderRadius: 2, minWidth: 140 }}>
          {isSubmitting ? <CircularProgress size={22} color="inherit" /> : submitLabel}
        </Button>
      </Box>
    </Box>
  );
}
