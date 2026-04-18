import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Button from '@mui/material/Button';
import useApi from '../configs/useApi';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import BranchForm from '../forms/BranchForm/BranchForm';
import BranchFormSkeleton from '../forms/BranchForm/BranchFormSkeleton';
import { useToast } from '../context/ToastContext';
import { branchSchema, branchDefaultValues } from '../schemas/branchSchema';
import { buildBranchPayload, mergeBranchFromApi } from '../payloads/branchPayload';

export default function BranchEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { get, patch } = useApi();
  const { showSuccess, showError } = useToast();
  const [loadingBranch, setLoadingBranch] = useState(true);

  const {
    control,
    handleSubmit,
    reset,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(branchSchema),
    defaultValues: branchDefaultValues,
    mode: 'onTouched',
  });

  useEffect(() => {
    if (!id) {
      showError('Missing branch id.');
      navigate('/branches', { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingBranch(true);
      try {
        const data = await get(`/branches/${id}`);
        if (!cancelled) {
          reset(mergeBranchFromApi(data));
        }
      } catch (err) {
        if (!cancelled) {
          const msg =
            err?.response?.data?.detail ||
            err?.response?.data?.message ||
            err?.message ||
            'Could not load branch.';
          showError(typeof msg === 'string' ? msg : 'Could not load branch.');
          navigate('/branches', { replace: true });
        }
      } finally {
        if (!cancelled) setLoadingBranch(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onSubmit = async values => {
    try {
      await patch(`/branches/${id}`, buildBranchPayload(values));
      showSuccess('Branch updated.');
      navigate('/branches', { replace: false });
    } catch (err) {
      const msg =
        (typeof err === 'object' && err !== null && err.error) ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not update branch.';
      showError(typeof msg === 'string' ? msg : 'Could not update branch.');
    }
  };

  return (
    <FormPageShell
      title="Edit branch"
      description="Update branch details and status."
      headerAction={
        <Button variant="outlined" onClick={() => navigate('/branches')} sx={{ borderRadius: 2 }}>
          Back to list
        </Button>
      }
      maxWidth="md"
    >
      {loadingBranch ? (
        <BranchFormSkeleton />
      ) : (
        <BranchForm
          control={control}
          errors={errors}
          isSubmitting={isSubmitting}
          handleSubmit={handleSubmit}
          onSubmit={onSubmit}
          submitLabel="Save changes"
          trigger={trigger}
        />
      )}
    </FormPageShell>
  );
}
