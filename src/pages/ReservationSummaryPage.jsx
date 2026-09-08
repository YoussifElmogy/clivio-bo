import React, { useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import ReservationSummaryContent from '../components/ReservationSummary/ReservationSummaryContent';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { isDermaClinicMode } from '../constants/clinicMode';
import { isDoctorUser } from '../utils/authRoles';
import { getDoctorAppointmentViewPath } from '../utils/doctorAppointmentNavigation';

export default function ReservationSummaryPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError } = useToast();
  const isDoctor = isDoctorUser(user);

  const patientId = useMemo(() => searchParams.get('patient_id')?.trim() || '', [searchParams]);

  useEffect(() => {
    if (!id) {
      showError('Missing reservation id.');
      navigate('/appointments', { replace: true });
      return;
    }
    if (!patientId) {
      showError('Missing patient id.');
      navigate('/appointments', { replace: true });
      return;
    }
    if (isDoctor && isDermaClinicMode(user)) {
      navigate(
        getDoctorAppointmentViewPath({
          reservationId: id,
          patientId,
          user,
        }),
        { replace: true }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, patientId, navigate, showError, user]);

  if (isDoctor && isDermaClinicMode(user)) {
    return null;
  }

  return (
    <FormPageShell
      title="Appointment summary"
      description="Review reservation details and attachments."
      headerAction={
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {isDoctor && patientId ? (
            <Button
              variant="outlined"
              onClick={() => navigate(`/patients/${encodeURIComponent(patientId)}/profile`)}
              sx={{ borderRadius: 2 }}
            >
              Patient profile
            </Button>
          ) : null}
          <Button variant="outlined" onClick={() => navigate('/appointments')} sx={{ borderRadius: 2 }}>
            Back to appointments
          </Button>
        </Stack>
      }
      paperSx={{ p: { xs: 2, sm: 3 } }}
    >
      {!id || !patientId ? (
        <Typography color="text.secondary">No summary available.</Typography>
      ) : (
        <ReservationSummaryContent reservationId={id} patientId={patientId} dermaMode={false} />
      )}
    </FormPageShell>
  );
}
