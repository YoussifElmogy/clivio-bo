import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import FormTextField from '../../components/FormTextField/FormTextField';
import PhoneNumberField from '../../components/PhoneNumberField/PhoneNumberField';
import DoctorBranchSchedules from './DoctorBranchSchedules';
import DoctorFormSkeleton from './DoctorFormSkeleton';
import { useToast } from '../../context/ToastContext';

export default function DoctorForm({
  branches,
  isLoading = false,
  isEdit = false,
  showPasswordField = false,
  onSubmit,
  submitLabel = 'Create doctor',
}) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useFormContext();
  const { showError: showValidationToast } = useToast();

  if (isLoading) {
    return <DoctorFormSkeleton />;
  }

  const noBranches = !Array.isArray(branches) || branches.length === 0;

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit(onSubmit, () =>
        showValidationToast('Please fix the errors highlighted below.')
      )}
    >
      {typeof errors.branch_schedules?.message === 'string' ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.branch_schedules.message}
        </Alert>
      ) : null}

      {noBranches ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          {isEdit
            ? 'No branches yet. You can still update this doctor; add branch schedules when branches exist.'
            : 'No branches yet. You can still create the doctor; add branch schedules later when branches exist.'}
        </Alert>
      ) : null}

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <FormTextField
                field={field}
                id="doctor-name"
                label="Name"
                required
                placeholder="Full name"
                invalid={Boolean(errors.name)}
                errorMessage={errors.name?.message}
                disabled={isSubmitting}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <FormTextField
                field={field}
                id="doctor-email"
                label="Email"
                required
                type="email"
                placeholder="name@clinic.com"
                invalid={Boolean(errors.email)}
                errorMessage={errors.email?.message}
                disabled={isSubmitting || isEdit}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <PhoneNumberField
            control={control}
            countryCodeName="phone_country_code"
            numberName="phone"
            id="doctor-phone"
            label="Phone"
            required
            placeholder="100 111 2233"
            disabled={isSubmitting}
            countryError={errors.phone_country_code}
            numberError={errors.phone}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="specialty"
            control={control}
            render={({ field }) => (
              <FormTextField
                field={field}
                id="doctor-specialty"
                label="Specialty"
                placeholder="e.g. Cardiology (optional)"
                invalid={Boolean(errors.specialty)}
                errorMessage={errors.specialty?.message}
                disabled={isSubmitting}
              />
            )}
          />
        </Grid>
       
        {showPasswordField && !isEdit ? (
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <FormTextField
                  field={field}
                  id="doctor-password"
                  label="Password"
                  required
                  type="password"
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  invalid={Boolean(errors.password)}
                  errorMessage={errors.password?.message}
                  disabled={isSubmitting}
                />
              )}
            />
          </Grid>
        ) : null}
        <Grid size={12}>
          <Controller
            name="active"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={Boolean(field.value)}
                    onChange={e => field.onChange(e.target.checked)}
                    disabled={isSubmitting}
                  />
                }
                label="Active"
              />
            )}
          />
          {errors.active?.message ? (
            <FormHelperText error>{errors.active.message}</FormHelperText>
          ) : null}
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <DoctorBranchSchedules branches={branches} disabled={isSubmitting} />
      </Box>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          sx={{ borderRadius: 2, minWidth: 160 }}
        >
          {isSubmitting ? <CircularProgress size={22} color="inherit" /> : submitLabel}
        </Button>
      </Box>
    </Box>
  );
}
