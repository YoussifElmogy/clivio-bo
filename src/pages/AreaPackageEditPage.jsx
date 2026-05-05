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
import AreaPackageForm from '../forms/AreaPackageForm/AreaPackageForm';
import { useToast } from '../context/ToastContext';
import { areaPackageDefaultValues, areaPackageSchema } from '../schemas/areaPackageSchema';
import { buildAreaPackagePayload, mergeAreaPackageFromApi } from '../payloads/areaPackagePayload';

export default function AreaPackageEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { get, patch, del } = useApi();
  const { showSuccess, showError } = useToast();
  const [initialLoad, setInitialLoad] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const resolver = useMemo(
    () => (values, context, options) => yupResolver(areaPackageSchema)(values, context, options),
    []
  );

  const methods = useForm({
    resolver,
    defaultValues: areaPackageDefaultValues,
    mode: 'onTouched',
  });
  const { reset } = methods;

  useEffect(() => {
    if (!id) {
      showError('Missing package id.');
      navigate('/laser?tab=area', { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      setInitialLoad(true);
      try {
        const data = await get(`/area-packages/${encodeURIComponent(id)}`);
        if (cancelled) return;
        reset(mergeAreaPackageFromApi(data));
      } catch (err) {
        if (cancelled) return;
        const msg =
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          'Could not load area package.';
        showError(typeof msg === 'string' ? msg : 'Could not load area package.');
        navigate('/laser?tab=area', { replace: true });
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
      await patch(`/area-packages/${encodeURIComponent(id)}`, buildAreaPackagePayload(values));
      showSuccess('Area package updated.');
      navigate('/laser?tab=area', { replace: false });
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not update area package.';
      showError(typeof msg === 'string' ? msg : 'Could not update area package.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!id) return;
    setDeleteSubmitting(true);
    try {
      await del(`/area-packages/${encodeURIComponent(id)}`);
      setDeleteDialogOpen(false);
      showSuccess('Area package deleted.');
      navigate('/laser?tab=area', { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not delete area package.';
      showError(typeof msg === 'string' ? msg : 'Could not delete area package.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <>
      <CustomLoader active={deleteSubmitting} />
      <FormPageShell
        title="Edit area package"
        description="Update name, price, and optional description."
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
            <Button variant="outlined" onClick={() => navigate('/laser?tab=area')} sx={{ borderRadius: 2 }}>
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
            <AreaPackageForm onSubmit={onSubmit} submitLabel="Save changes" />
          </FormProvider>
        )}
      </FormPageShell>
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleteSubmitting && setDeleteDialogOpen(false)}
        aria-labelledby="delete-area-package-dialog-title"
      >
        <DialogTitle id="delete-area-package-dialog-title">Delete area package?</DialogTitle>
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
