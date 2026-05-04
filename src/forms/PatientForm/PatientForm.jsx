import React, { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { alpha, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormLabel from '@mui/material/FormLabel';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import PersonOutlined from '@mui/icons-material/PersonOutlined';
import PersonAddAltOutlined from '@mui/icons-material/PersonAddAltOutlined';
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

export default function PatientForm({
  onSubmit,
  submitLabel = 'Save patient',
  isLoading = false,
  showBookingContext = false,
}) {
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
        {showBookingContext ? (
          <Grid size={12}>
            <Controller
              name="is_for_self"
              control={control}
              render={({ field }) => (
                <Paper
                  elevation={0}
                  variant="outlined"
                  sx={{
                    p: { xs: 2, sm: 2.5 },
                    borderRadius: 2,
                    borderColor: 'divider',
                    bgcolor: theme => alpha(theme.palette.primary.main, 0.04),
                    backgroundImage: theme =>
                      `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, transparent 55%)`,
                  }}
                >
                  <Stack spacing={1.5}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
                        Who is this patient?
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, maxWidth: 520 }}>
                        Choose before entering details. This tells the clinic whether the profile is for you or
                        for another person you are helping register.
                      </Typography>
                    </Box>
                    <ToggleButtonGroup
                      exclusive
                      fullWidth
                      value={field.value ? 'self' : 'other'}
                      onChange={(_, next) => {
                        if (next !== null) field.onChange(next === 'self');
                      }}
                      disabled={isSubmitting}
                      aria-label="Patient is for self or someone else"
                      sx={{
                        p: 0.5,
                        gap: 0.75,
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        flexWrap: { xs: 'wrap', sm: 'nowrap' },
                        '& .MuiToggleButtonGroup-grouped': {
                          flex: { xs: '1 1 100%', sm: 1 },
                          border: 0,
                          borderRadius: '10px !important',
                          py: 1.75,
                          px: 1.5,
                          textTransform: 'none',
                          transition: theme =>
                            theme.transitions.create(['background-color', 'box-shadow', 'color'], {
                              duration: theme.transitions.duration.short,
                            }),
                          '&.Mui-selected': {
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            boxShadow: 2,
                            '&:hover': { bgcolor: 'primary.dark' },
                            '& .MuiTypography-root': { color: 'inherit' },
                            '& .MuiTypography-root.MuiTypography-caption': {
                              color: 'primary.contrastText',
                              opacity: 0.92,
                            },
                          },
                          '&:not(.Mui-selected)': {
                            bgcolor: 'transparent',
                            '&:hover': { bgcolor: 'action.hover' },
                          },
                        },
                      }}
                    >
                      <ToggleButton value="self" aria-pressed={field.value === true}>
                        <Stack
                          direction="row"
                          spacing={1.25}
                          alignItems="center"
                          justifyContent="flex-start"
                          sx={{ width: '100%', textAlign: 'left' }}
                        >
                          <PersonOutlined sx={{ fontSize: 28, flexShrink: 0, opacity: 0.95 }} />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
                              For myself
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                              I am the patient
                            </Typography>
                          </Box>
                        </Stack>
                      </ToggleButton>
                      <ToggleButton value="other" aria-pressed={field.value === false}>
                        <Stack
                          direction="row"
                          spacing={1.25}
                          alignItems="center"
                          justifyContent="flex-start"
                          sx={{ width: '100%', textAlign: 'left' }}
                        >
                          <PersonAddAltOutlined sx={{ fontSize: 28, flexShrink: 0, opacity: 0.95 }} />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
                              For someone else
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                              Family, friend, or client
                            </Typography>
                          </Box>
                        </Stack>
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Stack>
                </Paper>
              )}
            />
          </Grid>
        ) : null}
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
