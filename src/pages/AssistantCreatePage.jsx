import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Button from '@mui/material/Button';
import useApi from '../configs/useApi';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import AssistantForm from '../forms/AssistantForm/AssistantForm';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { isSuperAdminUser } from '../utils/authRoles';
import { createAssistantSchema, assistantCreateDefaultValues } from '../schemas/assistantSchema';
import { buildAssistantCreatePayload, parseAssistantRolesResponse } from '../payloads/assistantPayload';
import { parsePaginatedList } from '../utils/parsePaginatedList';

export default function AssistantCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { get, post } = useApi();
  const { showSuccess, showError, showWarning } = useToast();
  const [branches, setBranches] = useState([]);
  const [roles, setRoles] = useState([]);
  const [initialLoad, setInitialLoad] = useState(true);

  const isSuperAdmin = useMemo(() => isSuperAdminUser(user), [user]);

  const resolver = useMemo(
    () => (values, context, options) =>
      yupResolver(createAssistantSchema({ requirePassword: isSuperAdmin }))(values, context, options),
    [isSuperAdmin]
  );

  const methods = useForm({
    resolver,
    defaultValues: assistantCreateDefaultValues,
    mode: 'onTouched',
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setInitialLoad(true);
      try {
        const results = await Promise.allSettled([
          get('/branches?page=1&page_size=100'),
          get('/assistant-roles'),
        ]);
        if (cancelled) return;

        const branchesRes = results[0];
        const rolesRes = results[1];

        if (branchesRes.status === 'fulfilled') {
          const { rows } = parsePaginatedList(branchesRes.value, { listKeys: ['branches'] });
          setBranches(rows);
        } else {
          showWarning('Could not load branches.');
          setBranches([]);
        }

        if (rolesRes.status === 'fulfilled') {
          setRoles(parseAssistantRolesResponse(rolesRes.value));
        } else {
          showWarning('Could not load assistant roles.');
          setRoles([]);
        }
      } finally {
        if (!cancelled) setInitialLoad(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async values => {
    try {
      await post('/assistants', buildAssistantCreatePayload(values));
      showSuccess('Assistant created.');
      navigate('/assistants', { replace: false });
    } catch (err) {
      const msg =
        (typeof err === 'object' && err !== null && err.error) ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not create assistant.';
      showError(typeof msg === 'string' ? msg : 'Could not create assistant.');
    }
  };

  return (
    <FormPageShell
      title="Add assistant"
      description="Create an assistant account, assign branches, and choose permission roles."
      headerAction={
        <Button variant="outlined" onClick={() => navigate('/assistants')} sx={{ borderRadius: 2 }}>
          Back to list
        </Button>
      }
      maxWidth="lg"
    >
      <FormProvider {...methods}>
        <AssistantForm
          branches={branches}
          roles={roles}
          isLoading={initialLoad}
          showPasswordField={isSuperAdmin}
          onSubmit={onSubmit}
          submitLabel="Create assistant"
        />
      </FormProvider>
    </FormPageShell>
  );
}
