import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha } from '@mui/material/styles';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import useApi from '../configs/useApi';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import ScheduleBookAppointmentDrawer from '../components/Schedules/ScheduleBookAppointmentDrawer';
import ScheduleDatePickerDay from '../components/Schedules/ScheduleDatePickerDay';
import { useToast } from '../context/ToastContext';
import { formatHhmmToAmPm } from '../utils/timeFormat';
import {
  clampBookableVisitDateIso,
  isBookableVisitDate,
  minBookableVisitDate,
  minBookableVisitDateIso,
} from '../utils/scheduleBooking';

function todayIsoDate() {
  return minBookableVisitDateIso();
}

function normalizeAvailabilityResponse(data, context = {}) {
  if (!data || typeof data !== 'object') {
    return { date: '', branches: [] };
  }

  const date = typeof data.date === 'string' ? data.date : '';
  const selectedBranchId = context.branchId ? String(context.branchId) : '';
  const selectedDoctorId = context.doctorId ? String(context.doctorId) : '';
  const branchLabelFromOptions =
    context.branchName || (selectedBranchId ? `Branch #${selectedBranchId}` : 'Selected branch');
  const doctorLabelFromOptions =
    context.doctorName || (selectedDoctorId ? `Doctor #${selectedDoctorId}` : 'Selected doctor');

  // Shape A: { branches: [{ id, name, doctors: [...] }] }
  if (Array.isArray(data.branches)) {
    return { date, branches: data.branches };
  }

  // Shape B: { branch: { id, name }, doctors: [...] }
  if (data.branch && typeof data.branch === 'object' && Array.isArray(data.doctors)) {
    return {
      date,
      branches: [
        {
          id: data.branch.id,
          name: data.branch.name,
          doctors: data.doctors,
        },
      ],
    };
  }

  // Shape C: { slots: [...] } (typically with branch_id + doctor_id query)
  if (Array.isArray(data.slots)) {
    return {
      date,
      branches: [
        {
          id: selectedBranchId || 'selected-branch',
          name: branchLabelFromOptions,
          doctors: [
            {
              id: selectedDoctorId || 'selected-doctor',
              name: doctorLabelFromOptions,
              specialty: context.doctorSpecialty || '',
              slots: data.slots,
            },
          ],
        },
      ],
    };
  }

  return { date, branches: [] };
}

function buildAvailabilityQuery({ date, branchId, doctorId }) {
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  if (branchId) params.set('branch_id', String(branchId));
  if (doctorId) params.set('doctor_id', String(doctorId));
  return params.toString();
}

function branchOptionsFromBranches(branches) {
  return (branches || [])
    .map(branch => ({
      id: String(branch?.id ?? ''),
      name: String(branch?.name ?? '').trim() || `Branch #${branch?.id ?? ''}`,
    }))
    .filter(b => b.id)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function normalizeDoctorsList(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.doctors)) return data.doctors;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

function normalizeBranchesList(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.branches)) return data.branches;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

function doctorOptionsFromDoctors(doctors, branchId) {
  const bid = String(branchId ?? '').trim();
  return (doctors || [])
    .filter(doctor => {
      if (!bid) return true;
      const branches = Array.isArray(doctor?.assigned_branches) ? doctor.assigned_branches : [];
      return branches.some(b => String(b?.id ?? '') === bid);
    })
    .map(doctor => ({
      id: String(doctor?.id ?? ''),
      name: String(doctor?.name ?? '').trim() || `Doctor #${doctor?.id ?? ''}`,
      specialty: String(doctor?.specialty ?? '').trim(),
    }))
    .filter(d => d.id)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function AvailabilitySkeleton() {
  return (
    <Stack spacing={2}>
      {[0, 1].map(idx => (
        <Card key={idx} variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent>
            <Skeleton variant="text" width="30%" height={34} />
            <Grid container spacing={1.5}>
              {[0, 1].map(docIdx => (
                <Grid key={docIdx} size={{ xs: 12, md: 6 }}>
                  <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="45%" sx={{ mb: 1 }} />
                    <Stack direction="row" spacing={0.75}>
                      <Skeleton variant="rounded" width={120} height={26} />
                      <Skeleton variant="rounded" width={130} height={26} />
                    </Stack>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

export default function SchedulesPage() {
  const { get } = useApi();
  const { showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [availability, setAvailability] = useState({ date: '', branches: [] });

  const [dateInput, setDateInput] = useState(todayIsoDate());
  const [branchInput, setBranchInput] = useState('');
  const [doctorInput, setDoctorInput] = useState('');

  const [appliedDate, setAppliedDate] = useState(todayIsoDate());
  const [appliedBranchId, setAppliedBranchId] = useState('');
  const [appliedDoctorId, setAppliedDoctorId] = useState('');

  const [optionsBranches, setOptionsBranches] = useState([]);
  const [catalogDoctors, setCatalogDoctors] = useState([]);
  const [bookDrawerOpen, setBookDrawerOpen] = useState(false);
  const [bookContext, setBookContext] = useState(null);
  const [availabilityRefreshKey, setAvailabilityRefreshKey] = useState(0);

  const openBookDrawer = useCallback((ctx) => {
    setBookContext(ctx);
    setBookDrawerOpen(true);
  }, []);

  const handleAppointmentBooked = useCallback(() => {
    setAvailabilityRefreshKey(k => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCatalogLoading(true);
      try {
        const branchesPromise = get('/public/branches');
        const doctorsPromise = (async () => {
          const pageSize = 100;
          let page = 1;
          let safety = 0;
          const all = [];
          while (safety < 200) {
            const data = await get(`/doctors?page=${page}&page_size=${pageSize}`);
            const rows = normalizeDoctorsList(data);
            all.push(...rows);
            const totalRaw = Number(data?.total ?? data?.count);
            const total = Number.isFinite(totalRaw) ? totalRaw : all.length;
            if (rows.length === 0 || rows.length < pageSize || all.length >= total) break;
            page += 1;
            safety += 1;
          }
          return all;
        })();

        const [branchesData, doctorsRows] = await Promise.all([branchesPromise, doctorsPromise]);
        if (cancelled) return;
        const branchRows = normalizeBranchesList(branchesData);
        const branchOpts = branchOptionsFromBranches(branchRows);
        setOptionsBranches(branchOpts);
        setCatalogDoctors(doctorsRows);
      } catch (err) {
        if (cancelled) return;
        const msg =
          err?.detail ||
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          'Could not load branches/doctors filters.';
        showError(typeof msg === 'string' ? msg : 'Could not load branches/doctors filters.');
        setOptionsBranches([]);
        setCatalogDoctors([]);
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // `get` changes identity each render from useApi hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const query = buildAvailabilityQuery({
          date: appliedDate,
          branchId: appliedBranchId,
          doctorId: appliedDoctorId,
        });
        const data = await get(`/public/availability?${query}`);
        if (cancelled) return;
        const selectedBranch = optionsBranches.find(b => b.id === appliedBranchId);
        const selectedDoctor = catalogDoctors.find(d => String(d?.id ?? '') === String(appliedDoctorId));
        setAvailability(
          normalizeAvailabilityResponse(data, {
            branchId: appliedBranchId,
            doctorId: appliedDoctorId,
            branchName: selectedBranch?.name || '',
            doctorName: selectedDoctor?.name || '',
            doctorSpecialty: selectedDoctor?.specialty || '',
          })
        );
      } catch (err) {
        if (cancelled) return;
        const msg =
          err?.detail ||
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          'Could not load schedule availability.';
        showError(typeof msg === 'string' ? msg : 'Could not load schedule availability.');
        setAvailability({ date: appliedDate, branches: [] });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // `get` changes identity each render from useApi hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedDate, appliedBranchId, appliedDoctorId, availabilityRefreshKey]);

  const displayedDate = availability.date || appliedDate;
  const doctorOptions = useMemo(
    () => doctorOptionsFromDoctors(catalogDoctors, branchInput),
    [catalogDoctors, branchInput]
  );
  const displayedBranches = useMemo(() => {
    const allBranches = Array.isArray(availability.branches) ? availability.branches : [];
    const byBranch = appliedBranchId
      ? allBranches.filter(b => String(b?.id ?? '') === String(appliedBranchId))
      : allBranches;

    if (!appliedDoctorId) return byBranch;

    return byBranch
      .map(branch => {
        const doctors = Array.isArray(branch?.doctors) ? branch.doctors : [];
        const filteredDoctors = doctors.filter(d => String(d?.id ?? '') === String(appliedDoctorId));
        return { ...branch, doctors: filteredDoctors };
      })
      .filter(branch => Array.isArray(branch.doctors) && branch.doctors.length > 0);
  }, [availability.branches, appliedBranchId, appliedDoctorId]);

  const applyFilters = () => {
    const nextDate = clampBookableVisitDateIso(dateInput);
    if (dateInput && !isBookableVisitDate(dateInput)) {
      showError('Appointments can only be booked for today or a future date.');
      setDateInput(nextDate);
    }
    setAppliedDate(nextDate);
    setAppliedBranchId(branchInput);
    setAppliedDoctorId(doctorInput);
  };

  const clearFilters = () => {
    const today = todayIsoDate();
    setDateInput(today);
    setBranchInput('');
    setDoctorInput('');
    setAppliedDate(today);
    setAppliedBranchId('');
    setAppliedDoctorId('');
  };

  useEffect(() => {
    if (!doctorInput) return;
    const exists = doctorOptions.some(d => d.id === doctorInput);
    if (!exists) setDoctorInput('');
  }, [doctorInput, doctorOptions]);

  const dateValue = useMemo(() => (dateInput ? dayjs(dateInput) : null), [dateInput]);

  const minVisitDate = useMemo(() => minBookableVisitDate(), []);
  const minVisitDateIso = useMemo(() => minBookableVisitDateIso(), []);
  const scheduleDaySlot = useMemo(
    () => pickerProps => <ScheduleDatePickerDay {...pickerProps} minBookableDate={minVisitDateIso} />,
    [minVisitDateIso]
  );

  return (
    <FormPageShell
      title="Schedule Availability"
      description="Check available and reserved doctor slots for a specific date."
      paperSx={{ p: { xs: 2, sm: 3 } }}
    >
      <Stack spacing={2} sx={{ mb: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', md: 'flex-end' }}
          flexWrap="wrap"
          useFlexGap
        >
          <DatePicker
            label="Date"
            value={dateValue?.isValid() ? dateValue : null}
            onChange={v =>
              setDateInput(v?.isValid?.() ? clampBookableVisitDateIso(v.format('YYYY-MM-DD')) : todayIsoDate())
            }
            minDate={minVisitDate}
            disabled={loading || catalogLoading}
            slots={{ day: scheduleDaySlot }}
            slotProps={{ textField: { size: 'small', fullWidth: true } }}
            sx={{ minWidth: { xs: '100%', md: 180 }, maxWidth: { md: 220 } }}
          />

          <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 220 } }}>
            <InputLabel id="availability-branch-label">Branch</InputLabel>
            <Select
              labelId="availability-branch-label"
              label="Branch"
              value={branchInput}
              onChange={e => {
                setBranchInput(e.target.value);
                setDoctorInput('');
              }}
            >
              <MenuItem value="">
                <em>All branches</em>
              </MenuItem>
              {optionsBranches.map(branch => (
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 240 } }}>
            <InputLabel id="availability-doctor-label">Doctor</InputLabel>
            <Select
              labelId="availability-doctor-label"
              label="Doctor"
              value={doctorInput}
              onChange={e => setDoctorInput(e.target.value)}
            >
              <MenuItem value="">
                <em>All doctors</em>
              </MenuItem>
              {doctorOptions.map(doctor => (
                <MenuItem key={doctor.id} value={doctor.id}>
                  {doctor.name}
                  {doctor.specialty ? ` (${doctor.specialty})` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
            <Button variant="contained" onClick={applyFilters} sx={{ borderRadius: 2 }}>
              Apply
            </Button>
            <Button variant="outlined" onClick={clearFilters} sx={{ borderRadius: 2 }}>
              Clear
            </Button>
          </Stack>
        </Stack>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Showing slots for: <strong>{displayedDate || '—'}</strong>
      </Typography>

      {catalogLoading || loading ? (
        <AvailabilitySkeleton />
      ) : displayedBranches.length === 0 ? (
        <Alert severity="info">No availability data found for this filter/date.</Alert>
      ) : (
        <Stack spacing={2}>
          {displayedBranches.map(branch => {
            const doctors = Array.isArray(branch?.doctors) ? branch.doctors : [];
            return (
              <Card key={String(branch?.id ?? branch?.name)} variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    {branch?.name || `Branch #${branch?.id ?? ''}`}
                  </Typography>

                  {doctors.length === 0 ? (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      No doctors found for this branch.
                    </Alert>
                  ) : (
                    <Grid container spacing={1.5}>
                      {doctors.map(doctor => {
                        const slots = Array.isArray(doctor?.slots) ? doctor.slots : [];
                        return (
                          <Grid key={String(doctor?.id ?? doctor?.name)} size={{ xs: 12, md: 6 }}>
                            <Box
                              sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 2,
                                p: 1.5,
                                height: '100%',
                              }}
                            >
                              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                {doctor?.name || `Doctor #${doctor?.id ?? ''}`}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {doctor?.specialty || 'No specialty'}
                              </Typography>
                              {slots.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">
                                  No slots for this date.
                                </Typography>
                              ) : (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                                  {slots.map((slot, idx) => {
                                    const raw = String(slot?.time ?? '').trim();
                                    const hhmm = raw.length >= 5 ? raw.slice(0, 5) : raw;
                                    const isAvailable = Boolean(slot?.available);
                                    const canBook =
                                      isAvailable && isBookableVisitDate(displayedDate);
                                    return (
                                      <Chip
                                        key={`${doctor?.id}-${hhmm}-${idx}`}
                                        size="small"
                                        label={`${formatHhmmToAmPm(hhmm) || hhmm} · ${
                                          isAvailable ? 'Available' : 'Reserved'
                                        }`}
                                        color={isAvailable ? 'success' : 'error'}
                                        variant={isAvailable ? 'outlined' : 'filled'}
                                        onClick={
                                          canBook
                                            ? () =>
                                                openBookDrawer({
                                                  branchId: branch?.id,
                                                  branchName: branch?.name || '',
                                                  doctorId: doctor?.id,
                                                  doctorName: doctor?.name || '',
                                                  doctorSpecialty: doctor?.specialty || '',
                                                  date: displayedDate,
                                                  slot: hhmm,
                                                })
                                            : undefined
                                        }
                                        sx={
                                          canBook
                                            ? theme => ({
                                                cursor: 'pointer',
                                                '&:hover': {
                                                  bgcolor: alpha(theme.palette.success.main, 0.14),
                                                  borderColor: theme.palette.success.main,
                                                  color: theme.palette.success.dark,
                                                },
                                              })
                                            : undefined
                                        }
                                      />
                                    );
                                  })}
                                </Box>
                              )}
                            </Box>
                          </Grid>
                        );
                      })}
                    </Grid>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}
      <ScheduleBookAppointmentDrawer
        open={bookDrawerOpen}
        context={bookContext}
        onClose={() => setBookDrawerOpen(false)}
        onBooked={handleAppointmentBooked}
      />
    </FormPageShell>
  );
}
