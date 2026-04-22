import React, { useEffect, useRef, useState } from 'react';
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
import ReservationStatusField from '../components/PatientAppointment/ReservationStatusField';
import {
  AppointmentFormSkeleton,
  FormSection,
  SectionDivider,
} from '../components/PatientAppointment/appointmentFormLayout';
import { useToast } from '../context/ToastContext';
import { useAppointmentCatalog } from '../hooks/useAppointmentCatalog';
import { useReservationEditForm } from '../hooks/useReservationEditForm';
import { reservationEditDefaultValues } from '../schemas/reservationEditSchema';
import {
  mapReservationApiToForm,
  buildReservationPatchPayload,
  unwrapReservationDetail,
} from '../payloads/reservationPayload';

const API_BASE = '/reservations';

function patientLine(data) {
  if (!data) return '';
  const n = data.patient_name ?? data.patientName;
  if (n != null && String(n).trim()) return String(n).trim();
  const a = String(data.first_name ?? '').trim();
  const b = String(data.last_name ?? '').trim();
  if (a || b) return [a, b].filter(Boolean).join(' ');
  const pid = data.patient_id;
  return pid != null ? `Patient #${pid}` : '';
}

export default function ReservationEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { get, patch } = useApi();
  const { showSuccess, showError } = useToast();
  const [initialLoad, setInitialLoad] = useState(true);
  const [headerPatient, setHeaderPatient] = useState('');
  /** Bumped after GET + reset so name→id enrichment re-runs even if branches/doctors already loaded first. */
  const [reservationLoadedSeq, setReservationLoadedSeq] = useState(0);

  /** Avoid clearing child fields when `reset()` hydrates branch/doctor/day from '' → API values. */
  const prevBranchIdRef = useRef(undefined);
  const prevDoctorIdRef = useRef(undefined);
  const prevAppointmentDayRef = useRef(undefined);
  /** Raw GET body — used to resolve branch/doctor ids from names when API omits ids */
  const apiReservationRef = useRef(null);
  const enrichedFromNamesRef = useRef({ branch: false, doctor: false });

  const methods = useReservationEditForm();
  const { control, watch, setValue, reset, handleSubmit, formState } = methods;
  const branchId = watch('branchId');
  const doctorId = watch('doctorId');
  const appointmentDay = watch('appointmentDay');
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

  /** When GET has branch_name but no branch_id, match catalog after branches load */
  useEffect(() => {
    const snap = apiReservationRef.current;
    if (!snap || loadingBranches || !branches.length) return;
    if (snap.branch_id != null && String(snap.branch_id).trim() !== '') return;
    if (enrichedFromNamesRef.current.branch) return;
    const bn = String(snap.branch_name ?? '').trim();
    if (!bn) return;
    const match = branches.find(
      b => String(b.name ?? '').trim().toLowerCase() === bn.toLowerCase()
    );
    if (match) {
      setValue('branchId', String(match.id), { shouldDirty: false, shouldValidate: true });
      enrichedFromNamesRef.current.branch = true;
    }
  }, [branches, loadingBranches, reservationLoadedSeq, setValue]);

  /** When GET has doctor_name but no doctor_id, match catalog after doctors load */
  useEffect(() => {
    const snap = apiReservationRef.current;
    if (!snap || loadingDoctors || !doctors.length || !hasBranch) return;
    if (snap.doctor_id != null && String(snap.doctor_id).trim() !== '') return;
    if (enrichedFromNamesRef.current.doctor) return;
    const dn = String(snap.doctor_name ?? '').trim();
    if (!dn) return;
    const match = doctors.find(d => {
      const name = String(d.name ?? '').trim().toLowerCase();
      const email = String(d.email ?? '').trim().toLowerCase();
      const q = dn.toLowerCase();
      return name === q || email === q;
    });
    if (match) {
      setValue('doctorId', String(match.id), { shouldDirty: false, shouldValidate: true });
      enrichedFromNamesRef.current.doctor = true;
    }
  }, [doctors, loadingDoctors, hasBranch, reservationLoadedSeq, setValue]);

  useEffect(() => {
    const current = branchId?.trim() ?? '';
    const prev = prevBranchIdRef.current;
    prevBranchIdRef.current = current;
    if (prev === undefined) return;
    if (prev === '' && current !== '') return;
    if (prev === current) return;
    setValue('doctorId', '');
    setValue('appointmentDay', '');
    setValue('appointmentTime', '');
  }, [branchId, setValue]);

  useEffect(() => {
    const current = doctorId?.trim() ?? '';
    const prev = prevDoctorIdRef.current;
    prevDoctorIdRef.current = current;
    if (prev === undefined) return;
    if (prev === '' && current !== '') return;
    if (prev === current) return;
    setValue('appointmentDay', '');
    setValue('appointmentTime', '');
  }, [doctorId, setValue]);

  useEffect(() => {
    const current = appointmentDay?.trim() ?? '';
    const prev = prevAppointmentDayRef.current;
    prevAppointmentDayRef.current = current;
    if (prev === undefined) return;
    if (!hasDoctor) return;
    if (prev === '' && current !== '') return;
    if (prev === current) return;
    setValue('appointmentTime', '');
  }, [appointmentDay, hasDoctor, setValue]);

  useEffect(() => {
    if (!id) {
      showError('Missing appointment id.');
      navigate('/appointments', { replace: true });
      return;
    }
    let cancelled = false;
    /** Clear stale branch/doctor so catalog hooks never run against the previous reservation while loading. */
    setHeaderPatient('');
    apiReservationRef.current = null;
    enrichedFromNamesRef.current = { branch: false, doctor: false };
    prevBranchIdRef.current = undefined;
    prevDoctorIdRef.current = undefined;
    prevAppointmentDayRef.current = undefined;
    reset({ ...reservationEditDefaultValues });
    setInitialLoad(true);

    (async () => {
      try {
        const raw = await get(`${API_BASE}/${encodeURIComponent(id)}`);
        if (cancelled) return;
        const detail = unwrapReservationDetail(raw);
        apiReservationRef.current = detail;
        enrichedFromNamesRef.current = { branch: false, doctor: false };
        setHeaderPatient(patientLine(detail));
        const mapped = mapReservationApiToForm(raw);
        prevBranchIdRef.current = undefined;
        prevDoctorIdRef.current = undefined;
        prevAppointmentDayRef.current = undefined;
        reset({
          ...reservationEditDefaultValues,
          ...mapped,
        });
        setReservationLoadedSeq(v => v + 1);
      } catch (err) {
        if (!cancelled) {
          const msg =
            err?.detail ||
            err?.response?.data?.detail ||
            err?.response?.data?.message ||
            err?.message ||
            'Could not load appointment.';
          showError(typeof msg === 'string' ? msg : 'Could not load appointment.');
          navigate('/appointments', { replace: true });
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
      await patch(`${API_BASE}/${encodeURIComponent(id)}`, buildReservationPatchPayload(values));
      showSuccess('Appointment updated.');
      navigate('/appointments');
    } catch (err) {
      const msg =
        err?.detail ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not update appointment.';
      showError(typeof msg === 'string' ? msg : 'Could not update appointment.');
    }
  };

  return (
    <FormPageShell
      title="Edit appointment"
      description={
        headerPatient
          ? `Update reservation for ${headerPatient}.`
          : 'Update branch, doctor, visit time, and status.'
      }
      maxWidth="md"
      headerAction={
        <Button variant="outlined" onClick={() => navigate('/appointments')} sx={{ borderRadius: 2 }}>
          Back to list
        </Button>
      }
    >
      {initialLoad ? (
        <AppointmentFormSkeleton withStatusSection />
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

          <SectionDivider />

          <FormSection number={3} title="Status">
            <ReservationStatusField control={control} />
          </FormSection>

          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button variant="outlined" onClick={() => navigate('/appointments')} sx={{ borderRadius: 2 }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={formState.isSubmitting || branchHasNoDoctors}
              sx={{ borderRadius: 2, minWidth: 160 }}
            >
              {formState.isSubmitting ? 'Saving…' : 'Save changes'}
            </Button>
          </Stack>
        </Box>
      )}
    </FormPageShell>
  );
}
