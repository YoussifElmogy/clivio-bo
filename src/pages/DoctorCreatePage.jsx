import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Button from '@mui/material/Button';
import useApi from '../configs/useApi';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import DoctorForm from '../forms/DoctorForm/DoctorForm';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isSuperAdminUser } from '../utils/authRoles';
import {
  createDoctorCreateSchema,
  doctorCreateDefaultValues,
} from '../schemas/doctorSchema';
import { buildDoctorCreatePayload } from '../payloads/doctorPayload';
import { parsePaginatedList } from '../utils/parsePaginatedList';

export default function DoctorCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { get, post } = useApi();
  const { showSuccess, showError, showWarning } = useToast();
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(true);

  const isSuperAdmin = useMemo(() => isSuperAdminUser(user), [user]);

  const schema = useMemo(
    () => createDoctorCreateSchema(branches, { requirePassword: isSuperAdmin }),
    [branches, isSuperAdmin]
  );

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingBranches(true);
      try {
        const data = await get('/branches?page=1&page_size=100');
        if (cancelled) return;
        const { rows } = parsePaginatedList(data, { listKeys: ['branches'] });
        setBranches(rows);
      } catch {
        if (!cancelled) {
          showWarning('Could not load branches. Create branches first, then try again.');
          setBranches([]);
        }
      } finally {
        if (!cancelled) setLoadingBranches(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async values => {
    try {
      await post('/doctors', buildDoctorCreatePayload(values));
      showSuccess('Doctor created.');
      navigate('/doctors', { replace: false });
    } catch (err) {
      const msg =
        (typeof err === 'object' && err !== null && err.error) ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not create doctor.';
      showError(typeof msg === 'string' ? msg : 'Could not create doctor.');
    }
  };

  return (
    <FormPageShell
      title="Add doctor"
      description="Create a doctor profile, contact details, and weekly availability per branch."
      headerAction={
        <Button variant="outlined" onClick={() => navigate('/doctors')} sx={{ borderRadius: 2 }}>
          Back to list
        </Button>
      }
      maxWidth="lg"
    >
      <FormProvider {...methods}>
        <DoctorForm
          branches={branches}
          isLoading={loadingBranches}
          showPasswordField={isSuperAdmin}
          onSubmit={onSubmit}
          submitLabel="Create doctor"
        />
      </FormProvider>
    </FormPageShell>
  );
}
