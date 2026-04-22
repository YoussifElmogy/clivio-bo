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
import PatientForm from '../forms/PatientForm/PatientForm';
import { useToast } from '../context/ToastContext';
import { patientSchema, patientDefaultValues } from '../schemas/patientSchema';
import { buildPatientUpdatePayload, mergePatientFromApi } from '../payloads/patientPayload';

export default function PatientEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { get, patch, del } = useApi();
  const { showSuccess, showError } = useToast();
  const [initialLoad, setInitialLoad] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const resolver = useMemo(
    () => (values, context, options) => yupResolver(patientSchema)(values, context, options),
    []
  );

  const methods = useForm({
    resolver,
    defaultValues: patientDefaultValues,
    mode: 'onTouched',
  });

  const { reset } = methods;

  useEffect(() => {
    if (!id) {
      showError('Missing patient id.');
      navigate('/patients', { replace: true });
      return;
    }

    let cancelled = false;
    (async () => {
      setInitialLoad(true);
      try {
        const data = await get(`/patients/${encodeURIComponent(id)}`);
        if (cancelled) return;
        const merged = mergePatientFromApi(data);
        reset(merged);
        const name = [merged.first_name, merged.last_name].filter(Boolean).join(' ').trim();
        setDisplayName(name || 'Patient');
      } catch (err) {
        if (!cancelled) {
          const msg =
            err?.detail ||
            err?.response?.data?.detail ||
            err?.response?.data?.message ||
            err?.message ||
            'Could not load patient.';
          showError(typeof msg === 'string' ? msg : 'Could not load patient.');
          navigate('/patients', { replace: true });
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
      await patch(`/patients/${encodeURIComponent(id)}`, buildPatientUpdatePayload(values));
      showSuccess('Patient updated.');
      navigate('/patients', { replace: false });
    } catch (err) {
      const msg =
        err?.detail ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not update patient.';
      showError(typeof msg === 'string' ? msg : 'Could not update patient.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!id) return;
    setDeleteSubmitting(true);
    try {
      await del(`/patients/${encodeURIComponent(id)}`);
      setDeleteDialogOpen(false);
      showSuccess('Patient deleted.');
      navigate('/patients', { replace: true });
    } catch (err) {
      const msg =
        err?.detail ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not delete patient.';
      showError(typeof msg === 'string' ? msg : 'Could not delete patient.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <>
      <CustomLoader active={deleteSubmitting} />
      <FormPageShell
        title="Edit patient"
        description={displayName ? `Update ${displayName}.` : 'Update patient details.'}
        headerAction={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={initialLoad || deleteSubmitting}
              sx={{ borderRadius: 2 }}
            >
              Delete patient
            </Button>
            <Button variant="outlined" onClick={() => navigate('/patients')} sx={{ borderRadius: 2 }}>
              Back to list
            </Button>
          </Stack>
        }
        maxWidth="md"
      >
        <FormProvider {...methods}>
          <PatientForm onSubmit={onSubmit} submitLabel="Save changes" isLoading={initialLoad} />
        </FormProvider>
      </FormPageShell>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleteSubmitting && setDeleteDialogOpen(false)}
        aria-labelledby="delete-patient-dialog-title"
      >
        <DialogTitle id="delete-patient-dialog-title">Delete patient?</DialogTitle>
        <DialogContent>
          This cannot be undone.{' '}
          {displayName ? (
            <>
              Remove <strong>{displayName}</strong> permanently?
            </>
          ) : (
            'Remove this patient permanently?'
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
