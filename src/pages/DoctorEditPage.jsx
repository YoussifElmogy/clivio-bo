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
import DoctorForm from '../forms/DoctorForm/DoctorForm';
import { useToast } from '../context/ToastContext';
import {
  createDoctorCreateSchema,
  doctorCreateDefaultValues,
} from '../schemas/doctorSchema';
import { buildDoctorUpdatePayload, mergeDoctorFromApi } from '../payloads/doctorPayload';
import { parsePaginatedList } from '../utils/parsePaginatedList';

export default function DoctorEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { get, patch, del } = useApi();
  const { showSuccess, showError, showWarning } = useToast();
  const [branches, setBranches] = useState([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const [doctorName, setDoctorName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const schema = useMemo(() => createDoctorCreateSchema(branches), [branches]);

  const resolver = useMemo(
    () => (values, context, options) =>
      yupResolver(schema)(values, { ...context, formValues: values }, options),
    [schema]
  );

  const methods = useForm({
    resolver,
    defaultValues: doctorCreateDefaultValues,
    mode: 'onTouched',
  });

  const { reset } = methods;

  useEffect(() => {
    if (!id) {
      showError('Missing doctor id.');
      navigate('/doctors', { replace: true });
      return;
    }

    let cancelled = false;
    (async () => {
      setInitialLoad(true);
      try {
        const results = await Promise.allSettled([
          get(`/doctors/${encodeURIComponent(id)}`),
          get('/branches?page=1&page_size=100'),
        ]);

        if (cancelled) return;

        const doctorResult = results[0];
        const branchesResult = results[1];

        if (doctorResult.status === 'rejected') {
          const err = doctorResult.reason;
          const msg =
            err?.response?.data?.detail ||
            err?.response?.data?.message ||
            err?.message ||
            'Could not load doctor.';
          showError(typeof msg === 'string' ? msg : 'Could not load doctor.');
          navigate('/doctors', { replace: true });
          return;
        }

        const doctorData = doctorResult.value;
        let rows = [];
        if (branchesResult.status === 'fulfilled') {
          const parsed = parsePaginatedList(branchesResult.value, { listKeys: ['branches'] });
          rows = parsed.rows;
        } else {
          showWarning('Could not load branches. Schedule editing may be limited until branches load.');
        }

        setBranches(rows);
        const merged = mergeDoctorFromApi(doctorData);
        reset(merged);
        setDoctorName(typeof merged.name === 'string' ? merged.name.trim() : '');
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
      await patch(`/doctors/${encodeURIComponent(id)}`, buildDoctorUpdatePayload(values));
      showSuccess('Doctor updated.');
      navigate('/doctors', { replace: false });
    } catch (err) {
      const msg =
        (typeof err === 'object' && err !== null && err.error) ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not update doctor.';
      showError(typeof msg === 'string' ? msg : 'Could not update doctor.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!id) return;
    setDeleteSubmitting(true);
    try {
      await del(`/doctors/${encodeURIComponent(id)}`);
      setDeleteDialogOpen(false);
      showSuccess('Doctor deleted.');
      navigate('/doctors', { replace: true });
    } catch (err) {
      const msg =
        (typeof err === 'object' && err !== null && err.error) ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not delete doctor.';
      showError(typeof msg === 'string' ? msg : 'Could not delete doctor.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <>
      <CustomLoader active={deleteSubmitting} />
      <FormPageShell
        title="Edit doctor"
        description={
          doctorName
            ? `Update ${doctorName}.`
            : 'Update profile, contact details, and weekly availability per branch.'
        }
        headerAction={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={initialLoad || deleteSubmitting}
              sx={{ borderRadius: 2 }}
            >
              Delete doctor
            </Button>
            <Button variant="outlined" onClick={() => navigate('/doctors')} sx={{ borderRadius: 2 }}>
              Back to list
            </Button>
          </Stack>
        }
        maxWidth="lg"
      >
        <FormProvider {...methods}>
          <DoctorForm
            branches={branches}
            isLoading={initialLoad}
            isEdit
            onSubmit={onSubmit}
            submitLabel="Save changes"
          />
        </FormProvider>
      </FormPageShell>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleteSubmitting && setDeleteDialogOpen(false)}
        aria-labelledby="delete-doctor-edit-dialog-title"
      >
        <DialogTitle id="delete-doctor-edit-dialog-title">Delete doctor?</DialogTitle>
        <DialogContent>
          This cannot be undone.{' '}
          {doctorName ? (
            <>
              Remove <strong>{doctorName}</strong> permanently?
            </>
          ) : (
            'Remove this doctor permanently?'
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
