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
import DoctorMedicineForm from '../forms/DoctorMedicineForm/DoctorMedicineForm';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { parsePaginatedList } from '../utils/parsePaginatedList';
import { isDoctorUser } from '../utils/authRoles';
import { doctorMedicineDefaultValues, doctorMedicineSchema } from '../schemas/doctorMedicineSchema';
import { buildDoctorMedicinePayload, mergeDoctorMedicineFromApi } from '../payloads/doctorMedicinePayload';

function FormSkeleton() {
  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
        <Skeleton variant="rounded" width="100%" height={56} />
        <Skeleton variant="rounded" width="100%" height={56} />
      </Stack>
      <Skeleton variant="rounded" height={56} sx={{ width: { xs: '100%', sm: '50%' } }} />
      <Skeleton variant="rounded" width={170} height={44} />
    </Stack>
  );
}

export default function DoctorMedicineEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { get, patch, del } = useApi();
  const { showSuccess, showError, showWarning } = useToast();
  const isDoctor = isDoctorUser(user);
  const [doctors, setDoctors] = useState([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const resolver = useMemo(
    () => (values, context, options) => yupResolver(doctorMedicineSchema)(values, context, options),
    []
  );
  const methods = useForm({
    resolver,
    defaultValues: doctorMedicineDefaultValues,
    mode: 'onTouched',
  });
  const { reset } = methods;

  useEffect(() => {
    if (!id) {
      showError('Missing medicine id.');
      navigate('/doctor-medicines', { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      setInitialLoad(true);
      try {
        const requests = [get(`/doctor-medicines/${encodeURIComponent(id)}`)];
        if (!isDoctor) requests.push(get('/doctors?page=1&page_size=200'));
        const results = await Promise.allSettled(requests);
        if (cancelled) return;
        const medicineRes = results[0];
        if (medicineRes.status === 'rejected') throw medicineRes.reason;
        const merged = mergeDoctorMedicineFromApi(medicineRes.value);
        reset(merged);
        setDisplayName(merged.name || 'Medicine');
        if (isDoctor) {
          setDoctors([{ id: user?.id, name: user?.fullName || user?.username || 'Doctor' }]);
        } else {
          const doctorsRes = results[1];
          if (doctorsRes?.status === 'fulfilled') {
            const parsed = parsePaginatedList(doctorsRes.value, { listKeys: ['doctors'] });
            setDoctors(parsed.rows);
          } else {
            setDoctors([]);
            showWarning('Could not load doctors.');
          }
        }
      } catch (err) {
        if (!cancelled) {
          const msg =
            err?.response?.data?.detail ||
            err?.response?.data?.message ||
            err?.message ||
            'Could not load medicine.';
          showError(typeof msg === 'string' ? msg : 'Could not load medicine.');
          navigate('/doctor-medicines', { replace: true });
        }
      } finally {
        if (!cancelled) setInitialLoad(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isDoctor, user?.id]);

  const onSubmit = async values => {
    if (!id) return;
    try {
      await patch(
        `/doctor-medicines/${encodeURIComponent(id)}`,
        buildDoctorMedicinePayload(values, { includeDoctorId: false })
      );
      showSuccess('Medicine updated.');
      navigate('/doctor-medicines', { replace: false });
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not update medicine.';
      showError(typeof msg === 'string' ? msg : 'Could not update medicine.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!id) return;
    setDeleteSubmitting(true);
    try {
      await del(`/doctor-medicines/${encodeURIComponent(id)}`);
      setDeleteDialogOpen(false);
      showSuccess('Medicine deleted.');
      navigate('/doctor-medicines', { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not delete medicine.';
      showError(typeof msg === 'string' ? msg : 'Could not delete medicine.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <>
      <CustomLoader active={deleteSubmitting} />
      <FormPageShell
        title="Edit medicine"
        description={displayName ? `Update ${displayName}.` : 'Update medicine details.'}
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
            <Button variant="outlined" onClick={() => navigate('/doctor-medicines')} sx={{ borderRadius: 2 }}>
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
            <DoctorMedicineForm
              doctors={doctors}
              disableDoctor={isDoctor}
              showDoctorField={false}
              onSubmit={onSubmit}
              submitLabel="Save changes"
            />
          </FormProvider>
        )}
      </FormPageShell>
      <Dialog open={deleteDialogOpen} onClose={() => !deleteSubmitting && setDeleteDialogOpen(false)}>
        <DialogTitle>Delete medicine?</DialogTitle>
        <DialogContent>
          This cannot be undone. Remove <strong>{displayName || 'this medicine'}</strong>?
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
