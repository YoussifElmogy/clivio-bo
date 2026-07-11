import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Button from '@mui/material/Button';
import useApi from '../configs/useApi';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import BranchForm from '../forms/BranchForm/BranchForm';
import { useToast } from '../context/ToastContext';
import { branchSchema, branchDefaultValues } from '../schemas/branchSchema';
import { buildBranchPayload } from '../payloads/branchPayload';
import { canAddMoreBranches, getBranchLimit } from '../config/packageFeatures';

export default function BranchCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { post } = useApi();
  const { showSuccess, showError } = useToast();

  const branchLimit = getBranchLimit();
  const fromBranchesList = location.state?.fromBranchesList === true;
  const branchCount = location.state?.branchCount;

  const blockedReason =
    branchLimit != null && !fromBranchesList
      ? 'direct'
      : branchLimit != null &&
          typeof branchCount === 'number' &&
          !canAddMoreBranches(branchCount)
        ? 'limit'
        : null;

  useEffect(() => {
    if (blockedReason === 'direct') {
      navigate('/branches', { replace: true });
      return;
    }
    if (blockedReason === 'limit') {
      showError(`Branch limit reached (${branchLimit}).`);
      navigate('/branches', { replace: true });
    }
  }, [blockedReason, branchLimit, navigate, showError]);

  const {
    control,
    handleSubmit,
    trigger,
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

  if (blockedReason) {
    return null;
  }

  return (
    <FormPageShell
      title="Add branch"
      description={
        branchLimit != null
          ? `Create a new clinic branch (limit: ${branchLimit}). You can change active status anytime after creation.`
          : 'Create a new clinic branch. You can change active status anytime after creation.'
      }
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
        trigger={trigger}
      />
    </FormPageShell>
  );
}
