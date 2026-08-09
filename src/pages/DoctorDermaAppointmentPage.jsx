import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import FaceRetouchingNaturalOutlined from '@mui/icons-material/FaceRetouchingNaturalOutlined';
import AccessibilityNewOutlined from '@mui/icons-material/AccessibilityNewOutlined';
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import FlashOnOutlined from '@mui/icons-material/FlashOnOutlined';
import RateReviewOutlined from '@mui/icons-material/RateReviewOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import useApi from '../configs/useApi';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import InteractiveBodyMap from '../components/DermaMapping/InteractiveBodyMap';
import InteractiveFaceMap from '../components/DermaMapping/InteractiveFaceMap';
import AppointmentLaserPackagesTab from '../components/DermaMapping/AppointmentLaserPackagesTab';
import DermaReviewRequestDialog from '../components/DermaMapping/DermaReviewRequestDialog';
import ReservationSummaryContent from '../components/ReservationSummary/ReservationSummaryContent';
import { useToast } from '../context/ToastContext';
import { isDermaClinicMode } from '../constants/clinicMode';
import { resolveDermaAppointmentTabs } from '../config/featureFlags';
import { useAuth } from '../context/AuthContext';
import { isDoctorUser, isSuperAdminUser } from '../utils/authRoles';
import { isReservationInvoicePaid } from '../utils/reservationInvoiceStatus';
import { buildDermaReviewRequestPayload } from '../payloads/dermaReviewRequestPayload';
import { normalizePatientProfilePackages } from '../payloads/appointmentLaserPackagesPayload';
import {
  buildReservationPrescriptionPayload,
  reservationPrescriptionUrl,
} from '../payloads/reservationPrescriptionPayload';
import {
  RESERVATION_PRICING_URL,
  buildReservationPricingFetchKey,
  buildReservationPricingPayload,
  normalizeReservationPricingResponse,
  shouldFetchReservationPricing,
} from '../payloads/reservationPricingPayload';

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
  const { showError, showSuccess } = useToast();
  const isDoctor = isDoctorUser(user);
  const isSuperAdmin = isSuperAdminUser(user);
  const [tab, setTab] = useState(0);
  const [patientName, setPatientName] = useState('');
  const [faceAssignments, setFaceAssignments] = useState({});
  const [bodyAssignments, setBodyAssignments] = useState({});
  const [prescriptionSnapshot, setPrescriptionSnapshot] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState(null);
  const [reservationPricing, setReservationPricing] = useState(null);
  const [reviewDiscount, setReviewDiscount] = useState('');
  const [invoicePaid, setInvoicePaid] = useState(false);
  const [patientPackagesLoading, setPatientPackagesLoading] = useState(false);
  const [pulsePackages, setPulsePackages] = useState([]);
  const [areaPackages, setAreaPackages] = useState([]);
  const [usedPackages, setUsedPackages] = useState([]);

  const patientId = useMemo(() => searchParams.get('patient_id')?.trim() || '', [searchParams]);
  const fromPatientProfile = searchParams.get('from') === 'patient-profile';
  const backPath =
    fromPatientProfile && patientId
      ? `/patients/${encodeURIComponent(patientId)}/profile`
      : '/appointments';

  const handleSummaryLoaded = useCallback(({ invoicePaid: paid, discount }) => {
    setInvoicePaid(!!paid);
    if (paid && discount != null && discount !== '') {
      setReviewDiscount(String(discount));
    }
  }, []);

  useEffect(() => {
    if (!reservationId || !patientId) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const query = new URLSearchParams({
          patient_id: String(patientId),
          reservation_id: String(reservationId),
        }).toString();
        const data = await get(`/reservation-summary?${query}`);
        if (cancelled) return;
        const locked = isReservationInvoicePaid(data);
        setInvoicePaid(locked);
        if (locked) {
          const rawDiscount =
            data?.reservation?.discount ??
            data?.reservation?.discount_amount ??
            data?.discount ??
            '';
          if (rawDiscount !== '' && rawDiscount != null && !Number.isNaN(Number(rawDiscount))) {
            setReviewDiscount(String(rawDiscount));
          }
        }
      } catch {
        // Summary tab will retry; keep editable until status is known.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reservationId, patientId]);

  const reviewViewOnly = invoicePaid || isSuperAdmin;
  const appointmentViewOnly = reviewViewOnly;

  const dermaTabs = resolveDermaAppointmentTabs();

  const visibleTabs = useMemo(() => {
    const tabs = [];
    if (dermaTabs.APPOINTMENT_SUMMARY) {
      tabs.push({ id: 'summary', label: 'Appointment summary', icon: <DescriptionOutlined /> });
    }
    if (dermaTabs.FACE_MAP) {
      tabs.push({ id: 'face', label: 'Face mapping', icon: <FaceRetouchingNaturalOutlined /> });
    }
    if (dermaTabs.BODY_MAP) {
      tabs.push({ id: 'body', label: 'Body mapping', icon: <AccessibilityNewOutlined /> });
    }
    if (dermaTabs.LASER_PACKAGES) {
      tabs.push({ id: 'laser', label: 'Laser packages', icon: <FlashOnOutlined /> });
    }
    return tabs;
  }, [dermaTabs]);

  const activeTabId = visibleTabs[tab]?.id ?? visibleTabs[0]?.id ?? null;

  /** Keep visited tab panels mounted so unsaved summary edits survive tab switches. */
  const [visitedTabIds, setVisitedTabIds] = useState(() =>
    activeTabId ? new Set([activeTabId]) : new Set()
  );

  useEffect(() => {
    if (!activeTabId) return;
    setVisitedTabIds(prev => {
      if (prev.has(activeTabId)) return prev;
      const next = new Set(prev);
      next.add(activeTabId);
      return next;
    });
  }, [activeTabId]);

  useEffect(() => {
    if (tab >= visibleTabs.length) {
      setTab(0);
    }
  }, [visibleTabs.length, tab]);

  const reviewPayload = useMemo(
    () =>
      buildDermaReviewRequestPayload({
        reservationId,
        patientId,
        faceAssignments,
        bodyAssignments,
        prescription: prescriptionSnapshot,
        totalPrice: reservationPricing?.grand_total ?? null,
        lineItems: reservationPricing?.items ?? null,
      }),
    [
      reservationId,
      patientId,
      faceAssignments,
      bodyAssignments,
      prescriptionSnapshot,
      reservationPricing,
    ]
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

  const fetchReservationPricing = useMemo(
    () =>
      shouldFetchReservationPricing({
        prescriptionSnapshot,
        faceAssignments,
        bodyAssignments,
      }),
    [prescriptionSnapshot, faceAssignments, bodyAssignments]
  );

  const pricingFetchKey = useMemo(
    () =>
      buildReservationPricingFetchKey({
        reservationId,
        prescriptionSnapshot,
        faceAssignments,
        bodyAssignments,
      }),
    [reservationId, prescriptionSnapshot, faceAssignments, bodyAssignments]
  );

  useEffect(() => {
    if (!reviewOpen || !reservationId) return undefined;

    if (!pricingFetchKey) {
      setReservationPricing(null);
      setPricingError(null);
      setPricingLoading(false);
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setPricingLoading(true);
      setPricingError(null);
      try {
        const payload = buildReservationPricingPayload({
          reservationId,
          generalServices: prescriptionSnapshot?.general_services ?? null,
        });
        const data = await post(RESERVATION_PRICING_URL, payload);
        if (!cancelled) {
          setReservationPricing(normalizeReservationPricingResponse(data));
        }
      } catch (err) {
        if (!cancelled) {
          setReservationPricing(null);
          setPricingError(apiErrorMessage(err, 'Could not load pricing.'));
        }
      } finally {
        if (!cancelled) setPricingLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // `post` from useApi is not referentially stable; key captures inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewOpen, reservationId, pricingFetchKey]);

  const handleSubmitReviewRequest = async () => {
    if (reviewViewOnly) return;
    const doctorId = Number(user?.id);
    const parsedPatientId = Number(patientId);
    if (!Number.isFinite(doctorId) || doctorId <= 0) {
      showError('Doctor id is missing.');
      return;
    }
    if (!Number.isFinite(parsedPatientId) || parsedPatientId <= 0) {
      showError('Patient id is missing.');
      return;
    }
    if (String(reviewDiscount).trim() !== '') {
      const discountNumber = Number(reviewDiscount);
      if (!Number.isFinite(discountNumber) || discountNumber < 0) {
        showError('Discount must be a valid number.');
        return;
      }
    }

    setReviewSubmitting(true);
    try {
      const payload = buildReservationPrescriptionPayload({
        doctorId,
        patientId: parsedPatientId,
        prescriptionSnapshot,
        discount: reviewDiscount,
        usedPackages,
        pulsePackages,
      });
      await post(reservationPrescriptionUrl(reservationId), payload);
      showSuccess('Review request submitted.');
      navigate('/appointments', { replace: true });
    } catch (err) {
      showError(err?.validationMessage || apiErrorMessage(err, 'Could not submit review request.'));
      setReviewSubmitting(false);
    }
  };

  useEffect(() => {
    const canAccess = (isDoctor || isSuperAdmin) && isDermaClinicMode(user);
    if (!canAccess) {
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
      setPatientPackagesLoading(dermaTabs.LASER_PACKAGES);
      try {
        const data = await get(`/patient-profile?patient_id=${encodeURIComponent(patientId)}`);
        if (cancelled) return;
        const name = data?.patient?.name?.trim?.();
        if (name) setPatientName(name);
        if (dermaTabs.LASER_PACKAGES) {
          const { pulsePackages: pulse, areaPackages: area } = normalizePatientProfilePackages(data);
          setPulsePackages(pulse);
          setAreaPackages(area);
        }
      } catch {
        if (!cancelled) {
          setPatientName('');
          setPulsePackages([]);
          setAreaPackages([]);
        }
      } finally {
        if (!cancelled) setPatientPackagesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationId, patientId, navigate, showError, user, isDoctor, isSuperAdmin]);

  return (
    <FormPageShell
      title={isSuperAdmin ? 'View appointment' : 'Derma appointment'}
      description={
        patientName
          ? isSuperAdmin
            ? `Read-only view for ${patientName}.`
            : `Treatment mapping for ${patientName}.`
          : isSuperAdmin
            ? 'Read-only appointment summary and mapping.'
            : 'Map face and body zones for this visit.'
      }
      headerAction={
        <Button
          variant="outlined"
          startIcon={<ArrowBackRounded />}
          onClick={() => navigate(backPath)}
          sx={{ borderRadius: 2 }}
        >
          {fromPatientProfile ? 'Back to patient profile' : 'Back to appointments'}
        </Button>
      }
      paperSx={{ p: { xs: 2, sm: 3 }, pb: { xs: 10, sm: 11 } }}
    >
      {visibleTabs.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
          No appointment sections are enabled. Turn on tabs in your <code>.env</code> file.
        </Typography>
      ) : (
        <>
          {visibleTabs.length > 1 ? (
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
              {visibleTabs.map((item, index) => (
                <Tab
                  key={item.id}
                  icon={item.icon}
                  iconPosition="start"
                  label={item.label}
                  value={index}
                />
              ))}
            </Tabs>
          ) : null}

          {visitedTabIds.has('summary') ? (
            <Box
              role="tabpanel"
              hidden={activeTabId !== 'summary'}
              sx={{ pt: visibleTabs.length > 1 ? 3 : 0 }}
            >
              <ReservationSummaryContent
                reservationId={reservationId}
                patientId={patientId}
                dermaMode
                readOnly={appointmentViewOnly}
                onPrescriptionSnapshotChange={handlePrescriptionSnapshotChange}
                onSummaryLoaded={handleSummaryLoaded}
              />
            </Box>
          ) : null}

          {visitedTabIds.has('face') ? (
            <Box
              role="tabpanel"
              hidden={activeTabId !== 'face'}
              sx={{ pt: visibleTabs.length > 1 ? 3 : 0 }}
            >
              <InteractiveFaceMap
                reservationId={reservationId}
                patientId={patientId}
                onAssignmentsChange={handleFaceAssignmentsChange}
                readOnly={appointmentViewOnly}
              />
            </Box>
          ) : null}

          {visitedTabIds.has('body') ? (
            <Box
              role="tabpanel"
              hidden={activeTabId !== 'body'}
              sx={{ pt: visibleTabs.length > 1 ? 3 : 0 }}
            >
              <InteractiveBodyMap
                reservationId={reservationId}
                patientId={patientId}
                onAssignmentsChange={handleBodyAssignmentsChange}
                readOnly={appointmentViewOnly}
              />
            </Box>
          ) : null}

          {visitedTabIds.has('laser') ? (
            <Box
              role="tabpanel"
              hidden={activeTabId !== 'laser'}
              sx={{ pt: visibleTabs.length > 1 ? 3 : 0 }}
            >
              <AppointmentLaserPackagesTab
                pulsePackages={pulsePackages}
                areaPackages={areaPackages}
                loading={patientPackagesLoading}
                value={usedPackages}
                onChange={setUsedPackages}
                readOnly={appointmentViewOnly}
              />
            </Box>
          ) : null}
        </>
      )}

      {dermaTabs.APPOINTMENT_SUMMARY ? (
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
            {reviewViewOnly ? 'View review request' : 'Review request'}
          </Button>
        </Box>
      ) : null}

      <DermaReviewRequestDialog
        open={reviewOpen}
        onClose={() => {
          if (!reviewSubmitting) {
            setReviewOpen(false);
            setReviewDiscount('');
          }
        }}
        patientName={patientName}
        reservationId={reservationId}
        reviewPayload={reviewPayload}
        pricingItems={reservationPricing?.items ?? []}
        pricingLoading={pricingLoading}
        pricingError={pricingError}
        grandTotal={reservationPricing?.grand_total ?? reservationPricing?.grand_total_raw}
        currency={reviewPayload?.pricing?.currency ?? 'EGP'}
        discount={reviewDiscount}
        onDiscountChange={setReviewDiscount}
        submitting={reviewSubmitting}
        onSubmit={handleSubmitReviewRequest}
        readOnly={reviewViewOnly}
        showLaserPackages={dermaTabs.LASER_PACKAGES}
        showPricing={fetchReservationPricing}
        usedPackages={usedPackages}
        pulsePackages={pulsePackages}
        areaPackages={areaPackages}
      />
    </FormPageShell>
  );
}
