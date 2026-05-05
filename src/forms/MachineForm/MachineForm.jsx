import React, { useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { alpha, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import FormFieldLabel from '../../components/FormFieldLabel/FormFieldLabel';
import FormTextField from '../../components/FormTextField/FormTextField';
import { useToast } from '../../context/ToastContext';
import { MACHINE_TYPE_OPTIONS, machinePriceFieldLabel } from '../../schemas/machineSchema';

const MACHINE_MAINTENANCE_DATE_FIELD_ID = 'machine-latest-maintenance-date';

/** Same interaction pattern as patient date of birth (read-only field + calendar). */
function MachineLatestMaintenanceDatePicker({ disabled }) {
  const theme = useTheme();
  const { control } = useFormContext();
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <Controller
      name="latest_maintenance_date"
      control={control}
      render={({ field, fieldState }) => (
        <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
          <FormLabel
            htmlFor={MACHINE_MAINTENANCE_DATE_FIELD_ID}
            error={Boolean(fieldState.error)}
            sx={{ fontWeight: 600, fontSize: '0.875rem' }}
          >
            Latest maintenance date
          </FormLabel>
          <DatePicker
            open={pickerOpen}
            onOpen={() => setPickerOpen(true)}
            onClose={() => setPickerOpen(false)}
            value={field.value ? dayjs(field.value) : null}
            onChange={v => {
              field.onChange(v && dayjs(v).isValid() ? dayjs(v).format('YYYY-MM-DD') : '');
            }}
            format="D/M/YYYY"
            disabled={disabled}
            slotProps={{
              textField: {
                id: MACHINE_MAINTENANCE_DATE_FIELD_ID,
                fullWidth: true,
                readOnly: true,
                error: Boolean(fieldState.error),
                helperText: fieldState.error?.message || 'Optional',
                placeholder: 'e.g. 15/4/2026',
                name: field.name,
                inputRef: field.ref,
                onBlur: field.onBlur,
                onClick: () => setPickerOpen(true),
                onPaste: e => e.preventDefault(),
                onKeyDown: e => {
                  if (e.key === 'Tab' || e.key === 'Escape') return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setPickerOpen(true);
                    return;
                  }
                  e.preventDefault();
                },
                inputProps: {
                  'aria-label': 'Latest maintenance date',
                  readOnly: true,
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
                'aria-label': 'Open latest maintenance date calendar',
                onClick: e => {
                  e.stopPropagation();
                  setPickerOpen(true);
                },
              },
            }}
          />
        </Stack>
      )}
    />
  );
}

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

        <Grid size={{ xs: 12, sm: 6 }}>
          <MachineLatestMaintenanceDatePicker disabled={isSubmitting} />
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
