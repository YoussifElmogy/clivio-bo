import React from 'react';
import { Controller } from 'react-hook-form';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { RESERVATION_STATUS_OPTIONS } from '../../constants/reservationStatus';

export default function ReservationStatusField({ control }) {
  return (
    <Controller
      name="status"
      control={control}
      render={({ field, fieldState }) => (
        <Stack spacing={1.25} sx={{ flex: 1, minWidth: 0 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.35, flexWrap: 'wrap' }}>
              <Typography
                variant="subtitle1"
                component="span"
                sx={{ fontWeight: 600, letterSpacing: '-0.03em', fontSize: '1.05rem' }}
              >
                Status
              </Typography>
              <Typography
                component="span"
                color="error"
                sx={{ fontWeight: 700, fontSize: '1.1rem', lineHeight: 1 }}
                aria-hidden
              >
                *
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.7 }}>
              Current state of this reservation in the workflow.
            </Typography>
          </Box>
          <FormControl fullWidth required error={Boolean(fieldState.error)} variant="outlined">
            <Select
              {...field}
              id="reservation-field-status"
              displayEmpty
              value={field.value ?? ''}
              slotProps={{
                input: { notched: false },
              }}
              renderValue={selected => {
                if (selected === '' || selected == null) {
                  return (
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Select status
                    </Typography>
                  );
                }
                const opt = RESERVATION_STATUS_OPTIONS.find(o => o.value === selected);
                return opt?.label ?? selected;
              }}
              sx={{ borderRadius: 2 }}
            >
              {RESERVATION_STATUS_OPTIONS.map(o => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
            {fieldState.error?.message ? <FormHelperText error>{fieldState.error.message}</FormHelperText> : null}
          </FormControl>
        </Stack>
      )}
    />
  );
}
