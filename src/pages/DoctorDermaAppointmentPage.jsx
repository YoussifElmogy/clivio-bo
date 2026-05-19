import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import FaceRetouchingNaturalOutlined from '@mui/icons-material/FaceRetouchingNaturalOutlined';
import AccessibilityNewOutlined from '@mui/icons-material/AccessibilityNewOutlined';
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import RateReviewOutlined from '@mui/icons-material/RateReviewOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import useApi from '../configs/useApi';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import InteractiveBodyMap from '../components/DermaMapping/InteractiveBodyMap';
import InteractiveFaceMap from '../components/DermaMapping/InteractiveFaceMap';
import DermaReviewRequestDialog from '../components/DermaMapping/DermaReviewRequestDialog';
import ReservationSummaryContent from '../components/ReservationSummary/ReservationSummaryContent';
import { useToast } from '../context/ToastContext';
import { isDermaClinicMode } from '../constants/clinicMode';
import { useAuth } from '../context/AuthContext';
import { isDoctorUser } from '../utils/authRoles';
import {
  buildDermaReviewRequestPayload,
  dermaReviewRequestUrl,
} from '../payloads/dermaReviewRequestPayload';

function TabPanel({ children, value, index }) {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      sx={{ pt: 3, display: value === index ? 'block' : 'none' }}
    >
      {children}
    </Box>
  );
}

function apiErrorMessage(err, fallback) {
  const msg =
    err?.detail ||
    err?.response?.data?.detail ||
    err?.response?.data?.message ||
    err?.message;
  return typeof msg === 'string' ? msg : fallback;
}

export default function DoctorDermaAppointmentPage() {
  const { id: reservationId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { get, post } = useApi();
  const { showError, showInfo, showSuccess } = useToast();
  const [tab, setTab] = useState(0);
  const [patientName, setPatientName] = useState('');
  const [faceAssignments, setFaceAssignments] = useState({});
  const [bodyAssignments, setBodyAssignments] = useState({});
  const [prescriptionSnapshot, setPrescriptionSnapshot] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const patientId = useMemo(() => searchParams.get('patient_id')?.trim() || '', [searchParams]);

  const reviewPayload = useMemo(
    () =>
      buildDermaReviewRequestPayload({
        reservationId,
        patientId,
        faceAssignments,
        bodyAssignments,
        prescription: prescriptionSnapshot,
        totalPrice: null,
      }),
    [reservationId, patientId, faceAssignments, bodyAssignments, prescriptionSnapshot]
  );

  const handleFaceAssignmentsChange = useCallback(record => {
    setFaceAssignments(record ?? {});
  }, []);

  const handleBodyAssignmentsChange = useCallback(record => {
    setBodyAssignments(record ?? {});
  }, []);

  const handlePrescriptionSnapshotChange = useCallback(snapshot => {
    setPrescriptionSnapshot(snapshot);
  }, []);

  const handleSubmitReviewRequest = async () => {
    setReviewSubmitting(true);
    try {
      const payload = reviewPayload;
      await post(dermaReviewRequestUrl(reservationId), payload);
      showSuccess('Review request submitted.');
      setReviewOpen(false);
    } catch (err) {
      const status = err?.status ?? err?.response?.status;
      if (status === 404 || status === 405 || status === 501) {
        showInfo(
          'Review request endpoint is not ready yet. Payload is prepared — check console in development.'
        );
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.info('[derma-review-request]', payload);
        }
        setReviewOpen(false);
        return;
      }
      showError(apiErrorMessage(err, 'Could not submit review request.'));
    } finally {
      setReviewSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isDoctorUser(user) || !isDermaClinicMode(user)) {
      navigate('/appointments', { replace: true });
      return;
    }
    if (!reservationId) {
      showError('Missing appointment id.');
      navigate('/appointments', { replace: true });
      return;
    }
    if (!patientId) {
      showError('Missing patient id.');
      navigate('/appointments', { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await get(`/patient-profile?patient_id=${encodeURIComponent(patientId)}`);
        if (cancelled) return;
        const name = data?.patient?.name?.trim?.();
        if (name) setPatientName(name);
      } catch {
        if (!cancelled) setPatientName('');
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationId, patientId, navigate, showError, user]);

  return (
    <FormPageShell
      title="Derma appointment"
      description={
        patientName
          ? `Treatment mapping for ${patientName}.`
          : 'Map face and body zones for this visit.'
      }
      headerAction={
        <Button
          variant="outlined"
          startIcon={<ArrowBackRounded />}
          onClick={() => navigate('/appointments')}
          sx={{ borderRadius: 2 }}
        >
          Back to appointments
        </Button>
      }
      paperSx={{ p: { xs: 2, sm: 3 }, pb: { xs: 10, sm: 11 } }}
    >
      <Paper variant="outlined" sx={{ borderRadius: 2, mb: 2, px: 2, py: 1.5 }}>
        <Typography variant="body2" color="text.secondary">
          Appointment #{reservationId}
          {patientId ? ` · Patient #${patientId}` : ''}
        </Typography>
      </Paper>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 48 },
        }}
      >
        <Tab icon={<DescriptionOutlined />} iconPosition="start" label="Appointment summary" />
        <Tab icon={<FaceRetouchingNaturalOutlined />} iconPosition="start" label="Face mapping" />
        <Tab icon={<AccessibilityNewOutlined />} iconPosition="start" label="Body mapping" />
      </Tabs>

      <TabPanel value={tab} index={0}>
        <ReservationSummaryContent
          reservationId={reservationId}
          patientId={patientId}
          dermaMode
          onPrescriptionSnapshotChange={handlePrescriptionSnapshotChange}
        />
      </TabPanel>

      <TabPanel value={tab} index={1}>
        <InteractiveFaceMap
          reservationId={reservationId}
          patientId={patientId}
          onAssignmentsChange={handleFaceAssignmentsChange}
        />
      </TabPanel>

      <TabPanel value={tab} index={2}>
        <InteractiveBodyMap
          reservationId={reservationId}
          patientId={patientId}
          onAssignmentsChange={handleBodyAssignmentsChange}
        />
      </TabPanel>

      <Box
        sx={{
          position: 'fixed',
          bottom: { xs: 20, sm: 28 },
          right: { xs: 20, sm: 32 },
          zIndex: theme => theme.zIndex.snackbar,
        }}
      >
        <Button
          variant="contained"
          size="large"
          startIcon={<RateReviewOutlined />}
          onClick={() => setReviewOpen(true)}
          sx={{
            borderRadius: 2,
            px: 3,
            boxShadow: theme => theme.shadows[6],
          }}
        >
          Review request
        </Button>
      </Box>

      <DermaReviewRequestDialog
        open={reviewOpen}
        onClose={() => !reviewSubmitting && setReviewOpen(false)}
        patientName={patientName}
        reservationId={reservationId}
        reviewPayload={reviewPayload}
        totalPrice={reviewPayload?.pricing?.total_price}
        currency={reviewPayload?.pricing?.currency ?? 'EGP'}
        submitting={reviewSubmitting}
        onSubmit={handleSubmitReviewRequest}
      />
    </FormPageShell>
  );
}
