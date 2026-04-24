import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Button from '@mui/material/Button';
import useApi from '../configs/useApi';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import ServiceForm from '../forms/ServiceForm/ServiceForm';
import { useToast } from '../context/ToastContext';
import { serviceDefaultValues, serviceSchema } from '../schemas/serviceSchema';
import { buildServicePayload } from '../payloads/servicePayload';

export default function ServiceCreatePage() {
  const navigate = useNavigate();
  const { post } = useApi();
  const { showSuccess, showError } = useToast();

  const resolver = useMemo(
    () => (values, context, options) => yupResolver(serviceSchema)(values, context, options),
    []
  );

  const methods = useForm({
    resolver,
    defaultValues: serviceDefaultValues,
    mode: 'onTouched',
  });

  const onSubmit = async values => {
    try {
      await post('/services', buildServicePayload(values));
      showSuccess('Service created.');
      navigate('/services', { replace: false });
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not create service.';
      showError(typeof msg === 'string' ? msg : 'Could not create service.');
    }
  };

  return (
    <FormPageShell
      title="Add service"
      description="Create a clinic service."
      headerAction={
        <Button variant="outlined" onClick={() => navigate('/services')} sx={{ borderRadius: 2 }}>
          Back to list
        </Button>
      }
      maxWidth="md"
    >
      <FormProvider {...methods}>
        <ServiceForm onSubmit={onSubmit} submitLabel="Create service" />
      </FormProvider>
    </FormPageShell>
  );
}
