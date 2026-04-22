import React from 'react';
import { Controller } from 'react-hook-form';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export default function DoctorSelectField({ control, doctors, loading, branchSelected }) {
  const list = doctors || [];

  return (
    <Controller
      name="doctorId"
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
                Doctor
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
              Who will see the patient at this branch.
            </Typography>
          </Box>
          <FormControl fullWidth required error={Boolean(fieldState.error)} variant="outlined">
            <Select
              {...field}
              id="registration-field-doctorId"
              displayEmpty
              disabled={!branchSelected || loading}
              value={field.value ?? ''}
              slotProps={{
                input: { notched: false },
              }}
              renderValue={selected => {
                if (selected === '' || selected == null) {
                  return (
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 400 }}>
                      Select doctor
                    </Typography>
                  );
                }
                const d = list.find(x => String(x.id) === String(selected));
                return d?.name?.trim() || d?.email || `Doctor #${selected}`;
              }}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">
                <em>Select doctor</em>
              </MenuItem>
              {list.map(d => (
                <MenuItem key={d.id} value={String(d.id)}>
                  {d.name?.trim() || d.email || `Doctor #${d.id}`}
                </MenuItem>
              ))}
            </Select>
            {loading ? (
              <FormHelperText sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={14} />
                Loading doctors…
              </FormHelperText>
            ) : null}
            {fieldState.error?.message ? <FormHelperText error>{fieldState.error.message}</FormHelperText> : null}
          </FormControl>
        </Stack>
      )}
    />
  );
}
