import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import useApi from '../configs/useApi';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import GeneralServiceForm from '../forms/GeneralServiceForm/GeneralServiceForm';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isDoctorUser, isSuperAdminUser } from '../utils/authRoles';
import { fetchAllDoctors } from '../utils/doctorsCatalog';
import {
  generalServiceAdminCreateSchema,
  generalServiceAdminDefaultValues,
  generalServiceDefaultValues,
  generalServiceSchema,
} from '../schemas/generalServiceSchema';
import {
  buildGeneralServicePayload,
  createGeneralServicesForDoctors,
} from '../payloads/generalServicePayload';

function FormSkeleton() {
  return (
    <Stack spacing={2.5}>
      <Skeleton variant="rounded" height={56} />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
        <Skeleton variant="rounded" height={56} sx={{ flex: 1 }} />
        <Skeleton variant="rounded" height={56} sx={{ flex: 1 }} />
      </Stack>
      <Skeleton variant="rounded" height={56} />
      <Skeleton variant="rounded" width={170} height={44} />
    </Stack>
  );
}

export default function GeneralServiceCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { get, post } = useApi();
  const { showSuccess, showError, showWarning } = useToast();
  const isDoctor = isDoctorUser(user);
  const isSuperAdmin = isSuperAdminUser(user);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(!isDoctor);

  const preselectedDoctorId = String(searchParams.get('doctor_id') ?? '').trim();
  const preselectedDoctorIds =
    preselectedDoctorId && !Number.isNaN(Number(preselectedDoctorId))
      ? [Number(preselectedDoctorId)]
      : [];

  const resolver = useMemo(
    () => (values, context, options) => {
      const schema = isSuperAdmin ? generalServiceAdminCreateSchema : generalServiceSchema;
      return yupResolver(schema)(values, context, options);
    },
    [isSuperAdmin]
  );

  const methods = useForm({
    resolver,
    defaultValues: isSuperAdmin
      ? {
          ...generalServiceAdminDefaultValues,
          doctors: preselectedDoctorIds,
        }
      : {
          ...generalServiceDefaultValues,
          doctor: user?.id != null ? Number(user.id) : '',
        },
    mode: 'onTouched',
  });

  useEffect(() => {
    if (isDoctor) {
      setDoctors([
        {
          id: user?.id,
          name: user?.fullName || user?.username || 'Doctor',
        },
      ]);
      setLoadingDoctors(false);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      setLoadingDoctors(true);
      try {
        const allDoctors = await fetchAllDoctors(get);
        if (cancelled) return;
        setDoctors(allDoctors);
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
      if (isSuperAdmin) {
        const doctorIds = values.doctors ?? [];
        await createGeneralServicesForDoctors(post, {
          name: values.name,
          clinicFees: values.clinicFees,
          doctorIds,
        });
        const count = doctorIds.length;
        showSuccess(
          count === 1 ? 'General service created and assigned.' : `Service assigned to ${count} doctors.`
        );
        const backQuery =
          count === 1 ? `?doctor_id=${encodeURIComponent(doctorIds[0])}` : '';
        navigate(`/general-services${backQuery}`, { replace: false });
        return;
      }

      await post('/general-services', buildGeneralServicePayload(values));
      showSuccess('General service created.');
      navigate('/general-services', { replace: false });
    } catch (err) {
      const msg =
        err?.validationMessage ||
        err?.detail ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not create general service.';
      showError(typeof msg === 'string' ? msg : 'Could not create general service.');
    }
  };

  const backQuery =
    isSuperAdmin && preselectedDoctorId ? `?doctor_id=${encodeURIComponent(preselectedDoctorId)}` : '';

  return (
    <FormPageShell
      title="Add general service"
      description={
        isSuperAdmin
          ? 'Enter the service details, then assign it to one or more doctors.'
          : 'Create a named service with optional clinic fees.'
      }
      headerAction={
        <Button
          variant="outlined"
          onClick={() => navigate(`/general-services${backQuery}`)}
          sx={{ borderRadius: 2 }}
        >
          Back to list
        </Button>
      }
      maxWidth="md"
    >
      {loadingDoctors ? (
        <FormSkeleton />
      ) : (
        <FormProvider {...methods}>
          <GeneralServiceForm
            doctors={doctors}
            showDoctorField={false}
            showDoctorMultiSelect={isSuperAdmin}
            disableDoctor={isDoctor}
            onSubmit={onSubmit}
            submitLabel={isSuperAdmin ? 'Create & assign' : 'Create service'}
          />
        </FormProvider>
      )}
    </FormPageShell>
  );
}
