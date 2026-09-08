import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Button from '@mui/material/Button';
import useApi from '../configs/useApi';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import BranchForm from '../forms/BranchForm/BranchForm';
import CustomLoader from '../components/CustomLoader/CustomLoader';
import { useToast } from '../context/ToastContext';
import { branchSchema, branchDefaultValues } from '../schemas/branchSchema';
import { buildBranchPayload } from '../payloads/branchPayload';
import { canAddMoreBranches, getBranchLimit } from '../config/packageFeatures';

/**
 * @returns {number}
 */
function parseBranchesTotal(data) {
  if (Array.isArray(data)) return data.length;
  if (data && typeof data === 'object') {
    for (const key of ['total', 'count', 'total_count', 'totalCount']) {
      const value = data[key];
      if (typeof value === 'number' && !Number.isNaN(value)) return value;
    }
    if (Array.isArray(data.results)) return data.results.length;
    if (Array.isArray(data.data)) return data.data.length;
    if (Array.isArray(data.branches)) return data.branches.length;
  }
  return 0;
}

export default function BranchCreatePage() {
  const navigate = useNavigate();
  const { get, post } = useApi();
  const { showSuccess, showError } = useToast();
  const branchLimit = getBranchLimit();
  const [limitCheck, setLimitCheck] = useState(
    branchLimit == null ? 'allowed' : 'checking'
  );

  useEffect(() => {
    if (branchLimit == null) {
      setLimitCheck('allowed');
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLimitCheck('checking');
      try {
        const data = await get('/branches?page=1&page_size=100');
        if (cancelled) return;
        const total = parseBranchesTotal(data);
        if (!canAddMoreBranches(total)) {
          showError(`Branch limit reached (${branchLimit}).`);
          navigate('/branches', { replace: true });
          setLimitCheck('blocked');
          return;
        }
        setLimitCheck('allowed');
      } catch (err) {
        if (cancelled) return;
        const msg =
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          'Could not verify branch limit.';
        showError(typeof msg === 'string' ? msg : 'Could not verify branch limit.');
        navigate('/branches', { replace: true });
        setLimitCheck('blocked');
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchLimit, navigate]);

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
      if (branchLimit != null) {
        const data = await get('/branches?page=1&page_size=100');
        const total = parseBranchesTotal(data);
        if (!canAddMoreBranches(total)) {
          showError(`Branch limit reached (${branchLimit}).`);
          navigate('/branches', { replace: true });
          return;
        }
      }
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

  if (limitCheck !== 'allowed') {
    return <CustomLoader active />;
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
