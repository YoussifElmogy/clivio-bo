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
import AssistantForm from '../forms/AssistantForm/AssistantForm';
import { useToast } from '../context/ToastContext';
import { createAssistantSchema, assistantCreateDefaultValues } from '../schemas/assistantSchema';
import {
  buildAssistantUpdatePayload,
  mergeAssistantFromApi,
  parseAssistantRolesResponse,
} from '../payloads/assistantPayload';
import { parsePaginatedList } from '../utils/parsePaginatedList';

export default function AssistantEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { get, patch, del } = useApi();
  const { showSuccess, showError, showWarning } = useToast();
  const [branches, setBranches] = useState([]);
  const [roles, setRoles] = useState([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const [assistantName, setAssistantName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const resolver = useMemo(
    () => (values, context, options) =>
      yupResolver(createAssistantSchema({ requirePassword: false }))(values, context, options),
    []
  );

  const methods = useForm({
    resolver,
    defaultValues: assistantCreateDefaultValues,
    mode: 'onTouched',
  });

  const { reset } = methods;

  useEffect(() => {
    if (!id) {
      showError('Missing assistant id.');
      navigate('/assistants', { replace: true });
      return;
    }

    let cancelled = false;
    (async () => {
      setInitialLoad(true);
      try {
        const results = await Promise.allSettled([
          get(`/assistants/${encodeURIComponent(id)}`),
          get('/branches?page=1&page_size=100'),
          get('/assistant-roles'),
        ]);

        if (cancelled) return;

        const assistantResult = results[0];
        const branchesResult = results[1];
        const rolesResult = results[2];

        if (assistantResult.status === 'rejected') {
          const err = assistantResult.reason;
          const msg =
            err?.response?.data?.detail ||
            err?.response?.data?.message ||
            err?.message ||
            'Could not load assistant.';
          showError(typeof msg === 'string' ? msg : 'Could not load assistant.');
          navigate('/assistants', { replace: true });
          return;
        }

        if (branchesResult.status === 'fulfilled') {
          const { rows } = parsePaginatedList(branchesResult.value, { listKeys: ['branches'] });
          setBranches(rows);
        } else {
          showWarning('Could not load branches.');
          setBranches([]);
        }

        if (rolesResult.status === 'fulfilled') {
          setRoles(parseAssistantRolesResponse(rolesResult.value));
        } else {
          showWarning('Could not load assistant roles.');
          setRoles([]);
        }

        const merged = mergeAssistantFromApi(assistantResult.value);
        reset(merged);
        setAssistantName(typeof merged.name === 'string' ? merged.name.trim() : '');
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
      await patch(`/assistants/${encodeURIComponent(id)}`, buildAssistantUpdatePayload(values));
      showSuccess('Assistant updated.');
      navigate('/assistants', { replace: false });
    } catch (err) {
      const msg =
        (typeof err === 'object' && err !== null && err.error) ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not update assistant.';
      showError(typeof msg === 'string' ? msg : 'Could not update assistant.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!id) return;
    setDeleteSubmitting(true);
    try {
      await del(`/assistants/${encodeURIComponent(id)}`);
      setDeleteDialogOpen(false);
      showSuccess('Assistant deleted.');
      navigate('/assistants', { replace: true });
    } catch (err) {
      const msg =
        (typeof err === 'object' && err !== null && err.error) ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not delete assistant.';
      showError(typeof msg === 'string' ? msg : 'Could not delete assistant.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <>
      <CustomLoader active={deleteSubmitting} />
      <FormPageShell
        title="Edit assistant"
        description={
          assistantName
            ? `Update ${assistantName}.`
            : 'Update profile, branches, and permission roles.'
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
              Delete assistant
            </Button>
            <Button variant="outlined" onClick={() => navigate('/assistants')} sx={{ borderRadius: 2 }}>
              Back to list
            </Button>
          </Stack>
        }
        maxWidth="lg"
      >
        <FormProvider {...methods}>
          <AssistantForm
            branches={branches}
            roles={roles}
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
        aria-labelledby="delete-assistant-edit-dialog-title"
      >
        <DialogTitle id="delete-assistant-edit-dialog-title">Delete assistant?</DialogTitle>
        <DialogContent>
          This cannot be undone.{' '}
          {assistantName ? (
            <>
              Remove <strong>{assistantName}</strong> permanently?
            </>
          ) : (
            'Remove this assistant permanently?'
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
