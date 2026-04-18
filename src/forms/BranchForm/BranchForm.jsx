import React from 'react';
import { Controller } from 'react-hook-form';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';
import FormTextField from '../../components/FormTextField/FormTextField';

export default function BranchForm({
  control,
  errors,
  isSubmitting,
  handleSubmit,
  onSubmit,
  submitLabel = 'Create branch',
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
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <FormTextField
                field={field}
                id="branch-phone"
                label="Phone"
                required
                placeholder="+20 …"
                invalid={Boolean(errors.phone)}
                errorMessage={errors.phone?.message}
                disabled={isSubmitting}
              />
            )}
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
