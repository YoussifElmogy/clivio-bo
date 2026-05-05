import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Button from '@mui/material/Button';
import useApi from '../configs/useApi';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import PulsePackageForm from '../forms/PulsePackageForm/PulsePackageForm';
import { useToast } from '../context/ToastContext';
import { pulsePackageDefaultValues, pulsePackageSchema } from '../schemas/pulsePackageSchema';
import { buildPulsePackagePayload } from '../payloads/pulsePackagePayload';

export default function PulsePackageCreatePage() {
  const navigate = useNavigate();
  const { post } = useApi();
  const { showSuccess, showError } = useToast();

  const resolver = useMemo(
    () => (values, context, options) => yupResolver(pulsePackageSchema)(values, context, options),
    []
  );

  const methods = useForm({
    resolver,
    defaultValues: pulsePackageDefaultValues,
    mode: 'onTouched',
  });

  const onSubmit = async values => {
    try {
      await post('/pulse-packages', buildPulsePackagePayload(values));
      showSuccess('Pulse package created.');
      navigate('/laser?tab=pulse', { replace: false });
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not create pulse package.';
      showError(typeof msg === 'string' ? msg : 'Could not create pulse package.');
    }
  };

  return (
    <FormPageShell
      title="Add pulse package"
      description="Define pulses count and price for a laser pulse package."
      headerAction={
        <Button variant="outlined" onClick={() => navigate('/laser?tab=pulse')} sx={{ borderRadius: 2 }}>
          Back to Laser
        </Button>
      }
      maxWidth="md"
    >
      <FormProvider {...methods}>
        <PulsePackageForm onSubmit={onSubmit} submitLabel="Create package" />
      </FormProvider>
    </FormPageShell>
  );
}
