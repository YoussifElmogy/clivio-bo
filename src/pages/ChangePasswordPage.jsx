import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import useApi from '../configs/useApi';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import ChangePasswordForm from '../forms/ChangePasswordForm/ChangePasswordForm';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/**
 * Voluntary password change from the menu (authenticated users).
 */
export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { post } = useApi();
  const { updateUser, user } = useAuth();
  const { showError, showSuccess } = useToast();

  const onSubmit = async values => {
    try {
      await post('/auth/change-password', {
        password: values.password.trim(),
        confirm_password: values.confirm_password.trim(),
      });
      if (user?.mustChangePassword) {
        updateUser({ mustChangePassword: false });
      }
      showSuccess('Password updated.');
      navigate(-1);
    } catch (err) {
      const msg =
        (typeof err === 'object' && err !== null && err.error) ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not update password.';
      showError(typeof msg === 'string' ? msg : 'Could not update password.');
    }
  };

  return (
    <FormPageShell
      title="Change password"
      description="Set a new password for your account."
      headerAction={
        <Button variant="outlined" onClick={() => navigate(-1)} sx={{ borderRadius: 2 }}>
          Back
        </Button>
      }
      maxWidth="sm"
    >
      <ChangePasswordForm onSubmit={onSubmit} submitLabel="Update password" />
    </FormPageShell>
  );
}
