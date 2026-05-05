import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Button from '@mui/material/Button';
import useApi from '../configs/useApi';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import AreaPackageForm from '../forms/AreaPackageForm/AreaPackageForm';
import { useToast } from '../context/ToastContext';
import { areaPackageDefaultValues, areaPackageSchema } from '../schemas/areaPackageSchema';
import { buildAreaPackagePayload } from '../payloads/areaPackagePayload';

export default function AreaPackageCreatePage() {
  const navigate = useNavigate();
  const { post } = useApi();
  const { showSuccess, showError } = useToast();

  const resolver = useMemo(
    () => (values, context, options) => yupResolver(areaPackageSchema)(values, context, options),
    []
  );

  const methods = useForm({
    resolver,
    defaultValues: areaPackageDefaultValues,
    mode: 'onTouched',
  });

  const onSubmit = async values => {
    try {
      await post('/area-packages', buildAreaPackagePayload(values));
      showSuccess('Area package created.');
      navigate('/laser?tab=area', { replace: false });
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not create area package.';
      showError(typeof msg === 'string' ? msg : 'Could not create area package.');
    }
  };

  return (
    <FormPageShell
      title="Add area package"
      description="Define name and price for a laser area package."
      headerAction={
        <Button variant="outlined" onClick={() => navigate('/laser?tab=area')} sx={{ borderRadius: 2 }}>
          Back to Laser
        </Button>
      }
      maxWidth="md"
    >
      <FormProvider {...methods}>
        <AreaPackageForm onSubmit={onSubmit} submitLabel="Create package" />
      </FormProvider>
    </FormPageShell>
  );
}
