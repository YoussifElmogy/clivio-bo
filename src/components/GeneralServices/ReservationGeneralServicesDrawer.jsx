import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import useApi from '../../configs/useApi';
import { useToast } from '../../context/ToastContext';
import GeneralServicesEditor from './GeneralServicesEditor';
import ViewOnlyBanner from '../DermaMapping/ViewOnlyBanner';
import {
  extractGeneralServicesFromSummary,
  fetchAllGeneralServices,
} from '../../payloads/generalServicePayload';
import {
  buildReservationPrescriptionPayload,
  reservationPrescriptionUrl,
} from '../../payloads/reservationPrescriptionPayload';
import { formatHhmmToAmPm } from '../../utils/timeFormat';
import {
  enrichServiceRowsWithCatalog,
  extractPrescriptionContextFromSummary,
  mapGeneralServicesToEditorRows,
  validateGeneralServiceEditorRows,
} from '../../utils/prescriptionSummaryHelpers';

function AppointmentContextSummary({ context }) {
  if (!context) return null;
  const visitDate =
    context.visitDate && String(context.visitDate).trim()
      ? String(context.visitDate).trim().slice(0, 10)
      : '—';
  const visitTime = formatHhmmToAmPm(context.visitSlot) || context.visitSlot || '—';

  return (
    <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 2, bgcolor: 'action.hover' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
        Appointment
      </Typography>
      <Stack spacing={0.75}>
        <Typography variant="body2">
          <strong>Patient:</strong> {context.patientLabel || '—'}
        </Typography>
        <Typography variant="body2">
          <strong>Doctor:</strong> {context.doctorName || '—'}
        </Typography>
        <Typography variant="body2">
          <strong>Branch:</strong> {context.branchName || '—'}
        </Typography>
        <Typography variant="body2">
          <strong>Visit:</strong> {visitDate} · {visitTime}
        </Typography>
      </Stack>
    </Paper>
  );
}

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   onSaved?: () => void,
 *   reservationId: string|number|null,
 *   patientId: string|number|null,
 *   doctorId: string|number|null,
 *   patientLabel?: string,
 *   doctorName?: string,
 *   branchName?: string,
 *   visitDate?: string,
 *   visitSlot?: string,
 *   readOnly?: boolean,
 * }} props
 */
export default function ReservationGeneralServicesDrawer({
  open,
  onClose,
  onSaved,
  reservationId,
  patientId,
  doctorId,
  patientLabel = '',
  doctorName = '',
  branchName = '',
  visitDate = '',
  visitSlot = '',
  readOnly = false,
}) {
  const { get, post } = useApi();
  const { showError, showSuccess } = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serviceRows, setServiceRows] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [mergeContext, setMergeContext] = useState(null);

  useEffect(() => {
    if (!open || !reservationId || !patientId || !doctorId) return undefined;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setCatalogLoading(true);
      setServiceRows([]);
      setCatalog([]);
      setMergeContext(null);
      try {
        const summaryQuery = new URLSearchParams({
          patient_id: String(patientId),
          reservation_id: String(reservationId),
        }).toString();
        const [summaryData, catalogRows] = await Promise.all([
          get(`/reservation-summary?${summaryQuery}`),
          fetchAllGeneralServices(get, doctorId),
        ]);
        if (cancelled) return;

        const servicesFromSummary = extractGeneralServicesFromSummary(summaryData);
        const rows = enrichServiceRowsWithCatalog(
          mapGeneralServicesToEditorRows(servicesFromSummary),
          catalogRows
        );
        setServiceRows(rows);
        setMergeContext(extractPrescriptionContextFromSummary(summaryData));
        setCatalog(catalogRows);
      } catch (err) {
        if (!cancelled) {
          const msg =
            err?.detail ||
            err?.response?.data?.detail ||
            err?.response?.data?.message ||
            err?.message ||
            'Could not load general services.';
          showError(typeof msg === 'string' ? msg : 'Could not load general services.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setCatalogLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reservationId, patientId, doctorId]);

  const handleSave = async () => {
    if (readOnly || saving) return;

    const validationError = validateGeneralServiceEditorRows(serviceRows, { requireAtLeastOne: true });
    if (validationError) {
      showError(validationError);
      return;
    }

    const parsedDoctorId = Number(doctorId ?? mergeContext?.doctorId);
    const parsedPatientId = Number(patientId);
    if (!Number.isFinite(parsedDoctorId) || parsedDoctorId <= 0) {
      showError('Doctor id is missing for this appointment.');
      return;
    }
    if (!Number.isFinite(parsedPatientId) || parsedPatientId <= 0) {
      showError('Patient id is missing.');
      return;
    }

    const payload = buildReservationPrescriptionPayload({
      doctorId: parsedDoctorId,
      patientId: parsedPatientId,
      prescriptionSnapshot: {
        general_services: serviceRows,
        medicines: mergeContext?.medicines ?? [],
      },
      discount: mergeContext?.discount ?? '',
    });

    const discountNumber =
      mergeContext?.discount === '' || mergeContext?.discount == null
        ? 0
        : Number(mergeContext.discount);
    if (!Number.isFinite(discountNumber) || discountNumber < 0) {
      showError('Existing discount on this appointment is invalid.');
      return;
    }
    payload.discount = Number(discountNumber.toFixed(2));
    payload.status = mergeContext?.status || 'arrived';

    setSaving(true);
    try {
      await post(reservationPrescriptionUrl(reservationId), payload);
      showSuccess('General services saved.');
      onSaved?.();
      onClose();
    } catch (err) {
      const msg =
        err?.detail ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not save general services.';
      showError(typeof msg === 'string' ? msg : 'Could not save general services.');
    } finally {
      setSaving(false);
    }
  };

  const appointmentContext = {
    patientLabel,
    doctorName,
    branchName,
    visitDate,
    visitSlot,
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={saving ? undefined : onClose}
    >
      <Stack sx={{ width: { xs: '100vw', sm: 430 }, p: 2.5, gap: 2, height: '100%' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            General services
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Add services and prices for this appointment.
          </Typography>
        </Box>

        <AppointmentContextSummary context={appointmentContext} />

        {readOnly ? (
          <ViewOnlyBanner message="Invoice is paid — general services cannot be changed." />
        ) : null}

        <Divider />

        <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          {loading ? (
            <Stack alignItems="center" justifyContent="center" sx={{ pt: 5 }}>
              <CircularProgress size={28} />
            </Stack>
          ) : (
            <GeneralServicesEditor
              rows={serviceRows}
              onRowsChange={setServiceRows}
              catalog={catalog}
              catalogLoading={catalogLoading}
              disabled={readOnly || saving}
              emptyMessage="Search and add general services above."
            />
          )}
        </Box>

        {!readOnly ? (
          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ pt: 1 }}>
            <Button onClick={onClose} disabled={saving} sx={{ borderRadius: 2 }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading || saving}
              startIcon={
                saving ? (
                  <CircularProgress size={18} thickness={5} color="inherit" aria-hidden />
                ) : (
                  <SaveOutlined />
                )
              }
              sx={{ borderRadius: 2 }}
            >
              {saving ? 'Saving…' : 'Save services'}
            </Button>
          </Stack>
        ) : null}
      </Stack>
    </Drawer>
  );
}
