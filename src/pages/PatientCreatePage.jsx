import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Button from '@mui/material/Button';
import useApi from '../configs/useApi';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import PatientForm from '../forms/PatientForm/PatientForm';
import { useToast } from '../context/ToastContext';
import { patientSchema, patientDefaultValues } from '../schemas/patientSchema';
import { buildPatientCreatePayload } from '../payloads/patientPayload';

export default function PatientCreatePage() {
  const navigate = useNavigate();
  const { post } = useApi();
  const { showSuccess, showError } = useToast();

  const resolver = useMemo(
    () => (values, context, options) => yupResolver(patientSchema)(values, context, options),
    []
  );

  const methods = useForm({
    resolver,
    defaultValues: patientDefaultValues,
    mode: 'onTouched',
  });

  const onSubmit = async values => {
    try {
      await post('/patients', buildPatientCreatePayload(values));
      showSuccess('Patient created.');
      navigate('/patients', { replace: false });
    } catch (err) {
      const msg =
        err?.detail ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not create patient.';
      showError(typeof msg === 'string' ? msg : 'Could not create patient.');
    }
  };

  return (
    <FormPageShell
      title="Add patient"
      description="Register a patient with contact details and optional medical notes."
      headerAction={
        <Button variant="outlined" onClick={() => navigate('/patients')} sx={{ borderRadius: 2 }}>
          Back to list
        </Button>
      }
      maxWidth="md"
    >
      <FormProvider {...methods}>
        <PatientForm onSubmit={onSubmit} submitLabel="Create patient" />
      </FormProvider>
    </FormPageShell>
  );
}
