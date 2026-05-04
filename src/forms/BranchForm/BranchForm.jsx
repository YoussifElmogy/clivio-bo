import React from 'react';
import { Controller } from 'react-hook-form';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormGroup from '@mui/material/FormGroup';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';
import FormTextField from '../../components/FormTextField/FormTextField';
import PhoneNumberField from '../../components/PhoneNumberField/PhoneNumberField';
import { VACATION_DAY_OPTIONS } from '../../schemas/branchSchema';

const BRANCH_TIME_FIELDS = ['from_time', 'to_time'];

/** Revalidates both time fields so cross-field Yup rules run when either value changes. */
function mergeBranchTimeField(field, trigger) {
  if (!trigger) return field;
  const revalidate = () => {
    void trigger(BRANCH_TIME_FIELDS);
  };
  return {
    ...field,
    onChange: e => {
      field.onChange(e);
      revalidate();
    },
    onBlur: e => {
      field.onBlur(e);
      revalidate();
    },
  };
}

export default function BranchForm({
  control,
  errors,
  isSubmitting,
  handleSubmit,
  onSubmit,
  submitLabel = 'Create branch',
  trigger,
}) {
  return (
    <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2.5}>
        <Grid size={12}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <FormTextField
                field={field}
                id="branch-name"
                label="Name"
                required
                placeholder="Branch name"
                invalid={Boolean(errors.name)}
                errorMessage={errors.name?.message}
                disabled={isSubmitting}
              />
            )}
          />
        </Grid>
        <Grid size={12}>
          <PhoneNumberField
            control={control}
            countryCodeName="phone_country_code"
            numberName="phone"
            id="branch-phone"
            label="Phone"
            required
            placeholder="100 111 2233"
            disabled={isSubmitting}
            countryError={errors.phone_country_code}
            numberError={errors.phone}
          />
        </Grid>
        <Grid size={12}>
          <Controller
            name="address"
            control={control}
            render={({ field }) => (
              <FormTextField
                field={field}
                id="branch-address"
                label="Address"
                required
                placeholder="Street, city…"
                invalid={Boolean(errors.address)}
                errorMessage={errors.address?.message}
                disabled={isSubmitting}
                multiline
                minRows={3}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="from_time"
            control={control}
            render={({ field }) => (
              <FormTextField
                field={mergeBranchTimeField(field, trigger)}
                id="branch-from-time"
                type="time"
                label="From (time)"
                required
                invalid={Boolean(errors.from_time)}
                errorMessage={errors.from_time?.message}
                disabled={isSubmitting}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="to_time"
            control={control}
            render={({ field }) => (
              <FormTextField
                field={mergeBranchTimeField(field, trigger)}
                id="branch-to-time"
                type="time"
                label="To (time)"
                required
                invalid={Boolean(errors.to_time)}
                errorMessage={errors.to_time?.message}
                disabled={isSubmitting}
              />
            )}
          />
        </Grid>
        <Grid size={12}>
          <Controller
            name="vacation_days"
            control={control}
            render={({ field }) => {
              const selected = Array.isArray(field.value) ? field.value : [];
              const toggleDay = dayValue => {
                const next = new Set(selected);
                if (next.has(dayValue)) next.delete(dayValue);
                else next.add(dayValue);
                field.onChange([...next].sort((a, b) => a - b));
              };
              return (
                <FormControl
                  component="fieldset"
                  variant="standard"
                  fullWidth
                  error={Boolean(errors.vacation_days)}
                  disabled={isSubmitting}
                >
                  <FormLabel
                    component="legend"
                    error={Boolean(errors.vacation_days)}
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    Vacation days
                  </FormLabel>
                  <FormGroup>
                    <Grid container spacing={1} columnSpacing={2}>
                      {VACATION_DAY_OPTIONS.map(opt => (
                        <Grid key={opt.value} size={{ xs: 12, sm: 6, md: 4 }}>
                          <FormControlLabel
                            sx={{ mr: 0, alignItems: 'center' }}
                            control={
                              <Checkbox
                                id={`branch-vacation-${opt.value}`}
                                checked={selected.includes(opt.value)}
                                onChange={() => toggleDay(opt.value)}
                                onBlur={field.onBlur}
                                disabled={isSubmitting}
                                size="small"
                                color="primary"
                              />
                            }
                            label={opt.label}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </FormGroup>
                  {errors.vacation_days?.message ? (
                    <FormHelperText>{errors.vacation_days.message}</FormHelperText>
                  ) : (
                    <FormHelperText sx={{ mt: 1 }}>Select days the branch is closed.</FormHelperText>
                  )}
                </FormControl>
              );
            }}
          />
        </Grid>
        <Grid size={12}>
          <Controller
            name="active"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    id="branch-active"
                    checked={Boolean(field.value)}
                    onChange={e => field.onChange(e.target.checked)}
                    onBlur={field.onBlur}
                    disabled={isSubmitting}
                    color="primary"
                  />
                }
                label="Active"
                sx={{ ml: 0, alignItems: 'center', fontWeight: 600 }}
              />
            )}
          />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'flex-end', mt: 3 }}>
        <Button type="submit" variant="contained" size="large" disabled={isSubmitting} sx={{ minWidth: 160, py: 1.25 }}>
          {isSubmitting ? <CircularProgress size={24} color="inherit" /> : submitLabel}
        </Button>
      </Box>
    </Box>
  );
}
