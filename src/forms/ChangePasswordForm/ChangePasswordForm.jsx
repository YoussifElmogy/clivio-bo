import React, { useMemo } from 'react';
import { FormProvider, useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormTextField from '../../components/FormTextField/FormTextField';
import { useToast } from '../../context/ToastContext';
import {
  changePasswordFormDefaultValues,
  changePasswordFormSchema,
} from '../../schemas/changePasswordSchema';

export default function ChangePasswordForm({
  onSubmit,
  submitLabel = 'Save password',
  disabled = false,
}) {
  const { showError: showValidationToast } = useToast();
  const resolver = useMemo(
    () => (vals, ctx, opts) => yupResolver(changePasswordFormSchema)(vals, ctx, opts),
    []
  );

  const methods = useForm({
    resolver,
    defaultValues: changePasswordFormDefaultValues,
    mode: 'onTouched',
  });

  const { handleSubmit, formState, control } = methods;
  const { isSubmitting, errors } = formState;

  return (
    <FormProvider {...methods}>
      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit(onSubmit, () =>
          showValidationToast('Please fix the errors highlighted below.')
        )}
        sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
      >
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <FormTextField
              field={field}
              id="change-password-new"
              label="New password"
              required
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              invalid={Boolean(errors.password)}
              errorMessage={errors.password?.message}
              disabled={isSubmitting || disabled}
            />
          )}
        />
        <Controller
          name="confirm_password"
          control={control}
          render={({ field }) => (
            <FormTextField
              field={field}
              id="change-password-confirm"
              label="Confirm password"
              required
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter new password"
              invalid={Boolean(errors.confirm_password)}
              errorMessage={errors.confirm_password?.message}
              disabled={isSubmitting || disabled}
            />
          )}
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={isSubmitting || disabled}
          sx={{ mt: 1, borderRadius: 2, py: 1.25, fontWeight: 700 }}
        >
          {isSubmitting ? <CircularProgress size={24} color="inherit" /> : submitLabel}
        </Button>
      </Box>
    </FormProvider>
  );
}
