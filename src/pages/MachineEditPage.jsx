import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import useApi from '../configs/useApi';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import CustomLoader from '../components/CustomLoader/CustomLoader';
import MachineForm from '../forms/MachineForm/MachineForm';
import { useToast } from '../context/ToastContext';
import { machineDefaultValues, machineSchema } from '../schemas/machineSchema';
import { buildMachinePayload, mergeMachineFromApi } from '../payloads/machinePayload';
import { parsePaginatedList } from '../utils/parsePaginatedList';
import { servicesCatalogUrl } from '../utils/servicesCatalogUrl';

function MachineEditSkeleton() {
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

export default function MachineEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { get, patch, del } = useApi();
  const { showSuccess, showError, showWarning } = useToast();
  const [services, setServices] = useState([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const [machineName, setMachineName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const resolver = useMemo(
    () => (values, context, options) => yupResolver(machineSchema)(values, context, options),
    []
  );

  const methods = useForm({
    resolver,
    defaultValues: machineDefaultValues,
    mode: 'onTouched',
  });
  const { reset } = methods;

  useEffect(() => {
    if (!id) {
      showError('Missing machine id.');
      navigate('/inventory?tab=machines', { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      setInitialLoad(true);
      try {
        const results = await Promise.allSettled([
          get(`/machines/${encodeURIComponent(id)}`),
          get(servicesCatalogUrl('machine')),
        ]);
        if (cancelled) return;

        const machineRes = results[0];
        const servicesRes = results[1];

        if (servicesRes.status === 'fulfilled') {
          const { rows } = parsePaginatedList(servicesRes.value, { listKeys: ['services'] });
          setServices(rows);
        } else {
          setServices([]);
          showWarning('Could not load services.');
        }

        if (machineRes.status === 'rejected') {
          const err = machineRes.reason;
          const msg =
            err?.response?.data?.detail ||
            err?.response?.data?.message ||
            err?.message ||
            'Could not load machine.';
          showError(typeof msg === 'string' ? msg : 'Could not load machine.');
          navigate('/inventory?tab=machines', { replace: true });
          return;
        }

        const merged = mergeMachineFromApi(machineRes.value);
        reset(merged);
        setMachineName(merged.name?.trim?.() || '');
      } finally {
        if (!cancelled) setInitialLoad(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onSubmit = async values => {
    if (!id) return;
    try {
      await patch(`/machines/${encodeURIComponent(id)}`, buildMachinePayload(values));
      showSuccess('Machine updated.');
      navigate('/inventory?tab=machines', { replace: false });
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not update machine.';
      showError(typeof msg === 'string' ? msg : 'Could not update machine.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!id) return;
    setDeleteSubmitting(true);
    try {
      await del(`/machines/${encodeURIComponent(id)}`);
      setDeleteDialogOpen(false);
      showSuccess('Machine deleted.');
      navigate('/inventory?tab=machines', { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not delete machine.';
      showError(typeof msg === 'string' ? msg : 'Could not delete machine.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <>
      <CustomLoader active={deleteSubmitting} />
      <FormPageShell
        title="Edit machine"
        description={machineName ? `Update ${machineName}.` : 'Update this machine.'}
        headerAction={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={initialLoad || deleteSubmitting}
              sx={{ borderRadius: 2 }}
            >
              Delete machine
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/inventory?tab=machines')}
              sx={{ borderRadius: 2 }}
            >
              Back to list
            </Button>
          </Stack>
        }
        maxWidth="md"
      >
        {initialLoad ? (
          <MachineEditSkeleton />
        ) : (
          <FormProvider {...methods}>
            <MachineForm services={services} onSubmit={onSubmit} submitLabel="Save changes" />
          </FormProvider>
        )}
      </FormPageShell>
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleteSubmitting && setDeleteDialogOpen(false)}
        aria-labelledby="delete-machine-edit-dialog-title"
      >
        <DialogTitle id="delete-machine-edit-dialog-title">Delete machine?</DialogTitle>
        <DialogContent>
          This cannot be undone.{' '}
          {machineName ? (
            <>
              Remove <strong>{machineName}</strong> permanently?
            </>
          ) : (
            'Remove this machine permanently?'
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteSubmitting}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDelete}
            disabled={deleteSubmitting}
            startIcon={
              deleteSubmitting ? (
                <CircularProgress size={18} thickness={5} color="inherit" aria-hidden />
              ) : null
            }
          >
            {deleteSubmitting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
