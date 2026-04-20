import React, { useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import SecurityOutlined from '@mui/icons-material/SecurityOutlined';
import FormFieldLabel from '../../components/FormFieldLabel/FormFieldLabel';
import FormTextField from '../../components/FormTextField/FormTextField';
import AssistantFormSkeleton from './AssistantFormSkeleton';
import { useToast } from '../../context/ToastContext';

export default function AssistantForm({
  branches,
  roles,
  isLoading = false,
  isEdit = false,
  onSubmit,
  submitLabel = 'Create assistant',
}) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useFormContext();
  const { showError: showValidationToast } = useToast();

  if (isLoading) {
    return <AssistantFormSkeleton />;
  }

  const noBranches = !Array.isArray(branches) || branches.length === 0;
  const noRoles = !Array.isArray(roles) || roles.length === 0;

  const allRoleIds = useMemo(
    () =>
      roles
        .map(r => Number(r.id))
        .filter(n => !Number.isNaN(n))
        .sort((a, b) => a - b),
    [roles]
  );

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit(onSubmit, () =>
        showValidationToast('Please fix the errors highlighted below.')
      )}
    >
      {noBranches ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No branches found. Create a branch first, then add assistants.
        </Alert>
      ) : null}
      {noRoles ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No permission roles loaded. Check that GET /assistant-roles is available.
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
                id="assistant-name"
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
                id="assistant-email"
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
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <FormTextField
                field={field}
                id="assistant-phone"
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
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="branch_id"
            control={control}
            render={({ field, fieldState }) => (
              <Box>
                <FormFieldLabel htmlFor="assistant-branch" required>
                  Branch
                </FormFieldLabel>
                <FormControl fullWidth error={Boolean(fieldState.error)} variant="outlined">
                  <Select
                    id="assistant-branch"
                    displayEmpty
                    value={field.value === '' || field.value === undefined ? '' : field.value}
                    onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                    disabled={isSubmitting || noBranches}
                    inputProps={{ 'aria-label': 'Branch' }}
                    renderValue={selected => {
                      if (selected === '' || selected === undefined) {
                        return (
                          <Typography component="span" color="text.secondary" sx={{ opacity: 0.65 }}>
                            Select branch
                          </Typography>
                        );
                      }
                      const b = branches.find(x => Number(x.id) === Number(selected));
                      return b?.name?.trim() || `Branch #${selected}`;
                    }}
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderRadius: 2,
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>Select branch</em>
                    </MenuItem>
                    {branches.map(b => (
                      <MenuItem key={b.id} value={Number(b.id)}>
                        {b.name?.trim() || `Branch #${b.id}`}
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
        </Grid>
      </Grid>

      <Paper
        variant="outlined"
        sx={{
          mt: 3,
          p: { xs: 2, sm: 2.5 },
          borderRadius: 2,
          borderColor: 'divider',
          bgcolor: theme => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'grey.50'),
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <SecurityOutlined color="primary" sx={{ fontSize: 26 }} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Permissions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Choose what this assistant can do. Each option maps to a role on the server.
            </Typography>
          </Box>
        </Box>

        <Controller
          name="role_ids"
          control={control}
          render={({ field }) => {
            const current = Array.isArray(field.value) ? field.value : [];
            const allSelected =
              allRoleIds.length > 0 && allRoleIds.every(rid => current.includes(rid));
            const someSelected = current.length > 0;
            const selectAllIndeterminate = someSelected && !allSelected;

            const toggleSelectAll = () => {
              if (allSelected) {
                field.onChange([]);
              } else {
                field.onChange([...allRoleIds]);
              }
            };

            return (
              <FormControl variant="standard" error={Boolean(errors.role_ids)} fullWidth>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    mb: 1.5,
                    flexWrap: 'wrap',
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Role access
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={allSelected}
                        indeterminate={selectAllIndeterminate}
                        disabled={isSubmitting || noRoles || allRoleIds.length === 0}
                        onChange={toggleSelectAll}
                        inputProps={{ 'aria-label': 'Select all permissions' }}
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Select all
                      </Typography>
                    }
                    sx={{ m: 0, alignItems: 'center' }}
                  />
                </Box>
                <Box
                  sx={{
                    maxHeight: { xs: 360, sm: 420 },
                    overflowY: 'auto',
                    pr: 1,
                    mr: -0.5,
                  }}
                >
                  <Grid container spacing={1} alignItems="center">
                    {roles.map(role => {
                      const id = Number(role.id);
                      const checked = current.includes(id);
                      return (
                        <Grid key={role.id} size={{ xs: 12, sm: 6, md: 4 }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={checked}
                                disabled={isSubmitting || noRoles}
                                onChange={e => {
                                  const next = [...current];
                                  if (e.target.checked) {
                                    if (!next.includes(id)) next.push(id);
                                  } else {
                                    const idx = next.indexOf(id);
                                    if (idx !== -1) next.splice(idx, 1);
                                  }
                                  field.onChange(next.sort((a, b) => a - b));
                                }}
                              />
                            }
                            label={
                              <Typography variant="body2" component="span" sx={{ lineHeight: 1.35 }}>
                                {role.role_display ?? role.role_name ?? `Role #${id}`}
                              </Typography>
                            }
                            sx={{
                              alignItems: 'center',
                              m: 0,
                              py: 1,
                              px: 1.25,
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: checked ? 'primary.main' : 'divider',
                              bgcolor: 'background.paper',
                              width: '100%',
                              minHeight: 48,
                              '&:hover': { borderColor: 'primary.light' },
                            }}
                          />
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
                {errors.role_ids?.message ? (
                  <FormHelperText sx={{ mt: 1.5 }}>{errors.role_ids.message}</FormHelperText>
                ) : (
                  <FormHelperText sx={{ mt: 1.5 }}>
                    Select one or more permissions for this assistant, or use Select all.
                  </FormHelperText>
                )}
              </FormControl>
            );
          }}
        />
      </Paper>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting || noBranches || noRoles}
          sx={{ borderRadius: 2, minWidth: 180 }}
        >
          {isSubmitting ? <CircularProgress size={22} color="inherit" /> : submitLabel}
        </Button>
      </Box>
    </Box>
  );
}
