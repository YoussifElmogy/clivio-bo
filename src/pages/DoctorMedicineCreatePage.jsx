import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import useApi from '../configs/useApi';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import DoctorMedicineForm from '../forms/DoctorMedicineForm/DoctorMedicineForm';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { parsePaginatedList } from '../utils/parsePaginatedList';
import { isDoctorUser } from '../utils/authRoles';
import { doctorMedicineDefaultValues, doctorMedicineSchema } from '../schemas/doctorMedicineSchema';
import { buildDoctorMedicinePayload } from '../payloads/doctorMedicinePayload';

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

export default function DoctorMedicineCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { get, post } = useApi();
  const { showSuccess, showError, showWarning } = useToast();
  const isDoctor = isDoctorUser(user);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  const resolver = useMemo(
    () => (values, context, options) => yupResolver(doctorMedicineSchema)(values, context, options),
    []
  );

  const methods = useForm({
    resolver,
    defaultValues: {
      ...doctorMedicineDefaultValues,
      doctor: isDoctor && user?.id ? Number(user.id) : '',
    },
    mode: 'onTouched',
  });

  useEffect(() => {
    let cancelled = false;
    if (isDoctor) {
      setDoctors([{ id: user?.id, name: user?.fullName || user?.username || 'Doctor' }]);
      setLoadingDoctors(false);
      return undefined;
    }
    (async () => {
      setLoadingDoctors(true);
      try {
        const data = await get('/doctors?page=1&page_size=200');
        if (cancelled) return;
        const parsed = parsePaginatedList(data, { listKeys: ['doctors'] });
        setDoctors(parsed.rows);
      } catch {
        if (!cancelled) {
          setDoctors([]);
          showWarning('Could not load doctors.');
        }
      } finally {
        if (!cancelled) setLoadingDoctors(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDoctor, user?.id]);

  const onSubmit = async values => {
    try {
      await post('/doctor-medicines', buildDoctorMedicinePayload(values));
      showSuccess('Medicine created.');
      navigate('/doctor-medicines', { replace: false });
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not create medicine.';
      showError(typeof msg === 'string' ? msg : 'Could not create medicine.');
    }
  };

  return (
    <FormPageShell
      title="Add medicine"
      description="Create a medicine for a doctor."
      headerAction={
        <Button variant="outlined" onClick={() => navigate('/doctor-medicines')} sx={{ borderRadius: 2 }}>
          Back to list
        </Button>
      }
      maxWidth="md"
    >
      {loadingDoctors ? (
        <FormSkeleton />
      ) : (
        <FormProvider {...methods}>
          <DoctorMedicineForm
            doctors={doctors}
            disableDoctor={isDoctor}
            showDoctorField={false}
            onSubmit={onSubmit}
            submitLabel="Create medicine"
          />
        </FormProvider>
      )}
    </FormPageShell>
  );
}
