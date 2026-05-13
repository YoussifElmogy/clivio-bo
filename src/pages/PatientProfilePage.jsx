import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import AttachFileRounded from '@mui/icons-material/AttachFileRounded';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import LocalPhoneOutlined from '@mui/icons-material/LocalPhoneOutlined';
import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import useApi from '../configs/useApi';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import PaginatedTable from '../components/PaginatedTable/PaginatedTable';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import usePermissions from '../hooks/usePermissions';
import { PERM } from '../config/permissions';
import { isAssistantUser, isDoctorUser, isSuperAdminUser } from '../utils/authRoles';
import { parsePaginatedList } from '../utils/parsePaginatedList';
import { reservationStatusLabel } from '../constants/reservationStatus';
import { formatAttachmentSecondaryLine, formatHhmmToAmPm } from '../utils/timeFormat';

function attachmentViewUrl(row) {
  const raw =
    row?.file_url ||
    row?.url ||
    row?.file ||
    row?.path ||
    row?.attachment_url ||
    row?.download_url ||
    '';
  if (!raw) return '';
  const value = String(raw).trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/')) return value;
  return `/${value.replace(/^\/+/, '')}`;
}

function normalizeReservationsList(data) {
  const parsed = parsePaginatedList(data, { listKeys: ['reservations', 'results'] });
  let total = parsed.total;
  let mode = parsed.mode;
  if (data && typeof data === 'object') {
    if (typeof data.total === 'number' && !Number.isNaN(data.total)) {
      total = data.total;
      mode = 'server';
    } else if (typeof data.count === 'number' && !Number.isNaN(data.count)) {
      total = data.count;
      mode = 'server';
    }
  }
  return { rows: parsed.rows, total, mode };
}

function buildPatientReservationsQuery(page, rowsPerPage, patientId) {
  const params = new URLSearchParams();
  params.set('patient_id', String(patientId));
  params.set('page', String(page + 1));
  params.set('page_size', String(rowsPerPage));
  return params.toString();
}

function patientInitial(name) {
  const s = String(name ?? '').trim();
  if (!s) return '?';
  return s.charAt(0).toUpperCase();
}

/** List/detail APIs may use different keys for the reservation primary key */
function reservationRowId(row) {
  if (!row || typeof row !== 'object') return null;
  const nested = row.reservation && typeof row.reservation === 'object' ? row.reservation : null;
  const raw =
    row.id ??
    row.uuid ??
    row.reservation_id ??
    row.reservationId ??
    row.appointment_id ??
    row.appointmentId ??
    row.pk ??
    nested?.id ??
    nested?.uuid ??
    null;
  if (raw == null || raw === '') return null;
  return raw;
}

/** Prefer row payload, then loaded patient, then route param (handles missing patient_id on list rows). */
function patientContextId(row, patient, patientIdFromRoute, patientIdParam) {
  const fromRow = row?.patient_id ?? row?.patient?.id;
  if (fromRow != null && String(fromRow).trim() !== '') return String(fromRow).trim();
  if (patient?.id != null && String(patient.id).trim() !== '') return String(patient.id).trim();
  if (patientIdFromRoute != null && String(patientIdFromRoute).trim() !== '') return String(patientIdFromRoute).trim();
  const raw = patientIdParam != null ? String(patientIdParam).trim() : '';
  return raw || null;
}

export default function PatientProfilePage() {
  const theme = useTheme();
  const { id: patientIdParam } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { get } = useApi();
  const { showError, showInfo } = useToast();
  const { can } = usePermissions();
  const isDoctor = isDoctorUser(user);
  const blockAppointmentRowNavigation = isSuperAdminUser(user) || isAssistantUser(user);
  const canEditAppointment = can(PERM.EDIT_APPOINTMENT);
  const canViewAppointment = can(PERM.VIEW_APPOINTMENT);

  const patientId = useMemo(() => {
    const raw = patientIdParam?.trim();
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [patientIdParam]);

  const [profileLoading, setProfileLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [attachments, setAttachments] = useState([]);

  const [apptLoading, setApptLoading] = useState(true);
  const [apptRows, setApptRows] = useState([]);
  const [apptTotal, setApptTotal] = useState(0);
  const [apptListMode, setApptListMode] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    if (patientId == null) {
      showError('Invalid patient.');
      navigate('/patients', { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      setProfileLoading(true);
      try {
        const qs = new URLSearchParams({ patient_id: String(patientId) }).toString();
        const data = await get(`/patient-profile?${qs}`);
        if (cancelled) return;
        const p = data?.patient && typeof data.patient === 'object' ? data.patient : null;
        setPatient(p);
        const att = Array.isArray(data?.attachments) ? data.attachments : [];
        setAttachments(att);
      } catch (err) {
        if (!cancelled) {
          const msg =
            err?.detail ||
            err?.response?.data?.detail ||
            err?.response?.data?.message ||
            err?.message ||
            'Could not load patient profile.';
          showError(typeof msg === 'string' ? msg : 'Could not load patient profile.');
          setPatient(null);
          setAttachments([]);
        }
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, navigate, showError]);

  useEffect(() => {
    if (patientId == null) return;
    let cancelled = false;
    (async () => {
      setApptLoading(true);
      try {
        const query = buildPatientReservationsQuery(page, rowsPerPage, patientId);
        const data = await get(`/reservations?${query}`);
        if (cancelled) return;
        const { rows: nextRows, total, mode } = normalizeReservationsList(data);
        setApptRows(nextRows);
        setApptTotal(total);
        setApptListMode(prev => (prev === null ? mode : prev));
      } catch (err) {
        if (!cancelled) {
          const msg =
            err?.detail ||
            err?.response?.data?.detail ||
            err?.response?.data?.message ||
            err?.message ||
            'Could not load appointments.';
          showError(typeof msg === 'string' ? msg : 'Could not load appointments.');
          setApptRows([]);
          setApptTotal(0);
        }
      } finally {
        if (!cancelled) setApptLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, page, rowsPerPage]);

  const displayName = patient?.name?.trim?.() || 'Patient';
  const accent = theme.palette.primary.main;

  const medicalNotesText = useMemo(() => {
    if (!patient || typeof patient !== 'object') return '—';
    const raw =
      patient.medical_notes ??
      patient.medicalNotes ??
      patient.notes ??
      patient.health_notes ??
      '';
    const s = String(raw).trim();
    return s || '—';
  }, [patient]);

  const handleOpenAttachment = useCallback(
    att => {
      const url = attachmentViewUrl(att);
      if (!url) {
        showInfo('No view URL for this file.');
        return;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    },
    [showInfo]
  );

  const handleAppointmentRow = useCallback(
    row => {
      const rid = reservationRowId(row);
      const pid = patientContextId(row, patient, patientId, patientIdParam);
      if (rid == null) {
        showError('Could not open this appointment (missing reservation id).');
        return;
      }
      if (pid == null || pid === '') {
        showError('Missing patient id for this appointment.');
        return;
      }
      if (isDoctor) {
        navigate(`/appointments/${encodeURIComponent(String(rid))}/view?patient_id=${encodeURIComponent(String(pid))}`);
        return;
      }
      if (canEditAppointment) {
        navigate(`/appointments/${encodeURIComponent(String(rid))}/edit`);
        return;
      }
      if (canViewAppointment) {
        navigate(`/appointments/${encodeURIComponent(String(rid))}/view?patient_id=${encodeURIComponent(String(pid))}`);
        return;
      }
      showError('You do not have permission to open this appointment (need view or edit appointment).');
    },
    [
      canEditAppointment,
      canViewAppointment,
      isDoctor,
      navigate,
      patient,
      patientId,
      patientIdParam,
      showError,
    ]
  );

  const apptCount = apptListMode === 'server' ? apptTotal : apptRows.length;
  const paginatedApptRows = useMemo(() => {
    if (apptListMode === 'server' || apptListMode === null) return apptRows;
    return apptRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [apptListMode, apptRows, page, rowsPerPage]);

  const apptColumns = useMemo(
    () => [
      { id: 'visit', label: 'Visit date', minWidth: 120 },
      { id: 'slot', label: 'Time', minWidth: 100 },
      { id: 'branch', label: 'Branch', minWidth: 130 },
      { id: 'doctor', label: 'Doctor', minWidth: 120 },
      { id: 'status', label: 'Status', minWidth: 110 },
    ],
    []
  );

  const getApptCellValue = useCallback((row, col) => {
    if (col.id === 'visit') {
      const d = row.date_of_visit;
      if (d == null || String(d).trim() === '') return '—';
      const s = String(d).trim();
      return s.length >= 10 ? s.slice(0, 10) : s;
    }
    if (col.id === 'slot') {
      const t = row.slot;
      if (t == null || String(t).trim() === '') return '—';
      const hhmm = String(t).trim().slice(0, 5);
      return formatHhmmToAmPm(hhmm) || hhmm;
    }
    if (col.id === 'branch') return row.branch_name?.trim?.() || row.branch?.name?.trim?.() || '—';
    if (col.id === 'doctor') return row.doctor_name?.trim?.() || row.doctor?.name?.trim?.() || '—';
    if (col.id === 'status') return reservationStatusLabel(row.status);
    return '';
  }, []);

  const heroSkeleton = profileLoading && !patient;

  return (
    <FormPageShell
      title="Patient profile"
      description="Overview, files, and appointment history."
      headerAction={
        <Button
          variant="outlined"
          startIcon={<ArrowBackRounded />}
          onClick={() => navigate('/patients')}
          sx={{ borderRadius: 2 }}
        >
          Back to patients
        </Button>
      }
      paperSx={{
        p: { xs: 3, sm: 4 },
        borderRadius: 3.5,
      }}
    >
      <Stack spacing={{ xs: 3.5, sm: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 3.75 },
            borderRadius: 3.5,
            border: '1px solid',
            borderColor: 'divider',
            background: theme =>
              `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 45%, transparent 100%)`,
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 2.5, sm: 3 }} alignItems={{ sm: 'center' }}>
            <Box
              sx={{
                width: { xs: 76, sm: 80 },
                height: { xs: 76, sm: 80 },
                borderRadius: 3.5,
                bgcolor: alpha(accent, 0.15),
                color: accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: { xs: '1.85rem', sm: '1.95rem' },
                fontWeight: 800,
                flexShrink: 0,
                boxShadow: `0 4px 20px ${alpha(accent, 0.12)}`,
              }}
            >
              {heroSkeleton ? '…' : patientInitial(displayName)}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.02, mb: { xs: 1.25, sm: 1.5 } }}>
                {heroSkeleton ? <Box component="span" sx={{ opacity: 0.5 }}>Loading…</Box> : displayName}
              </Typography>
              {!heroSkeleton && patient ? (
                <>
                  <Stack
                    direction="row"
                    flexWrap="wrap"
                    useFlexGap
                    sx={{
                      columnGap: { xs: 2, sm: 2.5 },
                      rowGap: 1.25,
                      alignItems: 'center',
                    }}
                  >
                    {patient.age != null && patient.age !== '' ? (
                      <Chip
                        size="medium"
                        icon={<PersonOutlineRounded />}
                        label={`Age ${patient.age}`}
                        variant="outlined"
                        sx={{ borderRadius: 2, fontWeight: 600 }}
                      />
                    ) : null}
                    {patient.mobile ? (
                      <Chip
                        size="medium"
                        icon={<LocalPhoneOutlined />}
                        label={String(patient.mobile)}
                        variant="outlined"
                        component="a"
                        href={`tel:${String(patient.mobile).replace(/\s/g, '')}`}
                        clickable
                        sx={{ borderRadius: 2, fontWeight: 600 }}
                      />
                    ) : null}
                  </Stack>
                  <Box
                    sx={{
                      mt: 2.5,
                      pt: 2.5,
                      borderTop: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 700, letterSpacing: 0.08, textTransform: 'uppercase', display: 'block' }}
                    >
                      Medical notes
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        mt: 1,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        color: medicalNotesText === '—' ? 'text.secondary' : 'text.primary',
                      }}
                    >
                      {medicalNotesText}
                    </Typography>
                  </Box>
                </>
              ) : null}
            </Box>
          </Stack>
        </Paper>

        <Box>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
            <AttachFileRounded color="primary" sx={{ fontSize: 26 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: -0.01 }}>
              Files & attachments
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, maxWidth: 720 }}>
            Documents linked to this patient. Click view to open in a new tab.
          </Typography>
          {profileLoading && attachments.length === 0 ? (
            <Paper variant="outlined" sx={{ p: { xs: 3.5, sm: 4 }, borderRadius: 2.5, textAlign: 'center' }}>
              <Typography color="text.secondary">Loading attachments…</Typography>
            </Paper>
          ) : attachments.length === 0 ? (
            <Paper variant="outlined" sx={{ p: { xs: 3.5, sm: 4 }, borderRadius: 2.5, textAlign: 'center' }}>
              <Typography color="text.secondary">No attachments yet.</Typography>
            </Paper>
          ) : (
            <Grid container spacing={{ xs: 2, sm: 2.5 }}>
              {attachments.map(att => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={att.id ?? att.file_url ?? att.file_name}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: { xs: 2.5, sm: 3 },
                      height: '100%',
                      borderRadius: 2.5,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                      transition: 'box-shadow 0.2s, border-color 0.2s',
                      '&:hover': {
                        borderColor: alpha(accent, 0.45),
                        boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.06)}`,
                      },
                    }}
                  >
                    <Stack direction="row" spacing={1.25} alignItems="flex-start">
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1.5,
                          bgcolor: alpha(accent, 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: accent,
                          flexShrink: 0,
                        }}
                      >
                        <AttachFileRounded fontSize="small" />
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, wordBreak: 'break-word' }}>
                          {att.file_name || 'Attachment'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          {formatAttachmentSecondaryLine(att) || '—'}
                        </Typography>
                      </Box>
                    </Stack>
                    <Divider sx={{ my: 0.5 }} />
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleOpenAttachment(att)}
                      sx={{ alignSelf: 'flex-start', borderRadius: 2 }}
                    >
                      View file
                    </Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        <Box>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
            <CalendarMonthOutlined color="primary" sx={{ fontSize: 26 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: -0.01 }}>
              Appointments
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, maxWidth: 720 }}>
            {blockAppointmentRowNavigation
              ? 'Appointments are listed for reference only. Use Appointments in the sidebar to open or change a booking.'
              : isDoctor
                ? 'Tap a row to open the appointment summary.'
                : canEditAppointment
                  ? 'Tap a row to edit the appointment.'
                  : canViewAppointment
                    ? 'Tap a row to view appointment details.'
                    : 'Tap a row when you have permission to view or edit appointments.'}
          </Typography>
          <PaginatedTable
            columns={apptColumns}
            rows={paginatedApptRows}
            loading={apptLoading}
            skeletonRows={rowsPerPage}
            emptyMessage="No appointments for this patient."
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={e => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            count={apptCount}
            getRowId={row => {
              const rid = reservationRowId(row);
              return rid != null ? String(rid) : JSON.stringify(row);
            }}
            getCellValue={getApptCellValue}
            onRowClick={blockAppointmentRowNavigation ? undefined : handleAppointmentRow}
          />
        </Box>
      </Stack>
    </FormPageShell>
  );
}
