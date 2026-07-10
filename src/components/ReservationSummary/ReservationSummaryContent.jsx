import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useApi from '../../configs/useApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { reservationStatusLabel } from '../../constants/reservationStatus';
import { formatAttachmentSecondaryLine } from '../../utils/timeFormat';
import { parsePaginatedList } from '../../utils/parsePaginatedList';
import {
  extractGeneralServiceIdFromSummary,
  extractGeneralServiceIdsFromSummary,
  generalServicesListUrl,
  mapGeneralServiceRow,
} from '../../payloads/generalServicePayload';
import { isReservationInvoicePaid } from '../../utils/reservationInvoiceStatus';
import ViewOnlyBanner from '../DermaMapping/ViewOnlyBanner';

const VISIT_STATUS_OPTIONS = [
  { value: 'arrived', label: 'Arrived' },
  { value: 'finished', label: 'Finished' },
];

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

export function ReservationSummarySkeleton() {
  return (
    <Stack spacing={2.5}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Skeleton variant="text" width={120} height={32} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="75%" />
        <Skeleton variant="text" width="35%" />
        <Skeleton variant="text" width="85%" />
      </Paper>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Skeleton variant="text" width={150} height={32} sx={{ mb: 1 }} />
        <Skeleton variant="rounded" height={56} sx={{ borderRadius: 2 }} />
      </Paper>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Skeleton variant="text" width={120} height={32} sx={{ mb: 1 }} />
        <Skeleton variant="rounded" height={46} sx={{ mb: 1, borderRadius: 2 }} />
        <Skeleton variant="rounded" height={46} sx={{ borderRadius: 2 }} />
      </Paper>
    </Stack>
  );
}

/**
 * @param {{
 *   reservationId: string|number,
 *   patientId: string|number,
 *   dermaMode?: boolean,
 *   onSaveSuccess?: () => void,
 *   onPrescriptionSnapshotChange?: (snapshot: object) => void,
 *   onSummaryLoaded?: (meta: { invoicePaid: boolean, discount: string }) => void,
 *   readOnly?: boolean,
 * }} props
 */
export default function ReservationSummaryContent({
  reservationId,
  patientId,
  dermaMode = false,
  readOnly = false,
  onSaveSuccess,
  onPrescriptionSnapshotChange,
  onSummaryLoaded,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { get, post, del } = useApi();
  const { showError, showInfo, showSuccess } = useToast();
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [statusValue, setStatusValue] = useState('');
  const [generalServiceId, setGeneralServiceId] = useState('');
  const [generalServicePrice, setGeneralServicePrice] = useState('');
  const [summaryGeneralServiceIds, setSummaryGeneralServiceIds] = useState([]);
  const [generalServices, setGeneralServices] = useState([]);
  const [generalServicesLoading, setGeneralServicesLoading] = useState(true);
  const [discount, setDiscount] = useState('');
  const [medicineOptions, setMedicineOptions] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [medicineNameInput, setMedicineNameInput] = useState('');
  const [medicineDescription, setMedicineDescription] = useState('');
  const [medicineRows, setMedicineRows] = useState([]);
  const [savingPrescription, setSavingPrescription] = useState(false);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState(null);

  useEffect(() => {
    if (!reservationId || !patientId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams({
          patient_id: String(patientId),
          reservation_id: String(reservationId),
        }).toString();
        const data = await get(`/reservation-summary?${query}`);
        if (!cancelled) {
          const normalized = data && typeof data === 'object' ? data : null;
          setSummaryData(normalized);
          const currentStatus = String(normalized?.reservation?.status ?? '').trim().toLowerCase();
          setStatusValue(currentStatus === 'finished' ? 'finished' : 'arrived');
          const rawDiscount =
            normalized?.reservation?.discount ??
            normalized?.reservation?.discount_amount ??
            normalized?.discount ??
            '';
          const parsedDiscount =
            rawDiscount === '' || rawDiscount == null || Number.isNaN(Number(rawDiscount))
              ? ''
              : String(rawDiscount);
          setDiscount(parsedDiscount);
          const serviceIds = extractGeneralServiceIdsFromSummary(normalized);
          setSummaryGeneralServiceIds(serviceIds);
          setGeneralServiceId(serviceIds.length ? String(serviceIds[0]) : '');
          const rawServicePrice =
            normalized?.reservation?.general_service_price ??
            normalized?.general_service_price ??
            normalized?.prescription?.general_service_price ??
            '';
          setGeneralServicePrice(
            rawServicePrice === '' || rawServicePrice == null || Number.isNaN(Number(rawServicePrice))
              ? ''
              : String(rawServicePrice)
          );
          onSummaryLoaded?.({
            invoicePaid: isReservationInvoicePaid(normalized),
            discount: parsedDiscount,
          });
        }
      } catch (err) {
        if (!cancelled) {
          const msg =
            err?.detail ||
            err?.response?.data?.detail ||
            err?.response?.data?.message ||
            err?.message ||
            'Could not load appointment summary.';
          showError(typeof msg === 'string' ? msg : 'Could not load appointment summary.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationId, patientId]);

  const invoicePaid = useMemo(() => isReservationInvoicePaid(summaryData), [summaryData]);
  const viewOnly = readOnly || invoicePaid;

  const handleOpenAttachment = att => {
    const url = attachmentViewUrl(att);
    if (!url) {
      showInfo('No view URL found for this attachment.');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDeleteAttachment = async attachmentId => {
    if (!attachmentId) return;
    setDeletingAttachmentId(attachmentId);
    try {
      await del(`/attachments/${encodeURIComponent(attachmentId)}`);
      setSummaryData(prev => {
        if (!prev || typeof prev !== 'object') return prev;
        const nextAttachments = Array.isArray(prev.attachments)
          ? prev.attachments.filter(item => String(item?.id ?? item?.uuid ?? '') !== String(attachmentId))
          : [];
        return { ...prev, attachments: nextAttachments };
      });
      showSuccess('Attachment deleted.');
    } catch (err) {
      const msg =
        err?.detail ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not delete attachment.';
      showError(typeof msg === 'string' ? msg : 'Could not delete attachment.');
    } finally {
      setDeletingAttachmentId(null);
    }
  };

  useEffect(() => {
    const doctorId = user?.id;
    if (!doctorId) {
      setGeneralServices([]);
      setGeneralServicesLoading(false);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      setGeneralServicesLoading(true);
      try {
        const data = await get(generalServicesListUrl(doctorId));
        if (cancelled) return;
        const parsed = parsePaginatedList(data, { listKeys: ['general_services', 'results'] });
        const rows = parsed.rows.map(mapGeneralServiceRow).filter(Boolean);
        setGeneralServices(rows);
      } catch {
        if (!cancelled) setGeneralServices([]);
      } finally {
        if (!cancelled) setGeneralServicesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const selectedGeneralService = useMemo(
    () => generalServices.find(s => String(s.id) === String(generalServiceId)) ?? null,
    [generalServices, generalServiceId]
  );

  useEffect(() => {
    if (!onPrescriptionSnapshotChange || loading) return;
    const selectedId =
      generalServiceId !== '' && !Number.isNaN(Number(generalServiceId))
        ? Number(generalServiceId)
        : null;

    const parsedServicePrice =
      selectedId != null && String(generalServicePrice).trim() !== '' && !Number.isNaN(Number(generalServicePrice))
        ? Number(Number(generalServicePrice).toFixed(2))
        : null;

    onPrescriptionSnapshotChange({
      general_service_id: selectedId,
      general_service_ids:
        selectedId != null ? [selectedId] : dermaMode ? [] : summaryGeneralServiceIds,
      general_service: selectedGeneralService,
      general_service_price: parsedServicePrice,
      visit_type: selectedGeneralService?.name ?? '',
      medicines: medicineRows.map(row => ({
        name: row.name,
        description: row.description,
      })),
      patient: summaryData?.patient ?? null,
      attachments_count: Array.isArray(summaryData?.attachments)
        ? summaryData.attachments.length
        : 0,
    });
  }, [
    loading,
    summaryData,
    generalServiceId,
    generalServicePrice,
    summaryGeneralServiceIds,
    selectedGeneralService,
    medicineRows,
    onPrescriptionSnapshotChange,
  ]);

  const patientMobileDisplay = useMemo(() => {
    if (!summaryData) return '—';
    const raw =
      summaryData.patient?.mobile ??
      summaryData.patient_mobile ??
      summaryData.reservation?.patient_mobile ??
      '';
    const s = String(raw).trim();
    return s || '—';
  }, [summaryData]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await get('/doctor-medicines');
        const rows = Array.isArray(data)
          ? data
          : Array.isArray(data?.doctor_medicines)
            ? data.doctor_medicines
            : Array.isArray(data?.medicines)
              ? data.medicines
              : Array.isArray(data?.results)
                ? data.results
                : [];
        const normalized = rows
          .map(row => {
            const name = String(row?.name ?? '').trim();
            const concentration = String(row?.concentration ?? '').trim();
            const label = [name, concentration].filter(Boolean).join(' - ');
            return {
              id: row?.id ?? row?.medicine_id ?? label,
              label: label || name,
            };
          })
          .filter(item => item.label);
        if (!cancelled) setMedicineOptions(normalized);
      } catch {
        if (!cancelled) setMedicineOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmitPrescription = async () => {
    if (viewOnly) return;
    const doctorId = Number(user?.id);
    const patientValue = summaryData?.patient?.id ?? patientId;
    const parsedPatientId = Number(patientValue);
    if (!Number.isFinite(doctorId) || doctorId <= 0) {
      showError('Doctor id is missing.');
      return;
    }
    if (!Number.isFinite(parsedPatientId) || parsedPatientId <= 0) {
      showError('Patient id is missing.');
      return;
    }
    const parsedGeneralServiceId = Number(generalServiceId);
    if (!Number.isFinite(parsedGeneralServiceId) || parsedGeneralServiceId <= 0) {
      showError('Select a general service.');
      return;
    }

    const medicines = medicineRows.map(item => ({
      description: `${item.name} - ${item.description}`,
    }));
    const payload = {
      doctor_id: doctorId,
      patient_id: parsedPatientId,
      medicines,
      general_service_id: parsedGeneralServiceId,
    };

    if (String(generalServicePrice).trim() !== '') {
      const priceNumber = Number(generalServicePrice);
      if (!Number.isFinite(priceNumber) || priceNumber < 0) {
        showError('General service price must be a valid number.');
        return;
      }
      payload.general_service_price = Number(priceNumber.toFixed(2));
    }

    if (!dermaMode) {
      const discountNumber = String(discount).trim() === '' ? 0 : Number(discount);
      if (!Number.isFinite(discountNumber) || discountNumber < 0) {
        showError('Discount must be a valid number.');
        return;
      }
      payload.discount = Number(discountNumber.toFixed(2));
      payload.status = statusValue || 'arrived';
    }

    setSavingPrescription(true);
    try {
      await post(`/reservations/${encodeURIComponent(reservationId)}/prescription`, payload);
      showSuccess('Prescription saved.');
      if (onSaveSuccess) {
        onSaveSuccess();
      } else if (!dermaMode) {
        navigate('/appointments', { replace: false });
      }
    } catch (err) {
      const msg =
        err?.detail ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not save prescription.';
      showError(typeof msg === 'string' ? msg : 'Could not save prescription.');
    } finally {
      setSavingPrescription(false);
    }
  };

  const handleAddMedicineRow = () => {
    if (viewOnly) return;
    const nameFromSelection =
      typeof selectedMedicine === 'string'
        ? selectedMedicine.trim()
        : String(selectedMedicine?.label ?? '').trim();
    const name = nameFromSelection || medicineNameInput.trim();
    const description = medicineDescription.trim();

    if (!name) {
      showInfo('Choose or type medicine name first.');
      return;
    }
    if (!description) {
      showInfo('Description is required for each medicine.');
      return;
    }

    setMedicineRows(prev => [
      ...prev,
      {
        id: `${Date.now()}-${prev.length}`,
        name,
        description,
      },
    ]);
    setSelectedMedicine(null);
    setMedicineNameInput('');
    setMedicineDescription('');
  };

  if (loading) {
    return <ReservationSummarySkeleton />;
  }

  if (!summaryData) {
    return <Typography color="text.secondary">No summary available.</Typography>;
  }

  return (
    <Stack spacing={2.5}>
      {viewOnly ? <ViewOnlyBanner message="Appointment summary is view only." /> : null}
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderRadius: 2,
          background: theme => `linear-gradient(135deg, ${theme.palette.action.hover} 0%, transparent 65%)`,
        }}
      >
        <Stack spacing={1}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {summaryData?.patient?.name || 'Patient'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Age: {summaryData?.patient?.age ?? '—'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Mobile: {patientMobileDisplay}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Notes: {summaryData?.patient?.medical_notes || '—'}
          </Typography>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
          Attachments
        </Typography>
        {Array.isArray(summaryData?.attachments) && summaryData.attachments.length > 0 ? (
          <List disablePadding>
            {summaryData.attachments.map(att => (
              <ListItem
                key={att.id ?? att.file_url ?? att.file_name}
                disableGutters
                secondaryAction={
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleOpenAttachment(att)}
                      sx={{ borderRadius: 2 }}
                    >
                      View
                    </Button>
                    {!viewOnly ? (
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        disabled={deletingAttachmentId === (att.id ?? att.uuid)}
                        onClick={() => handleDeleteAttachment(att.id ?? att.uuid)}
                        sx={{ borderRadius: 2 }}
                      >
                        {deletingAttachmentId === (att.id ?? att.uuid) ? 'Deleting...' : 'Delete'}
                      </Button>
                    ) : null}
                  </Stack>
                }
              >
                <ListItemText
                  primary={att.file_name || 'Attachment'}
                  secondary={formatAttachmentSecondaryLine(att)}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No attachments.
          </Typography>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.25 }}>
          Prescription
        </Typography>
        <Stack spacing={2}>
          <Autocomplete
            freeSolo
            disabled={viewOnly}
            options={medicineOptions}
            value={selectedMedicine}
            onChange={(_, next) => setSelectedMedicine(next)}
            inputValue={medicineNameInput}
            onInputChange={(_, next) => setMedicineNameInput(next)}
            getOptionLabel={option => (typeof option === 'string' ? option : option?.label ?? '')}
            renderInput={params => (
              <TextField
                {...params}
                size="small"
                label="Medicine name"
                placeholder="Select from list or type custom name"
              />
            )}
          />
          <TextField
            size="small"
            label="Medicine description"
            placeholder="Example: twice daily after meals"
            value={medicineDescription}
            onChange={e => setMedicineDescription(e.target.value)}
            disabled={viewOnly}
          />
          {!viewOnly ? (
            <Button variant="outlined" onClick={handleAddMedicineRow} sx={{ alignSelf: 'flex-start', borderRadius: 2 }}>
              Add medicine
            </Button>
          ) : null}
          <Stack spacing={1}>
            {medicineRows.length ? (
              medicineRows.map(item => (
                <Box
                  key={item.id}
                  sx={{
                    p: 1.25,
                    borderRadius: 2,
                    border: theme => `1px solid ${theme.palette.divider}`,
                    bgcolor: 'background.default',
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {item.name}
                    </Typography>
                    {!viewOnly ? (
                      <Button
                        size="small"
                        color="error"
                        onClick={() => setMedicineRows(prev => prev.filter(row => row.id !== item.id))}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No medicines added yet.
              </Typography>
            )}
          </Stack>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems="flex-start"
        >
          <FormControl fullWidth size="small">
            <FormLabel sx={{ mb: 0.75, color: 'text.secondary', fontSize: '0.875rem', fontWeight: 600 }}>
              {dermaMode ? 'General service (optional)' : 'General service'}
            </FormLabel>
            <Select
              value={generalServiceId}
              onChange={e => {
                const next = e.target.value;
                setGeneralServiceId(next);
                if (next === '' || next == null) setGeneralServicePrice('');
              }}
              disabled={viewOnly || generalServicesLoading || generalServices.length === 0}
              displayEmpty
            >
              <MenuItem value="" disabled={!dermaMode}>
                <em>
                  {generalServicesLoading
                    ? 'Loading services…'
                    : dermaMode
                      ? 'No general service'
                      : 'Select general service'}
                </em>
              </MenuItem>
              {generalServices.map(service => {
                const id = String(service.id);
                return (
                  <MenuItem key={id} value={id}>
                    {service.name}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          {generalServiceId ? (
            <FormControl fullWidth size="small">
              <FormLabel sx={{ mb: 0.75, color: 'text.secondary', fontSize: '0.875rem', fontWeight: 600 }}>
                Price
              </FormLabel>
              <TextField
                fullWidth
                size="small"
                type="number"
                value={generalServicePrice}
                onChange={e => setGeneralServicePrice(e.target.value)}
                disabled={viewOnly}
                placeholder="e.g. 150"
                inputProps={{ min: 0, step: '0.01' }}
              />
            </FormControl>
          ) : null}
          {!dermaMode ? (
            <FormControl fullWidth size="small">
              <FormLabel sx={{ mb: 0.75, color: 'text.secondary', fontSize: '0.875rem', fontWeight: 600 }}>
                Discount
              </FormLabel>
              <TextField
                fullWidth
                size="small"
                type="number"
                value={discount}
                onChange={e => setDiscount(e.target.value)}
                inputProps={{ min: 0, step: '0.01' }}
              />
            </FormControl>
          ) : null}
          {!dermaMode ? (
            <FormControl fullWidth size="small">
              <FormLabel sx={{ mb: 0.75, color: 'text.secondary', fontSize: '0.875rem', fontWeight: 600 }}>
                Status
              </FormLabel>
              <Select
                value={statusValue}
                onChange={e => {
                  const next = e.target.value;
                  setStatusValue(next);
                  if (next === 'finished') {
                    showSuccess('Appointment marked as finished.');
                  } else {
                    showInfo(`Status changed to ${reservationStatusLabel(next)}.`);
                  }
                }}
              >
                {VISIT_STATUS_OPTIONS.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : null}
        </Stack>
      </Paper>

      {!dermaMode ? (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={handleSubmitPrescription}
            disabled={savingPrescription}
            sx={{ borderRadius: 2, minWidth: 150 }}
          >
            {savingPrescription ? 'Saving...' : 'Save changes'}
          </Button>
        </Box>
      ) : null}
    </Stack>
  );
}
