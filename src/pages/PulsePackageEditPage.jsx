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
import Stack from '@mui/material/Stack';
import useApi from '../configs/useApi';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import CustomLoader from '../components/CustomLoader/CustomLoader';
import PulsePackageForm from '../forms/PulsePackageForm/PulsePackageForm';
import { useToast } from '../context/ToastContext';
import { pulsePackageDefaultValues, pulsePackageSchema } from '../schemas/pulsePackageSchema';
import { buildPulsePackagePayload, mergePulsePackageFromApi } from '../payloads/pulsePackagePayload';

export default function PulsePackageEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { get, patch, del } = useApi();
  const { showSuccess, showError } = useToast();
  const [initialLoad, setInitialLoad] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const resolver = useMemo(
    () => (values, context, options) => yupResolver(pulsePackageSchema)(values, context, options),
    []
  );

  const methods = useForm({
    resolver,
    defaultValues: pulsePackageDefaultValues,
    mode: 'onTouched',
  });
  const { reset } = methods;

  useEffect(() => {
    if (!id) {
      showError('Missing package id.');
      navigate('/laser?tab=pulse', { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      setInitialLoad(true);
      try {
        const data = await get(`/pulse-packages/${encodeURIComponent(id)}`);
        if (cancelled) return;
        reset(mergePulsePackageFromApi(data));
      } catch (err) {
        if (cancelled) return;
        const msg =
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          'Could not load pulse package.';
        showError(typeof msg === 'string' ? msg : 'Could not load pulse package.');
        navigate('/laser?tab=pulse', { replace: true });
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
      await patch(`/pulse-packages/${encodeURIComponent(id)}`, buildPulsePackagePayload(values));
      showSuccess('Pulse package updated.');
      navigate('/laser?tab=pulse', { replace: false });
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not update pulse package.';
      showError(typeof msg === 'string' ? msg : 'Could not update pulse package.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!id) return;
    setDeleteSubmitting(true);
    try {
      await del(`/pulse-packages/${encodeURIComponent(id)}`);
      setDeleteDialogOpen(false);
      showSuccess('Pulse package deleted.');
      navigate('/laser?tab=pulse', { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not delete pulse package.';
      showError(typeof msg === 'string' ? msg : 'Could not delete pulse package.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <>
      <CustomLoader active={deleteSubmitting} />
      <FormPageShell
        title="Edit pulse package"
        description="Update pulses, price, and optional description."
        headerAction={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={initialLoad || deleteSubmitting}
              sx={{ borderRadius: 2 }}
            >
              Delete
            </Button>
            <Button variant="outlined" onClick={() => navigate('/laser?tab=pulse')} sx={{ borderRadius: 2 }}>
              Back to Laser
            </Button>
          </Stack>
        }
        maxWidth="md"
      >
        {initialLoad ? (
          <Stack spacing={2} sx={{ py: 2 }}>
            <CircularProgress />
          </Stack>
        ) : (
          <FormProvider {...methods}>
            <PulsePackageForm onSubmit={onSubmit} submitLabel="Save changes" />
          </FormProvider>
        )}
      </FormPageShell>
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleteSubmitting && setDeleteDialogOpen(false)}
        aria-labelledby="delete-pulse-package-dialog-title"
      >
        <DialogTitle id="delete-pulse-package-dialog-title">Delete pulse package?</DialogTitle>
        <DialogContent>This cannot be undone.</DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteSubmitting}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={handleConfirmDelete} disabled={deleteSubmitting}>
            {deleteSubmitting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
