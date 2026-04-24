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
import ServiceForm from '../forms/ServiceForm/ServiceForm';
import { useToast } from '../context/ToastContext';
import { serviceDefaultValues, serviceSchema } from '../schemas/serviceSchema';
import { buildServicePayload, mergeServiceFromApi } from '../payloads/servicePayload';

function ServiceEditSkeleton() {
  return (
    <Stack spacing={2.5}>
      <Skeleton variant="text" width="30%" height={32} />
      <Skeleton variant="rounded" width="100%" height={56} />
      <Skeleton variant="rounded" width={{ xs: '100%', sm: '50%' }} height={56} />
      <Skeleton variant="text" width="22%" height={28} />
      <Skeleton variant="rounded" width="100%" height={130} />
      <Skeleton variant="rounded" width={170} height={44} />
    </Stack>
  );
}

export default function ServiceEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { get, patch, del } = useApi();
  const { showSuccess, showError } = useToast();
  const [initialLoad, setInitialLoad] = useState(true);
  const [serviceName, setServiceName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const resolver = useMemo(
    () => (values, context, options) => yupResolver(serviceSchema)(values, context, options),
    []
  );

  const methods = useForm({
    resolver,
    defaultValues: serviceDefaultValues,
    mode: 'onTouched',
  });
  const { reset } = methods;

  useEffect(() => {
    if (!id) {
      showError('Missing service id.');
      navigate('/services', { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      setInitialLoad(true);
      try {
        const data = await get(`/services/${encodeURIComponent(id)}`);
        if (cancelled) return;
        const merged = mergeServiceFromApi(data);
        reset(merged);
        setServiceName(merged.name?.trim?.() || '');
      } catch (err) {
        if (cancelled) return;
        const msg =
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          'Could not load service.';
        showError(typeof msg === 'string' ? msg : 'Could not load service.');
        navigate('/services', { replace: true });
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
      await patch(`/services/${encodeURIComponent(id)}`, buildServicePayload(values));
      showSuccess('Service updated.');
      navigate('/services', { replace: false });
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not update service.';
      showError(typeof msg === 'string' ? msg : 'Could not update service.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!id) return;
    setDeleteSubmitting(true);
    try {
      await del(`/services/${encodeURIComponent(id)}`);
      setDeleteDialogOpen(false);
      showSuccess('Service deleted.');
      navigate('/services', { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not delete service.';
      showError(typeof msg === 'string' ? msg : 'Could not delete service.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <>
      <CustomLoader active={deleteSubmitting} />
      <FormPageShell
        title="Edit service"
        description={serviceName ? `Update ${serviceName}.` : 'Update this service.'}
        headerAction={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={initialLoad || deleteSubmitting}
              sx={{ borderRadius: 2 }}
            >
              Delete service
            </Button>
            <Button variant="outlined" onClick={() => navigate('/services')} sx={{ borderRadius: 2 }}>
              Back to list
            </Button>
          </Stack>
        }
        maxWidth="md"
      >
        {initialLoad ? (
          <ServiceEditSkeleton />
        ) : (
          <FormProvider {...methods}>
            <ServiceForm onSubmit={onSubmit} submitLabel="Save changes" />
          </FormProvider>
        )}
      </FormPageShell>
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleteSubmitting && setDeleteDialogOpen(false)}
        aria-labelledby="delete-service-edit-dialog-title"
      >
        <DialogTitle id="delete-service-edit-dialog-title">Delete service?</DialogTitle>
        <DialogContent>
          This cannot be undone.{' '}
          {serviceName ? (
            <>
              Remove <strong>{serviceName}</strong> permanently?
            </>
          ) : (
            'Remove this service permanently?'
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
