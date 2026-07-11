import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import useApi from '../configs/useApi';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import BranchForm from '../forms/BranchForm/BranchForm';
import { useToast } from '../context/ToastContext';
import { branchSchema, branchDefaultValues } from '../schemas/branchSchema';
import { buildBranchPayload } from '../payloads/branchPayload';
import { canAddMoreBranches, getBranchLimit } from '../config/packageFeatures';

function parseBranchCount(data) {
  if (Array.isArray(data)) return data.length;
  if (data && typeof data === 'object') {
    if (typeof data.total === 'number' && !Number.isNaN(data.total)) return data.total;
    if (typeof data.count === 'number' && !Number.isNaN(data.count)) return data.count;
    if (Array.isArray(data.results)) return data.results.length;
    if (Array.isArray(data.branches)) return data.branches.length;
    if (Array.isArray(data.data)) return data.data.length;
  }
  return 0;
}

export default function BranchCreatePage() {
  const navigate = useNavigate();
  const { get, post } = useApi();
  const { showSuccess, showError } = useToast();
  const [limitCheckLoading, setLimitCheckLoading] = useState(true);

  const branchLimit = getBranchLimit();

  useEffect(() => {
    if (branchLimit == null) {
      setLimitCheckLoading(false);
      return undefined;
    }

    let cancelled = false;
    (async () => {
      try {
        const data = await get('/branches?page=1&page_size=1');
        if (cancelled) return;
        const count = parseBranchCount(data);
        if (!canAddMoreBranches(count)) {
          showError(`Branch limit reached (${branchLimit}).`);
          navigate('/branches', { replace: true });
        }
      } catch {
        // Allow form if count check fails; server may still reject create.
      } finally {
        if (!cancelled) setLimitCheckLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [branchLimit, get, navigate, showError]);

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

  if (limitCheckLoading) {
    return (
      <FormPageShell title="Add branch" maxWidth="md">
        <Typography variant="body2" color="text.secondary">
          Checking branch limit…
        </Typography>
      </FormPageShell>
    );
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
