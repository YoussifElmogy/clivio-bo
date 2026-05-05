import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import useApi from '../configs/useApi';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import MachineForm from '../forms/MachineForm/MachineForm';
import { useToast } from '../context/ToastContext';
import { machineDefaultValues, machineSchema } from '../schemas/machineSchema';
import { buildMachinePayload } from '../payloads/machinePayload';
import { parsePaginatedList } from '../utils/parsePaginatedList';
import { servicesCatalogUrl } from '../utils/servicesCatalogUrl';

function MachineFormSkeleton() {
  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
        <Skeleton variant="rounded" width="100%" height={56} />
        <Skeleton variant="rounded" width="100%" height={56} />
      </Stack>
      <Skeleton variant="rounded" width="100%" height={56} />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
        <Skeleton variant="rounded" height={56} sx={{ flex: 1, width: { xs: '100%', sm: 'auto' } }} />
        <Skeleton variant="rounded" height={56} sx={{ flex: 1, width: { xs: '100%', sm: 'auto' } }} />
      </Stack>
      <Skeleton variant="rounded" width="100%" height={100} />
      <Skeleton variant="rounded" width={170} height={44} />
    </Stack>
  );
}

export default function MachineCreatePage() {
  const navigate = useNavigate();
  const { get, post } = useApi();
  const { showSuccess, showError, showWarning } = useToast();
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  const resolver = useMemo(
    () => (values, context, options) => yupResolver(machineSchema)(values, context, options),
    []
  );

  const methods = useForm({
    resolver,
    defaultValues: machineDefaultValues,
    mode: 'onTouched',
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setServicesLoading(true);
      try {
        const data = await get(servicesCatalogUrl('machine'));
        if (cancelled) return;
        const { rows } = parsePaginatedList(data, { listKeys: ['services'] });
        setServices(rows);
      } catch {
        if (!cancelled) {
          setServices([]);
          showWarning('Could not load services.');
        }
      } finally {
        if (!cancelled) setServicesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async values => {
    try {
      await post('/machines', buildMachinePayload(values));
      showSuccess('Machine created.');
      navigate('/inventory?tab=machines', { replace: false });
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not create machine.';
      showError(typeof msg === 'string' ? msg : 'Could not create machine.');
    }
  };

  return (
    <FormPageShell
      title="Add machine"
      description="Register a machine, link it to a service, and set pricing by type."
      headerAction={
        <Button variant="outlined" onClick={() => navigate('/inventory?tab=machines')} sx={{ borderRadius: 2 }}>
          Back to list
        </Button>
      }
      maxWidth="md"
    >
      {servicesLoading ? (
        <MachineFormSkeleton />
      ) : (
        <FormProvider {...methods}>
          <MachineForm services={services} onSubmit={onSubmit} submitLabel="Create machine" />
        </FormProvider>
      )}
    </FormPageShell>
  );
}
