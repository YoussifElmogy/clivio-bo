import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Button from '@mui/material/Button';
import useApi from '../configs/useApi';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import GeneralServiceForm from '../forms/GeneralServiceForm/GeneralServiceForm';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { generalServiceDefaultValues, generalServiceSchema } from '../schemas/generalServiceSchema';
import { buildGeneralServicePayload } from '../payloads/generalServicePayload';

export default function GeneralServiceCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { post } = useApi();
  const { showSuccess, showError } = useToast();

  const resolver = useMemo(
    () => (values, context, options) => yupResolver(generalServiceSchema)(values, context, options),
    []
  );

  const methods = useForm({
    resolver,
    defaultValues: {
      ...generalServiceDefaultValues,
      doctor: user?.id != null ? Number(user.id) : '',
    },
    mode: 'onTouched',
  });

  const onSubmit = async values => {
    try {
      await post('/general-services', buildGeneralServicePayload(values));
      showSuccess('General service created.');
      navigate('/general-services', { replace: false });
    } catch (err) {
      const msg =
        err?.detail ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not create general service.';
      showError(typeof msg === 'string' ? msg : 'Could not create general service.');
    }
  };

  return (
    <FormPageShell
      title="Add general service"
      description="Create a named service with a price for your practice."
      headerAction={
        <Button variant="outlined" onClick={() => navigate('/general-services')} sx={{ borderRadius: 2 }}>
          Back to list
        </Button>
      }
      maxWidth="md"
    >
      <FormProvider {...methods}>
        <GeneralServiceForm onSubmit={onSubmit} submitLabel="Create service" />
      </FormProvider>
    </FormPageShell>
  );
}
