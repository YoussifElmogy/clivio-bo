import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import useApi from '../configs/useApi';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import BranchSelectField from '../components/PatientAppointment/BranchSelectField';
import DoctorSelectField from '../components/PatientAppointment/DoctorSelectField';
import SlotDayField from '../components/PatientAppointment/SlotDayField';
import SlotTimeField from '../components/PatientAppointment/SlotTimeField';
import {
  AppointmentFormSkeleton,
  FormSection,
  SectionDivider,
} from '../components/PatientAppointment/appointmentFormLayout';
import { useToast } from '../context/ToastContext';
import { useAppointmentCatalog } from '../hooks/useAppointmentCatalog';
import { usePatientAppointmentForm } from '../hooks/usePatientAppointmentForm';
import { patientAppointmentDefaultValues } from '../schemas/patientAppointmentSchema';

function patientDisplayName(data) {
  if (!data) return '';
  const a = String(data.first_name ?? '').trim();
  const b = String(data.last_name ?? '').trim();
  if (a || b) return [a, b].filter(Boolean).join(' ');
  const n = data.name;
  return typeof n === 'string' && n.trim() ? n.trim() : '';
}

export default function PatientAppointmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { get, post } = useApi();
  const { showSuccess, showError } = useToast();
  const [patientLoad, setPatientLoad] = useState(true);
  const [patientLabel, setPatientLabel] = useState('');

  const methods = usePatientAppointmentForm();
  const { control, watch, setValue, reset, handleSubmit, formState } = methods;
  const branchId = watch('branchId');
  const doctorId = watch('doctorId');
  const appointmentDay = watch('appointmentDay');
  const appointmentTime = watch('appointmentTime');
  const hasDoctor = Boolean(doctorId?.trim());
  const hasBranch = Boolean(branchId?.trim());

  const {
    doctors,
    branches,
    slotDays,
    timeSlots,
    loadingBranches,
    loadingDoctors,
    loadingSlots,
    loadingTimes,
  } = useAppointmentCatalog(branchId, doctorId, appointmentDay);

  const branchHasNoDoctors = hasBranch && !loadingDoctors && doctors.length === 0;

  useEffect(() => {
    const t = appointmentTime?.trim().slice(0, 5);
    if (!t || !timeSlots?.length) return;
    const row = timeSlots.find(s => {
      const st = s && typeof s === 'object' ? String(s.time ?? '').trim().slice(0, 5) : String(s ?? '').trim();
      return st === t;
    });
    if (row && typeof row === 'object' && row.available === false) {
      setValue('appointmentTime', '');
    }
  }, [timeSlots, appointmentTime, setValue]);

  useEffect(() => {
    setValue('doctorId', '');
    setValue('appointmentDay', '');
    setValue('appointmentTime', '');
  }, [branchId, setValue]);

  useEffect(() => {
    setValue('appointmentDay', '');
    setValue('appointmentTime', '');
  }, [doctorId, setValue]);

  useEffect(() => {
    if (hasDoctor) setValue('appointmentTime', '');
  }, [appointmentDay, hasDoctor, setValue]);

  useEffect(() => {
    if (!id) {
      showError('Missing patient id.');
      navigate('/patients', { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      setPatientLoad(true);
      try {
        const data = await get(`/patients/${encodeURIComponent(id)}`);
        if (cancelled) return;
        const label = patientDisplayName(data);
        setPatientLabel(label || 'Patient');
        reset({
          ...patientAppointmentDefaultValues,
          patientId: String(id),
        });
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
        if (!cancelled) setPatientLoad(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onSubmit = async values => {
    const pid = values.patientId?.trim();
    if (!pid) {
      showError('Missing patient.');
      return;
    }
    try {
      await post('/reservations', {
        patient_id: Number(pid),
        branch_id: Number(values.branchId),
        doctor_id: Number(values.doctorId),
        date_of_visit: String(values.appointmentDay ?? '').trim(),
        slot: String(values.appointmentTime ?? '').trim().slice(0, 5),
      });
      showSuccess('Appointment saved.');
      navigate('/patients');
    } catch (err) {
      const msg =
        err?.detail ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not save appointment.';
      showError(typeof msg === 'string' ? msg : 'Could not save appointment.');
    }
  };

  return (
    <FormPageShell
      title="Book appointment"
      description={patientLabel ? `Schedule a visit for ${patientLabel}.` : 'Schedule a visit.'}
      maxWidth="md"
      headerAction={
        <Button variant="outlined" onClick={() => navigate('/patients')} sx={{ borderRadius: 2 }}>
          Back to patients
        </Button>
      }
    >
      {patientLoad ? (
        <AppointmentFormSkeleton />
      ) : (
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormSection number={1} title="Clinic location & doctor">
            <Stack spacing={3.25}>
              <BranchSelectField control={control} branches={branches} loading={loadingBranches} />
              <DoctorSelectField
                control={control}
                doctors={doctors}
                loading={loadingDoctors}
                branchSelected={hasBranch}
              />
            </Stack>
          </FormSection>

          <SectionDivider />

          <FormSection number={2} title="Preferred day & time">
            <Stack spacing={3.25}>
              <SlotDayField
                control={control}
                slotDays={slotDays}
                loading={loadingBranches || loadingDoctors || loadingSlots}
                hasDoctor={hasDoctor}
                branchSelected={hasBranch}
              />
              {hasDoctor ? (
                <SlotTimeField
                  control={control}
                  timeSlots={timeSlots}
                  loading={loadingTimes}
                  appointmentDay={appointmentDay}
                  timeRequired={hasDoctor}
                />
              ) : null}
            </Stack>
          </FormSection>

          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button variant="outlined" onClick={() => navigate('/patients')} sx={{ borderRadius: 2 }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={formState.isSubmitting || branchHasNoDoctors}
              sx={{ borderRadius: 2, minWidth: 160 }}
            >
              {formState.isSubmitting ? 'Saving…' : 'Save appointment'}
            </Button>
          </Stack>
        </Box>
      )}
    </FormPageShell>
  );
}
