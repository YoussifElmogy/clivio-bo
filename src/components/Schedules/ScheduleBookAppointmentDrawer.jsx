import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import EventAvailableOutlined from '@mui/icons-material/EventAvailableOutlined';
import PersonAddAltOutlined from '@mui/icons-material/PersonAddAltOutlined';
import PersonOutlined from '@mui/icons-material/PersonOutlined';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { FormProvider, useForm, Controller } from 'react-hook-form';
import useApi from '../../configs/useApi';
import FormTextField from '../FormTextField/FormTextField';
import PhoneNumberField from '../PhoneNumberField/PhoneNumberField';
import { useToast } from '../../context/ToastContext';
import { DEFAULT_COUNTRY_CODE } from '../../constants/countryPhoneOptions';
import { RESERVATION_STATUS, RESERVATION_STATUS_BOOK_OPTIONS } from '../../constants/reservationStatus';
import {
  buildReservationBookNewPatientPayload,
  buildReservationCreatePayload,
  RESERVATION_BOOK_URL,
  RESERVATIONS_CREATE_URL,
} from '../../payloads/reservationBookPayload';
import {
  buildReservationStatusPatchPayload,
  unwrapReservationId,
} from '../../payloads/reservationPayload';
import { parsePaginatedList } from '../../utils/parsePaginatedList';
import { formatHhmmToAmPm } from '../../utils/timeFormat';
import { validatePhoneByCountry } from '../../utils/phoneNumber';

const NEW_PATIENT_DEFAULTS = {
  first_name: '',
  last_name: '',
  mobile_country_code: DEFAULT_COUNTRY_CODE,
  mobile_number: '',
  date_of_birth: '',
};

function patientFullName(row) {
  const a = String(row?.first_name ?? '').trim();
  const b = String(row?.last_name ?? '').trim();
  if (a || b) return [a, b].filter(Boolean).join(' ');
  const n = row?.name;
  return typeof n === 'string' && n.trim() ? n.trim() : '';
}

function patientMobile(row) {
  const m = row?.mobile_number ?? row?.phone ?? row?.mobile;
  return m != null && String(m).trim() !== '' ? String(m).trim() : '';
}

function patientOptionLabel(row) {
  if (!row || typeof row !== 'object') return '';
  const name = patientFullName(row);
  const mobile = patientMobile(row);
  if (name && mobile) return `${name} · ${mobile}`;
  return name || mobile || `Patient #${row.id ?? ''}`;
}

function patientRowId(row) {
  const raw = row?.id ?? row?.uuid;
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : raw;
}

function AppointmentSummary({ context }) {
  if (!context) return null;
  const dayLabel = context.date && dayjs(context.date).isValid()
    ? dayjs(context.date).format('dddd, MMM D, YYYY')
    : context.date || '—';
  const slotLabel = formatHhmmToAmPm(context.slot) || context.slot || '—';

  return (
    <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 2, bgcolor: 'action.hover' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
        Appointment details
      </Typography>
      <Stack spacing={0.75}>
        <Typography variant="body2">
          <strong>Branch:</strong> {context.branchName || '—'}
        </Typography>
        <Typography variant="body2">
          <strong>Doctor:</strong> {context.doctorName || '—'}
          {context.doctorSpecialty ? ` (${context.doctorSpecialty})` : ''}
        </Typography>
        <Typography variant="body2">
          <strong>Date:</strong> {dayLabel}
        </Typography>
        <Typography variant="body2">
          <strong>Time:</strong> {slotLabel}
        </Typography>
      </Stack>
    </Paper>
  );
}

/**
 * @param {{
 *   open: boolean,
 *   context: {
 *     branchId: string|number,
 *     branchName: string,
 *     doctorId: string|number,
 *     doctorName: string,
 *     doctorSpecialty?: string,
 *     date: string,
 *     slot: string,
 *   } | null,
 *   onClose: () => void,
 *   onBooked?: () => void,
 * }} props
 */
export default function ScheduleBookAppointmentDrawer({ open, context, onClose, onBooked }) {
  const { get, post, patch } = useApi();
  const { showError, showSuccess } = useToast();

  const [mode, setMode] = useState('existing');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientSearchInput, setPatientSearchInput] = useState('');
  const [patientOptions, setPatientOptions] = useState([]);
  const [patientSearchLoading, setPatientSearchLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [appointmentStatus, setAppointmentStatus] = useState(RESERVATION_STATUS.PENDING);
  const [dobPickerOpen, setDobPickerOpen] = useState(false);

  const methods = useForm({ defaultValues: NEW_PATIENT_DEFAULTS, mode: 'onSubmit' });
  const {
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = methods;

  const resetDrawer = useCallback(() => {
    setMode('existing');
    setSelectedPatient(null);
    setPatientSearchInput('');
    setPatientOptions([]);
    setAppointmentStatus(RESERVATION_STATUS.PENDING);
    reset(NEW_PATIENT_DEFAULTS);
    clearErrors();
  }, [clearErrors, reset]);

  useEffect(() => {
    if (!open) {
      resetDrawer();
    }
  }, [open, resetDrawer]);

  useEffect(() => {
    if (!open || mode !== 'existing') return;
    const q = patientSearchInput.trim();
    if (q.length < 2) {
      setPatientOptions([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setPatientSearchLoading(true);
      try {
        const params = new URLSearchParams({
          search: q,
          page: '1',
          page_size: '20',
        });
        const data = await get(`/patients?${params.toString()}`);
        if (cancelled) return;
        const parsed = parsePaginatedList(data, { listKeys: ['patients', 'results'] });
        setPatientOptions(parsed.rows.filter(row => patientRowId(row) != null));
      } catch {
        if (!cancelled) setPatientOptions([]);
      } finally {
        if (!cancelled) setPatientSearchLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, patientSearchInput]);

  const handleClose = useCallback(() => {
    if (submitting) return;
    onClose();
  }, [onClose, submitting]);

  const applyStatusAfterBook = useCallback(
    async postResponse => {
      const nextStatus = String(appointmentStatus ?? '').trim().toLowerCase();
      if (!nextStatus || nextStatus === RESERVATION_STATUS.PENDING) {
        showSuccess('Appointment booked.');
        return;
      }

      const reservationId = unwrapReservationId(postResponse);
      if (reservationId == null) {
        showSuccess('Appointment booked, but status could not be updated.');
        return;
      }

      try {
        await patch(
          `/reservations/${encodeURIComponent(reservationId)}`,
          buildReservationStatusPatchPayload(nextStatus)
        );
        showSuccess('Appointment booked.');
      } catch (err) {
        const msg =
          err?.detail ||
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          'Could not update status.';
        showError(
          typeof msg === 'string'
            ? `Appointment booked, but status could not be updated: ${msg}`
            : 'Appointment booked, but status could not be updated.'
        );
      }
    },
    [appointmentStatus, patch, showError, showSuccess]
  );

  const validateNewPatient = useCallback(values => {
    let ok = true;
    if (!String(values.first_name ?? '').trim()) {
      setError('first_name', { message: 'First name is required' });
      ok = false;
    }
    if (!String(values.last_name ?? '').trim()) {
      setError('last_name', { message: 'Last name is required' });
      ok = false;
    }
    const phoneMsg = validatePhoneByCountry(values.mobile_country_code, values.mobile_number);
    if (phoneMsg) {
      setError('mobile_number', { message: phoneMsg });
      ok = false;
    }
    const dob = String(values.date_of_birth ?? '').trim();
    if (dob && !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      setError('date_of_birth', { message: 'Use YYYY-MM-DD' });
      ok = false;
    }
    return ok;
  }, [setError]);

  const bookExisting = useCallback(async () => {
    if (!context) return;
    const pid = patientRowId(selectedPatient);
    if (pid == null) {
      showError('Select a patient.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = buildReservationCreatePayload({
        patientId: pid,
        branchId: context.branchId,
        doctorId: context.doctorId,
        dateOfVisit: context.date,
        slot: context.slot,
      });
      const created = await post(RESERVATIONS_CREATE_URL, payload);
      await applyStatusAfterBook(created);
      onBooked?.();
      onClose();
    } catch (err) {
      const msg =
        err?.validationMessage ||
        err?.detail ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not book appointment.';
      showError(typeof msg === 'string' ? msg : 'Could not book appointment.');
    } finally {
      setSubmitting(false);
    }
  }, [applyStatusAfterBook, context, onBooked, onClose, post, selectedPatient, showError, showSuccess]);

  const bookNew = useCallback(
    async values => {
      if (!context) return;
      clearErrors();
      if (!validateNewPatient(values)) return;

      setSubmitting(true);
      try {
        const payload = buildReservationBookNewPatientPayload({
          firstName: values.first_name,
          lastName: values.last_name,
          mobileCountryCode: values.mobile_country_code,
          mobileNumber: values.mobile_number,
          dateOfBirth: values.date_of_birth,
          branchId: context.branchId,
          doctorId: context.doctorId,
          dateOfVisit: context.date,
          slot: context.slot,
        });
        const created = await post(RESERVATION_BOOK_URL, payload);
        await applyStatusAfterBook(created);
        onBooked?.();
        onClose();
      } catch (err) {
        const msg =
          err?.validationMessage ||
          err?.detail ||
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          'Could not book appointment.';
        showError(typeof msg === 'string' ? msg : 'Could not book appointment.');
      } finally {
        setSubmitting(false);
      }
    },
    [applyStatusAfterBook, clearErrors, context, onBooked, onClose, post, showError, showSuccess, validateNewPatient]
  );

  const submitDisabled = useMemo(() => {
    if (submitting || !context) return true;
    if (mode === 'existing') return patientRowId(selectedPatient) == null;
    return false;
  }, [context, mode, selectedPatient, submitting]);

  return (
    <Drawer anchor="right" open={open} onClose={handleClose}>
      <Stack
        component="form"
        onSubmit={mode === 'new' ? handleSubmit(bookNew) : e => e.preventDefault()}
        sx={{ width: { xs: '100vw', sm: 440 }, p: 2.5, gap: 2, height: '100%' }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Book appointment
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Reserve this available slot for an existing or new patient.
          </Typography>
        </Box>

        <AppointmentSummary context={context} />

        <ToggleButtonGroup
          exclusive
          fullWidth
          size="small"
          value={mode}
          onChange={(_, next) => {
            if (next) setMode(next);
          }}
          disabled={submitting}
        >
          <ToggleButton value="existing" sx={{ textTransform: 'none', gap: 0.75 }}>
            <PersonOutlined fontSize="small" />
            Existing patient
          </ToggleButton>
          <ToggleButton value="new" sx={{ textTransform: 'none', gap: 0.75 }}>
            <PersonAddAltOutlined fontSize="small" />
            New patient
          </ToggleButton>
        </ToggleButtonGroup>

        <Divider />

        <FormControl fullWidth size="small" disabled={submitting}>
          <InputLabel id="schedule-book-status-label">Appointment status</InputLabel>
          <Select
            labelId="schedule-book-status-label"
            id="schedule-book-status"
            label="Appointment status"
            value={appointmentStatus}
            onChange={e => setAppointmentStatus(e.target.value)}
            sx={{ borderRadius: 2 }}
          >
            {RESERVATION_STATUS_BOOK_OPTIONS.map(o => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {mode === 'existing' ? (
          <Stack spacing={2} sx={{ flex: 1, minHeight: 0 }}>
            <Autocomplete
              options={patientOptions}
              loading={patientSearchLoading}
              value={selectedPatient}
              onChange={(_, next) => setSelectedPatient(next)}
              inputValue={patientSearchInput}
              onInputChange={(_, next) => setPatientSearchInput(next)}
              getOptionLabel={patientOptionLabel}
              isOptionEqualToValue={(a, b) => patientRowId(a) === patientRowId(b)}
              filterOptions={x => x}
              noOptionsText={
                patientSearchInput.trim().length < 2
                  ? 'Type at least 2 characters to search'
                  : 'No patients found'
              }
              renderInput={params => (
                <TextField
                  {...params}
                  label="Search patient"
                  placeholder="Name or mobile number"
                  size="small"
                  disabled={submitting}
                />
              )}
            />
          </Stack>
        ) : (
          <FormProvider {...methods}>
            <Stack spacing={2} sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
              <Controller
                name="first_name"
                control={control}
                render={({ field }) => (
                  <FormTextField
                    field={field}
                    id="schedule-book-first-name"
                    label="First name"
                    required
                    placeholder="e.g. Ahmed"
                    invalid={Boolean(errors.first_name)}
                    errorMessage={errors.first_name?.message}
                    disabled={submitting}
                  />
                )}
              />
              <Controller
                name="last_name"
                control={control}
                render={({ field }) => (
                  <FormTextField
                    field={field}
                    id="schedule-book-last-name"
                    label="Last name"
                    required
                    placeholder="e.g. Rabea"
                    invalid={Boolean(errors.last_name)}
                    errorMessage={errors.last_name?.message}
                    disabled={submitting}
                  />
                )}
              />
              <PhoneNumberField
                control={control}
                countryCodeName="mobile_country_code"
                numberName="mobile_number"
                id="schedule-book-mobile"
                label="Mobile number"
                required
                disabled={submitting}
                numberError={errors.mobile_number}
                countryError={errors.mobile_country_code}
              />
              <ControllerDateOfBirth
                control={control}
                disabled={submitting}
                dobPickerOpen={dobPickerOpen}
                setDobPickerOpen={setDobPickerOpen}
              />
            </Stack>
          </FormProvider>
        )}

        <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ pt: 1 }}>
          <Button onClick={handleClose} disabled={submitting} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          {mode === 'existing' ? (
            <Button
              variant="contained"
              disabled={submitDisabled}
              onClick={bookExisting}
              startIcon={
                submitting ? (
                  <CircularProgress size={18} thickness={5} color="inherit" aria-hidden />
                ) : (
                  <EventAvailableOutlined />
                )
              }
              sx={{ borderRadius: 2 }}
            >
              {submitting ? 'Booking…' : 'Book appointment'}
            </Button>
          ) : (
            <Button
              type="submit"
              variant="contained"
              disabled={submitDisabled}
              startIcon={
                submitting ? (
                  <CircularProgress size={18} thickness={5} color="inherit" aria-hidden />
                ) : (
                  <EventAvailableOutlined />
                )
              }
              sx={{ borderRadius: 2 }}
            >
              {submitting ? 'Booking…' : 'Book appointment'}
            </Button>
          )}
        </Stack>
      </Stack>
    </Drawer>
  );
}

function ControllerDateOfBirth({ control, disabled, dobPickerOpen, setDobPickerOpen }) {
  return (
    <Controller
      name="date_of_birth"
      control={control}
      render={({ field, fieldState }) => (
        <Stack spacing={0.75}>
          <FormLabel error={Boolean(fieldState.error)} sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            Date of birth <Typography component="span" variant="caption" color="text.secondary">(optional)</Typography>
          </FormLabel>
          <DatePicker
            open={dobPickerOpen}
            onOpen={() => setDobPickerOpen(true)}
            onClose={() => setDobPickerOpen(false)}
            value={field.value ? dayjs(field.value) : null}
            onChange={v => {
              field.onChange(v && dayjs(v).isValid() ? dayjs(v).format('YYYY-MM-DD') : '');
            }}
            maxDate={dayjs().startOf('day')}
            format="D/M/YYYY"
            disabled={disabled}
            slotProps={{
              textField: {
                fullWidth: true,
                size: 'small',
                readOnly: true,
                error: Boolean(fieldState.error),
                helperText: fieldState.error?.message,
                placeholder: 'e.g. 20/5/1999',
                onClick: () => setDobPickerOpen(true),
                onKeyDown: e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setDobPickerOpen(true);
                  }
                },
              },
            }}
          />
        </Stack>
      )}
    />
  );
}