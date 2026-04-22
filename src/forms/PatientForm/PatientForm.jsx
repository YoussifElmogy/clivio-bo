import React, { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { alpha, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormLabel from '@mui/material/FormLabel';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import FormTextField from '../../components/FormTextField/FormTextField';
import PatientFormSkeleton from './PatientFormSkeleton';
import { useToast } from '../../context/ToastContext';

const DOB_FIELD_ID = 'patient-dob';

function PatientDateOfBirthPicker({ disabled }) {
  const theme = useTheme();
  const { control } = useFormContext();
  const [dobPickerOpen, setDobPickerOpen] = useState(false);

  return (
    <Controller
      name="date_of_birth"
      control={control}
      render={({ field, fieldState }) => (
        <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
          <FormLabel
            htmlFor={DOB_FIELD_ID}
            required
            error={Boolean(fieldState.error)}
            sx={{ fontWeight: 600, fontSize: '0.875rem' }}
          >
            Date of birth
          </FormLabel>
          <DatePicker
            open={dobPickerOpen}
            onOpen={() => setDobPickerOpen(true)}
            onClose={() => setDobPickerOpen(false)}
            value={field.value ? dayjs(field.value) : null}
            onChange={v => {
              field.onChange(v && dayjs(v).isValid() ? dayjs(v).format('YYYY-MM-DD') : '');
            }}
            maxDate={dayjs().startOf('day')}
            format="D/M/YYYY"
            disabled={disabled}
            slotProps={{
              textField: {
                id: DOB_FIELD_ID,
                fullWidth: true,
                readOnly: true,
                error: Boolean(fieldState.error),
                helperText: fieldState.error?.message,
                placeholder: 'e.g. 20/5/1999',
                autoComplete: 'bday',
                name: field.name,
                inputRef: field.ref,
                onBlur: field.onBlur,
                onClick: () => setDobPickerOpen(true),
                onPaste: e => e.preventDefault(),
                onKeyDown: e => {
                  if (e.key === 'Tab' || e.key === 'Escape') return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setDobPickerOpen(true);
                    return;
                  }
                  e.preventDefault();
                },
                inputProps: {
                  'aria-label': 'Date of birth',
                  readOnly: true,
                  autoComplete: 'bday',
                  inputMode: 'none',
                },
                sx: {
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.background.paper, 0.85),
                    cursor: disabled ? 'default' : 'pointer',
                  },
                  '& .MuiInputBase-input': {
                    cursor: disabled ? 'default' : 'pointer',
                    caretColor: 'transparent',
                  },
                },
              },
              openPickerButton: {
                'aria-label': 'Open date of birth calendar',
                onClick: e => {
                  e.stopPropagation();
                  setDobPickerOpen(true);
                },
              },
            }}
          />
        </Stack>
      )}
    />
  );
}

export default function PatientForm({ onSubmit, submitLabel = 'Save patient', isLoading = false }) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useFormContext();
  const { showError: showValidationToast } = useToast();

  if (isLoading) {
    return <PatientFormSkeleton />;
  }

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
            name="first_name"
            control={control}
            render={({ field }) => (
              <FormTextField
                field={field}
                id="patient-first-name"
                label="First name"
                required
                placeholder="e.g. Ahmed"
                invalid={Boolean(errors.first_name)}
                errorMessage={errors.first_name?.message}
                disabled={isSubmitting}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="last_name"
            control={control}
            render={({ field }) => (
              <FormTextField
                field={field}
                id="patient-last-name"
                label="Last name"
                required
                placeholder="e.g. Sami"
                invalid={Boolean(errors.last_name)}
                errorMessage={errors.last_name?.message}
                disabled={isSubmitting}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="mobile_number"
            control={control}
            render={({ field }) => (
              <FormTextField
                field={field}
                id="patient-mobile"
                label="Mobile number"
                required
                placeholder="+20 100 111 2233"
                invalid={Boolean(errors.mobile_number)}
                errorMessage={errors.mobile_number?.message}
                disabled={isSubmitting}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <PatientDateOfBirthPicker disabled={isSubmitting} />
        </Grid>
        <Grid size={12}>
          <Controller
            name="medical_notes"
            control={control}
            render={({ field }) => (
              <FormTextField
                field={field}
                id="patient-medical-notes"
                label="Medical notes"
                placeholder="Optional"
                invalid={Boolean(errors.medical_notes)}
                errorMessage={errors.medical_notes?.message}
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
