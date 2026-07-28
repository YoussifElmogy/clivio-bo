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
import GeneralServiceForm from '../forms/GeneralServiceForm/GeneralServiceForm';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isSuperAdminUser } from '../utils/authRoles';
import {
  generalServiceDefaultValues,
  generalServiceEditSchema,
} from '../schemas/generalServiceSchema';
import { buildGeneralServicePayload, mergeGeneralServiceFromApi } from '../payloads/generalServicePayload';

function FormSkeleton() {
  return (
    <Stack spacing={2.5}>
      <Skeleton variant="rounded" height={56} />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
        <Skeleton variant="rounded" height={56} sx={{ flex: 1 }} />
        <Skeleton variant="rounded" height={56} sx={{ flex: 1 }} />
      </Stack>
      <Skeleton variant="rounded" width={170} height={44} />
    </Stack>
  );
}

export default function GeneralServiceEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { get, patch, del } = useApi();
  const { showSuccess, showError } = useToast();
  const isSuperAdmin = isSuperAdminUser(user);
  const [serviceDoctorId, setServiceDoctorId] = useState('');
  const [initialLoad, setInitialLoad] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const resolver = useMemo(
    () => (values, context, options) => yupResolver(generalServiceEditSchema)(values, context, options),
    []
  );
  const methods = useForm({
    resolver,
    defaultValues: generalServiceDefaultValues,
    mode: 'onTouched',
  });
  const { reset } = methods;

  useEffect(() => {
    if (!id) {
      showError('Missing service id.');
      navigate('/general-services', { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      setInitialLoad(true);
      try {
        const data = await get(`/general-services/${encodeURIComponent(id)}`);
        if (cancelled) return;
        const merged = mergeGeneralServiceFromApi(data);
        reset({
          ...merged,
          doctor:
            merged.doctor !== '' && merged.doctor != null
              ? merged.doctor
              : user?.id != null
                ? Number(user.id)
                : '',
        });
        setServiceDoctorId(
          merged.doctor !== '' && merged.doctor != null ? String(merged.doctor) : ''
        );
        setDisplayName(merged.name || 'Service');
      } catch (err) {
        if (!cancelled) {
          const msg =
            err?.detail ||
            err?.response?.data?.detail ||
            err?.response?.data?.message ||
            err?.message ||
            'Could not load general service.';
          showError(typeof msg === 'string' ? msg : 'Could not load general service.');
          navigate('/general-services', { replace: true });
        }
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
      await patch(
        `/general-services/${encodeURIComponent(id)}`,
        buildGeneralServicePayload(values, { includeDoctorId: false, forUpdate: true })
      );
      showSuccess('General service updated.');
      const backQuery =
        isSuperAdmin && serviceDoctorId ? `?doctor_id=${encodeURIComponent(serviceDoctorId)}` : '';
      navigate(`/general-services${backQuery}`, { replace: false });
    } catch (err) {
      const msg =
        err?.detail ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not update general service.';
      showError(typeof msg === 'string' ? msg : 'Could not update general service.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!id) return;
    setDeleteSubmitting(true);
    try {
      await del(`/general-services/${encodeURIComponent(id)}`);
      setDeleteDialogOpen(false);
      showSuccess('General service deleted.');
      const backQuery =
        isSuperAdmin && serviceDoctorId ? `?doctor_id=${encodeURIComponent(serviceDoctorId)}` : '';
      navigate(`/general-services${backQuery}`, { replace: true });
    } catch (err) {
      const msg =
        err?.detail ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not delete general service.';
      showError(typeof msg === 'string' ? msg : 'Could not delete general service.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <>
      <CustomLoader active={deleteSubmitting} />
      <FormPageShell
        title="Edit general service"
        description={displayName ? `Update ${displayName} or clinic fees.` : 'Update service details.'}
        headerAction={
          <Stack direction="row" spacing={1} useFlexGap>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={initialLoad || deleteSubmitting}
              sx={{ borderRadius: 2 }}
            >
              Delete
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                const backQuery =
                  isSuperAdmin && serviceDoctorId
                    ? `?doctor_id=${encodeURIComponent(serviceDoctorId)}`
                    : '';
                navigate(`/general-services${backQuery}`);
              }}
              sx={{ borderRadius: 2 }}
            >
              Back to list
            </Button>
          </Stack>
        }
        maxWidth="md"
      >
        {initialLoad ? (
          <FormSkeleton />
        ) : (
          <FormProvider {...methods}>
            <GeneralServiceForm onSubmit={onSubmit} submitLabel="Save changes" />
          </FormProvider>
        )}
      </FormPageShell>
      <Dialog open={deleteDialogOpen} onClose={() => !deleteSubmitting && setDeleteDialogOpen(false)}>
        <DialogTitle>Delete general service?</DialogTitle>
        <DialogContent>
          This cannot be undone. Remove <strong>{displayName || 'this service'}</strong>?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteSubmitting}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={handleConfirmDelete} disabled={deleteSubmitting}>
            {deleteSubmitting ? <CircularProgress size={18} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
