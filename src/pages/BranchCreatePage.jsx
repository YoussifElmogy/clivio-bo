import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Button from '@mui/material/Button';
import useApi from '../configs/useApi';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import BranchForm from '../forms/BranchForm/BranchForm';
import { useToast } from '../context/ToastContext';
import { branchSchema, branchDefaultValues } from '../schemas/branchSchema';
import { buildBranchPayload } from '../payloads/branchPayload';

export default function BranchCreatePage() {
  const navigate = useNavigate();
  const { post } = useApi();
  const { showSuccess, showError } = useToast();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(branchSchema),
    defaultValues: branchDefaultValues,
    mode: 'onTouched',
  });

  const onSubmit = async values => {
    try {
      await post('/branches', buildBranchPayload(values));
      showSuccess('Branch created.');
      navigate('/branches', { replace: false });
    } catch (err) {
      const msg =
        (typeof err === 'object' && err !== null && err.error) ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not create branch.';
      showError(typeof msg === 'string' ? msg : 'Could not create branch.');
    }
  };

  return (
    <FormPageShell
      title="Add branch"
      description="Create a new clinic branch. You can change active status anytime after creation."
      headerAction={
        <Button variant="outlined" onClick={() => navigate('/branches')} sx={{ borderRadius: 2 }}>
          Back to list
        </Button>
      }
      maxWidth="md"
    >
      <BranchForm
        control={control}
        errors={errors}
        isSubmitting={isSubmitting}
        handleSubmit={handleSubmit}
        onSubmit={onSubmit}
        submitLabel="Create branch"
      />
    </FormPageShell>
  );
}
