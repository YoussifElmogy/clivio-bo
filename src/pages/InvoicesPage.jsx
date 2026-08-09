import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import OpenInNewOutlined from '@mui/icons-material/OpenInNewOutlined';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined';
import FileDownloadOutlined from '@mui/icons-material/FileDownloadOutlined';
import FilterAltOutlined from '@mui/icons-material/FilterAltOutlined';
import TextField from '@mui/material/TextField';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import useApi from '../configs/useApi';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import InvoicePaymentSummaryDrawer from '../components/Invoices/InvoicePaymentSummaryDrawer';
import PaginatedTable from '../components/PaginatedTable/PaginatedTable';
import CustomLoader from '../components/CustomLoader/CustomLoader';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { canPayInvoices } from '../utils/invoicesAccess';
import { isSuperAdminUser, isDoctorUser } from '../utils/authRoles';
import { getUserBranchIds } from '../utils/userBranchIds';
import { parsePaginatedList } from '../utils/parsePaginatedList';
import {
  DOCTOR_FILTER_ALL,
  doctorSelectOptions,
  fetchAllDoctors,
} from '../utils/doctorsCatalog';
import {
  buildInvoicesListQuery,
  downloadInvoicesExport,
  INVOICES_BRANCH_FILTER_ALL,
  INVOICE_STATUS_FILTER_OPTIONS,
  formatInvoiceMoney,
  formatInvoiceVisitDate,
  invoiceDefaultPayAmount,
  invoiceMaxPayAmount,
  INVOICE_PAYMENT_TYPE_DEFAULT,
  INVOICE_PAYMENT_TYPE_OPTIONS,
  invoicePayUrl,
  invoiceStatusLabel,
  invoiceTypeLabel,
  invoiceViewUrl,
  isInvoicePaidStatus,
  isInvoiceFree,
  normalizeInvoicesList,
  validateInvoicePayAmount,
} from '../payloads/invoicePayload';

function formatInvoiceDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusChipColor(status) {
  const s = String(status ?? '').toLowerCase();
  if (s === 'paid') return 'success';
  if (s === 'free') return 'default';
  if (s === 'partial' || s === 'partially_paid') return 'info';
  if (s === 'pending') return 'warning';
  return 'default';
}

const VISIT_DATE_PRESETS = [
  { id: 'today', label: 'Today', offset: 0 },
  { id: 'yesterday', label: 'Yesterday', offset: -1 },
];

function InvoiceInfoRow({ label, value }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ py: 0.75 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>
        {value}
      </Typography>
    </Stack>
  );
}

export default function InvoicesPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { get, post } = useApi();
  const { showError, showSuccess, showInfo } = useToast();

  const isSuperAdmin = useMemo(() => isSuperAdminUser(user), [user]);
  const isDoctor = useMemo(() => isDoctorUser(user), [user]);
  const userBranchIds = useMemo(() => getUserBranchIds(user), [user]);
  const canPay = useMemo(() => canPayInvoices(user), [user]);
  const canUseInvoices = isSuperAdmin || userBranchIds.length > 0;

  const initialInvoiceSearch = searchParams.get('search')?.trim() ?? '';

  const [branchOptions, setBranchOptions] = useState([]);
  const [branchFilter, setBranchFilter] = useState('');
  const [statusInput, setStatusInput] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('');
  const [searchInput, setSearchInput] = useState(initialInvoiceSearch);
  const [appliedSearch, setAppliedSearch] = useState(initialInvoiceSearch);
  const [visitDateInput, setVisitDateInput] = useState('');
  const [appliedVisitDate, setAppliedVisitDate] = useState('');
  const [doctorInput, setDoctorInput] = useState('');
  const [appliedDoctorId, setAppliedDoctorId] = useState('');
  const [catalogDoctors, setCatalogDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [listMode, setListMode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [listVersion, setListVersion] = useState(0);
  const [payTarget, setPayTarget] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payPaymentType, setPayPaymentType] = useState(INVOICE_PAYMENT_TYPE_DEFAULT);
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [infoTarget, setInfoTarget] = useState(null);
  const [paymentSummaryOpen, setPaymentSummaryOpen] = useState(false);
  const [exportSubmitting, setExportSubmitting] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportMode, setExportMode] = useState('all');
  const [exportFrom, setExportFrom] = useState('');
  const [exportTo, setExportTo] = useState('');

  useEffect(() => {
    const nextSearch = searchParams.get('search')?.trim() ?? '';
    setSearchInput(prev => (prev === nextSearch ? prev : nextSearch));
    setAppliedSearch(prev => {
      if (prev === nextSearch) return prev;
      setPage(0);
      setListVersion(v => v + 1);
      return nextSearch;
    });
  }, [searchParams]);

  useEffect(() => {
    if (!canUseInvoices) {
      setBranchOptions([]);
      setBranchFilter('');
      setBranchesLoading(false);
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setBranchesLoading(true);
      try {
        const data = await get('/branches?page=1&page_size=100');
        if (cancelled) return;
        const { rows: allBranches } = parsePaginatedList(data, { listKeys: ['branches'] });
        const allowed = isSuperAdmin
          ? allBranches
          : allBranches.filter(b => userBranchIds.includes(Number(b.id)));
        setBranchOptions(allowed);
        setBranchFilter(prev => {
          if (isSuperAdmin) {
            if (prev === INVOICES_BRANCH_FILTER_ALL) return prev;
            if (prev !== '' && allowed.some(b => String(b.id) === String(prev))) return prev;
            return INVOICES_BRANCH_FILTER_ALL;
          }
          if (prev !== '' && userBranchIds.includes(Number(prev))) return prev;
          return allowed.length ? String(allowed[0].id) : String(userBranchIds[0]);
        });
      } catch {
        if (!cancelled) {
          if (isSuperAdmin) {
            setBranchOptions([]);
            setBranchFilter(INVOICES_BRANCH_FILTER_ALL);
          } else {
            setBranchOptions(userBranchIds.map(id => ({ id, name: `Branch #${id}` })));
            setBranchFilter(String(userBranchIds[0]));
          }
        }
      } finally {
        if (!cancelled) setBranchesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseInvoices, isSuperAdmin, userBranchIds.join(',')]);

  useEffect(() => {
    if (!canUseInvoices || isDoctor) {
      setCatalogDoctors([]);
      setDoctorsLoading(false);
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setDoctorsLoading(true);
      try {
        const doctorsRows = await fetchAllDoctors(get);
        if (!cancelled) setCatalogDoctors(doctorsRows);
      } catch {
        if (!cancelled) setCatalogDoctors([]);
      } finally {
        if (!cancelled) setDoctorsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseInvoices, isDoctor]);

  const doctorOptions = useMemo(
    () =>
      doctorSelectOptions(
        catalogDoctors,
        branchFilter === INVOICES_BRANCH_FILTER_ALL ? 'all' : branchFilter
      ),
    [catalogDoctors, branchFilter]
  );

  useEffect(() => {
    if (!doctorInput) return;
    const exists = doctorOptions.some(d => d.id === doctorInput);
    if (!exists) setDoctorInput('');
  }, [doctorInput, doctorOptions]);

  useEffect(() => {
    if (!appliedDoctorId) return;
    const exists = doctorOptions.some(d => d.id === appliedDoctorId);
    if (!exists) {
      setAppliedDoctorId('');
      setListVersion(v => v + 1);
    }
  }, [appliedDoctorId, doctorOptions]);

  useEffect(() => {
    if (!canUseInvoices || branchFilter === '') {
      setLoading(false);
      setRows([]);
      setTotalCount(0);
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const query = buildInvoicesListQuery({
          branchId: branchFilter,
          status: appliedStatus,
          search: appliedSearch,
          visitDate: appliedVisitDate,
          doctorId: appliedDoctorId,
          page: page + 1,
          pageSize: rowsPerPage,
        });
        const data = await get(`/invoices?${query}`);
        if (cancelled) return;
        const parsed = normalizeInvoicesList(data);
        setRows(parsed.rows);
        setTotalCount(parsed.total);
        if (listMode === null) setListMode(parsed.mode);
      } catch (err) {
        if (!cancelled) {
          const msg =
            err?.response?.data?.detail ||
            err?.response?.data?.message ||
            err?.message ||
            'Could not load invoices.';
          showError(typeof msg === 'string' ? msg : 'Could not load invoices.');
          setRows([]);
          setTotalCount(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchFilter, appliedStatus, appliedSearch, appliedVisitDate, appliedDoctorId, page, rowsPerPage, listVersion, canUseInvoices]);

  const handleBranchFilterChange = useCallback(value => {
    setBranchFilter(value);
    setDoctorInput('');
    setAppliedDoctorId('');
    setPage(0);
    setListVersion(v => v + 1);
  }, []);

  const applyFilters = useCallback(() => {
    setAppliedSearch(searchInput.trim());
    setAppliedStatus(statusInput.trim());
    setAppliedVisitDate(visitDateInput.trim());
    setAppliedDoctorId(doctorInput.trim());
    setPage(0);
    setListVersion(v => v + 1);
  }, [searchInput, statusInput, visitDateInput, doctorInput]);

  const applyVisitDatePreset = useCallback(offsetDays => {
    const next = dayjs().add(offsetDays, 'day').format('YYYY-MM-DD');
    setVisitDateInput(next);
    setAppliedVisitDate(next);
    setPage(0);
    setListVersion(v => v + 1);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchInput('');
    setAppliedSearch('');
    setStatusInput('');
    setAppliedStatus('');
    setVisitDateInput('');
    setAppliedVisitDate('');
    setDoctorInput('');
    setAppliedDoctorId('');
    if (isSuperAdmin) {
      setBranchFilter(INVOICES_BRANCH_FILTER_ALL);
    } else if (branchOptions.length > 0) {
      setBranchFilter(String(branchOptions[0].id));
    } else if (userBranchIds.length > 0) {
      setBranchFilter(String(userBranchIds[0]));
    }
    setPage(0);
    setListVersion(v => v + 1);
  }, [isSuperAdmin, branchOptions, userBranchIds]);

  const visitDateValue = visitDateInput ? dayjs(visitDateInput) : null;

  const openExportDialog = useCallback(() => {
    setExportMode('all');
    setExportFrom('');
    setExportTo('');
    setExportDialogOpen(true);
  }, []);

  const handleConfirmExport = useCallback(async () => {
    const isRange = exportMode === 'range';
    const from = String(exportFrom ?? '').trim();
    const to = String(exportTo ?? '').trim();

    if (isRange) {
      if (!from || !to) {
        showError('Select both date from and date to.');
        return;
      }
      if (dayjs(from).isAfter(dayjs(to))) {
        showError('Date from must be on or before date to.');
        return;
      }
    }

    setExportSubmitting(true);
    try {
      await downloadInvoicesExport({
        dateFrom: isRange ? from : undefined,
        dateTo: isRange ? to : undefined,
        doctorId: appliedDoctorId,
      });
      showSuccess('Invoices exported.');
      setExportDialogOpen(false);
    } catch (err) {
      const msg =
        err?.detail ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not export invoices.';
      showError(typeof msg === 'string' ? msg : 'Could not export invoices.');
    } finally {
      setExportSubmitting(false);
    }
  }, [exportMode, exportFrom, exportTo, appliedDoctorId, showError, showSuccess]);

  const handleViewInvoice = useCallback(
    row => {
      const url = invoiceViewUrl(row);
      if (!url) {
        showInfo('No invoice PDF URL for this row.');
        return;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    },
    [showInfo]
  );

  const handleOpenPay = useCallback(row => {
    const id = row.id ?? row.uuid;
    if (id == null || isInvoiceFree(row)) return;
    setPayTarget(row);
    const defaultAmount = invoiceDefaultPayAmount(row);
    setPayAmount(defaultAmount === '' ? '' : String(defaultAmount));
    setPayPaymentType(INVOICE_PAYMENT_TYPE_DEFAULT);
  }, []);

  const handleConfirmPay = useCallback(async () => {
    if (!payTarget?.id) return;
    setPaySubmitting(true);
    try {
      const result = validateInvoicePayAmount(payAmount, payTarget, payPaymentType);
      if (!result.ok) {
        showError(result.message);
        setPaySubmitting(false);
        return;
      }
      await post(invoicePayUrl(payTarget.id), result.payload);
      showSuccess('Payment recorded.');
      setPayTarget(null);
      setPayAmount('');
      setPayPaymentType(INVOICE_PAYMENT_TYPE_DEFAULT);
      setListVersion(v => v + 1);
    } catch (err) {
      showError(
        err?.validationMessage ||
          err?.detail ||
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          'Could not record payment.'
      );
    } finally {
      setPaySubmitting(false);
    }
  }, [payAmount, payPaymentType, payTarget, post, showError, showSuccess]);

  const count = listMode === 'server' ? totalCount : rows.length;
  const paginatedRows = useMemo(() => {
    if (listMode === 'server' || listMode === null) return rows;
    return rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [listMode, rows, page, rowsPerPage]);

  const columns = useMemo(
    () => [
      { id: 'patient', label: 'Patient', minWidth: 140 },
      { id: 'branch', label: 'Branch', minWidth: 120 },
      { id: 'doctor', label: 'Doctor', minWidth: 130 },
      { id: 'status', label: 'Status', minWidth: 100 },
      { id: 'subtotal', label: 'Subtotal', minWidth: 100, align: 'right' },
      { id: 'discount', label: 'Discount', minWidth: 100, align: 'right' },
      { id: 'total', label: 'Total', minWidth: 100, align: 'right' },
      { id: 'paid_amount', label: 'Paid', minWidth: 100, align: 'right' },
      { id: 'visit_date', label: 'Visit date', minWidth: 120 },
      {
        id: 'actions',
        label: 'Actions',
        align: 'right',
        minWidth: 150,
        render: row => {
          const id = row.id ?? row.uuid;
          const paid = isInvoicePaidStatus(row.status);
          const free = isInvoiceFree(row);
          const hasUrl = Boolean(invoiceViewUrl(row));
          const payTooltip = paid
            ? 'Already paid'
            : free
              ? 'Free invoice — no payment needed'
              : canPay
                ? 'Record payment'
                : 'No permission';
          return (
            <>
              <Tooltip title="Patient invoice info">
                <IconButton
                  size="small"
                  color="info"
                  aria-label="Patient invoice info"
                  onClick={() => setInfoTarget(row)}
                >
                  <InfoOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={hasUrl ? 'View invoice PDF' : 'No invoice URL'}>
                <span>
                  <IconButton
                    size="small"
                    color="primary"
                    aria-label="View invoice"
                    disabled={!hasUrl}
                    onClick={() => handleViewInvoice(row)}
                  >
                    <OpenInNewOutlined fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={payTooltip}>
                <span>
                  <IconButton
                    size="small"
                    color="success"
                    aria-label="Record invoice payment"
                    disabled={!canPay || paid || free || id == null}
                    onClick={() => handleOpenPay(row)}
                  >
                    <PaymentsOutlined fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </>
          );
        },
      },
    ],
    [canPay, handleOpenPay, handleViewInvoice]
  );

  const getCellValue = useCallback((row, col) => {
    if (col.id === 'patient') return row.patient_name ?? '—';
    if (col.id === 'branch') return row.branch_name ?? '—';
    if (col.id === 'doctor') return row.doctor_name ?? '—';
    if (col.id === 'status') {
      return (
        <Chip
          label={invoiceStatusLabel(row.status)}
          size="small"
          color={statusChipColor(row.status)}
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
      );
    }
    if (col.id === 'subtotal') return formatInvoiceMoney(row.subtotal);
    if (col.id === 'discount') return formatInvoiceMoney(row.discount);
    if (col.id === 'total') return formatInvoiceMoney(row.total);
    if (col.id === 'paid_amount') return formatInvoiceMoney(row.paid_amount);
    if (col.id === 'visit_date') return formatInvoiceVisitDate(row.visit_date);
    return '';
  }, []);

  if (!canUseInvoices) {
    return (
      <FormPageShell title="Invoices" paperSx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="body2" color="text.secondary">
          No branches are assigned to your account. Contact an administrator.
        </Typography>
      </FormPageShell>
    );
  }

  return (
    <>
      <CustomLoader active={paySubmitting || exportSubmitting} />
      <FormPageShell
        title={`Invoices (${count})`}
        description={
          isSuperAdmin
            ? 'View all invoices or filter by branch, status, patient, or visit date.'
            : 'Filter invoices by branch, status, patient, or visit date.'
        }
        paperSx={{ p: { xs: 2, sm: 3 } }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5 },
            mb: 2,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: theme => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'grey.50'),
          }}
        >
          <Stack spacing={1}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <FilterAltOutlined color="primary" fontSize="small" />
              <Box component="span" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                Filters
              </Box>
            </Stack>

            <Stack direction="row" flexWrap="wrap" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              {VISIT_DATE_PRESETS.map(preset => (
                <Button
                  key={preset.id}
                  size="small"
                  variant="outlined"
                  disabled={loading || branchesLoading}
                  onClick={() => applyVisitDatePreset(preset.offset)}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, mb: 2 }}
                >
                  {preset.label}
                </Button>
              ))}
            </Stack>

            <Stack spacing={1.5}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                alignItems={{ xs: 'stretch', md: 'flex-end' }}
                sx={{ flexWrap: 'wrap' }}
                useFlexGap
              >
                <TextField
                  label="Search"
                  size="small"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      applyFilters();
                    }
                  }}
                  placeholder="Patient name or mobile"
                  sx={{
                    width: { xs: '100%', md: 300 },
                    flexShrink: 0,
                  }}
                />
                <FormControl
                  size="small"
                  sx={{ minWidth: { xs: '100%', md: 200 } }}
                  disabled={branchesLoading}
                >
                  <InputLabel id="invoices-branch-filter-label">Branch</InputLabel>
                  <Select
                    labelId="invoices-branch-filter-label"
                    label="Branch"
                    value={branchFilter}
                    onChange={e => handleBranchFilterChange(e.target.value)}
                  >
                    {isSuperAdmin ? (
                      <MenuItem value={INVOICES_BRANCH_FILTER_ALL}>All branches</MenuItem>
                    ) : null}
                    {branchOptions.map(b => (
                      <MenuItem key={b.id} value={String(b.id)}>
                        {b.name?.trim() || `Branch #${b.id}`}
                      </MenuItem>
                    ))}
                    {!isSuperAdmin && branchOptions.length === 0
                      ? userBranchIds.map(id => (
                          <MenuItem key={id} value={String(id)}>
                            Branch #{id}
                          </MenuItem>
                        ))
                      : null}
                  </Select>
                </FormControl>
                {!isDoctor ? (
                  <FormControl
                    size="small"
                    sx={{ minWidth: { xs: '100%', md: 200 } }}
                    disabled={branchesLoading || doctorsLoading}
                  >
                    <InputLabel id="invoices-doctor-filter-label">Doctor</InputLabel>
                    <Select
                      labelId="invoices-doctor-filter-label"
                      label="Doctor"
                      value={doctorInput}
                      onChange={e => setDoctorInput(e.target.value)}
                    >
                      <MenuItem value={DOCTOR_FILTER_ALL}>
                        <em>All doctors</em>
                      </MenuItem>
                      {doctorOptions.map(d => (
                        <MenuItem key={d.id} value={d.id}>
                          {d.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : null}
                <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 160 } }}>
                  <InputLabel id="invoices-status-filter-label">Status</InputLabel>
                  <Select
                    labelId="invoices-status-filter-label"
                    label="Status"
                    value={statusInput}
                    onChange={e => setStatusInput(e.target.value)}
                  >
                    {INVOICE_STATUS_FILTER_OPTIONS.map(opt => (
                      <MenuItem key={opt.value || 'all'} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <DatePicker
                  label="Visit date"
                  value={visitDateValue?.isValid() ? visitDateValue : null}
                  onChange={v => setVisitDateInput(v?.isValid?.() ? v.format('YYYY-MM-DD') : '')}
                  disabled={loading || branchesLoading}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  sx={{ minWidth: { xs: '100%', md: 180 }, maxWidth: { md: 220 } }}
                />
              </Stack>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                flexWrap="wrap"
                useFlexGap
                sx={{ flexShrink: 0 }}
              >
                <Button
                  variant="contained"
                  onClick={applyFilters}
                  disabled={loading || branchesLoading}
                  sx={{ borderRadius: 2, width: { xs: '100%', sm: 'auto' } }}
                >
                  Apply
                </Button>
                <Button
                  variant="outlined"
                  onClick={clearFilters}
                  disabled={loading || branchesLoading}
                  sx={{ borderRadius: 2, width: { xs: '100%', sm: 'auto' } }}
                >
                  Clear
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PaymentsOutlined />}
                  onClick={() => setPaymentSummaryOpen(true)}
                  disabled={branchesLoading}
                  sx={{ borderRadius: 2, width: { xs: '100%', sm: 'auto' } }}
                >
                  Payment info
                </Button>
                <Button
                  variant="outlined"
                  startIcon={
                    exportSubmitting ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <FileDownloadOutlined />
                    )
                  }
                  onClick={openExportDialog}
                  disabled={branchesLoading || exportSubmitting || loading}
                  sx={{ borderRadius: 2, width: { xs: '100%', sm: 'auto' } }}
                >
                  Export
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </Paper>

        <PaginatedTable
          columns={columns}
          rows={paginatedRows}
          loading={loading || branchesLoading || doctorsLoading}
          skeletonRows={rowsPerPage}
          emptyMessage={
            branchFilter === INVOICES_BRANCH_FILTER_ALL
              ? appliedStatus
                ? `No ${appliedStatus} invoices found.`
                : 'No invoices found.'
              : branchFilter
                ? appliedStatus
                  ? `No ${appliedStatus} invoices for this branch.`
                  : 'No invoices for this branch.'
                : 'Select a branch to load invoices.'
          }
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={e => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          count={count}
          getRowId={row => row.id ?? row.uuid ?? JSON.stringify(row)}
          getCellValue={getCellValue}
        />
      </FormPageShell>

      <Dialog
        open={Boolean(infoTarget)}
        onClose={() => setInfoTarget(null)}
        aria-labelledby="invoice-info-dialog-title"
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle id="invoice-info-dialog-title">Patient invoice info</DialogTitle>
        <DialogContent dividers>
          {infoTarget ? (
            <Box>
              <InvoiceInfoRow
                label="Invoice #"
                value={infoTarget.id != null ? `#${infoTarget.id}` : '—'}
              />
              <InvoiceInfoRow label="Patient" value={infoTarget.patient_name ?? '—'} />
              <InvoiceInfoRow label="Type" value={invoiceTypeLabel(infoTarget.type)} />
              <InvoiceInfoRow label="Status" value={invoiceStatusLabel(infoTarget.status)} />
              <InvoiceInfoRow label="Total" value={formatInvoiceMoney(infoTarget.total)} />
              <InvoiceInfoRow label="Paid amount" value={formatInvoiceMoney(infoTarget.paid_amount)} />
              <InvoiceInfoRow label="Remaining" value={formatInvoiceMoney(infoTarget.remaining)} />
              {infoTarget.branch_name ? (
                <InvoiceInfoRow label="Branch" value={infoTarget.branch_name} />
              ) : null}
              {infoTarget.doctor_name ? (
                <InvoiceInfoRow label="Doctor" value={infoTarget.doctor_name} />
              ) : null}
              {infoTarget.created_at ? (
                <InvoiceInfoRow label="Created" value={formatInvoiceDate(infoTarget.created_at)} />
              ) : null}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setInfoTarget(null)} sx={{ borderRadius: 2 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(payTarget)}
        onClose={() => {
          if (!paySubmitting) {
            setPayTarget(null);
            setPayAmount('');
            setPayPaymentType(INVOICE_PAYMENT_TYPE_DEFAULT);
          }
        }}
        aria-labelledby="pay-invoice-dialog-title"
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle id="pay-invoice-dialog-title">Record payment</DialogTitle>
        <DialogContent>
          {payTarget ? (
            <Stack spacing={2} sx={{ pt: 0.5 }}>
              <Typography variant="body2">
                Patient: <strong>{payTarget.patient_name ?? `Invoice #${payTarget.id}`}</strong>
              </Typography>
              <Stack spacing={0.5}>
                <Typography variant="body2" color="text.secondary">
                  Total: {formatInvoiceMoney(payTarget.total)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Already paid: {formatInvoiceMoney(payTarget.paid_amount)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Remaining: {formatInvoiceMoney(payTarget.remaining)}
                </Typography>
              </Stack>
              <FormControl size="small" fullWidth required>
                <InputLabel id="pay-invoice-type-label">Payment type</InputLabel>
                <Select
                  labelId="pay-invoice-type-label"
                  label="Payment type"
                  value={payPaymentType}
                  onChange={e => setPayPaymentType(Number(e.target.value))}
                  disabled={paySubmitting}
                >
                  {INVOICE_PAYMENT_TYPE_OPTIONS.map(o => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Amount paid"
                type="number"
                size="small"
                fullWidth
                required
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                disabled={paySubmitting}
                inputProps={{
                  min: 0.01,
                  max: invoiceMaxPayAmount(payTarget) ?? undefined,
                  step: '0.01',
                }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">EGP</InputAdornment>,
                }}
                helperText={
                  invoiceMaxPayAmount(payTarget) != null
                    ? `Maximum: ${formatInvoiceMoney(invoiceMaxPayAmount(payTarget))} (remaining balance)`
                    : 'Enter the amount received for this payment.'
                }
              />
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setPayTarget(null);
              setPayAmount('');
              setPayPaymentType(INVOICE_PAYMENT_TYPE_DEFAULT);
            }}
            disabled={paySubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleConfirmPay}
            disabled={paySubmitting || String(payAmount).trim() === ''}
            startIcon={
              paySubmitting ? (
                <CircularProgress size={18} thickness={5} color="inherit" aria-hidden />
              ) : null
            }
          >
            {paySubmitting ? 'Processing…' : 'Confirm payment'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={exportDialogOpen}
        onClose={() => {
          if (!exportSubmitting) setExportDialogOpen(false);
        }}
        aria-labelledby="export-invoices-dialog-title"
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle id="export-invoices-dialog-title">Export invoices</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <RadioGroup
              value={exportMode}
              onChange={e => setExportMode(e.target.value)}
            >
              <FormControlLabel
                value="all"
                control={<Radio />}
                label="Export all invoices"
                disabled={exportSubmitting}
              />
              <FormControlLabel
                value="range"
                control={<Radio />}
                label="Export by date range"
                disabled={exportSubmitting}
              />
            </RadioGroup>
            {exportMode === 'range' ? (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <DatePicker
                  label="Date from"
                  value={exportFrom && dayjs(exportFrom).isValid() ? dayjs(exportFrom) : null}
                  onChange={v => setExportFrom(v?.isValid?.() ? v.format('YYYY-MM-DD') : '')}
                  disabled={exportSubmitting}
                  maxDate={exportTo && dayjs(exportTo).isValid() ? dayjs(exportTo) : undefined}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
                <DatePicker
                  label="Date to"
                  value={exportTo && dayjs(exportTo).isValid() ? dayjs(exportTo) : null}
                  onChange={v => setExportTo(v?.isValid?.() ? v.format('YYYY-MM-DD') : '')}
                  disabled={exportSubmitting}
                  minDate={exportFrom && dayjs(exportFrom).isValid() ? dayjs(exportFrom) : undefined}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Stack>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setExportDialogOpen(false)} disabled={exportSubmitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmExport}
            disabled={exportSubmitting}
            startIcon={
              exportSubmitting ? (
                <CircularProgress size={18} thickness={5} color="inherit" aria-hidden />
              ) : (
                <FileDownloadOutlined />
              )
            }
          >
            {exportSubmitting ? 'Exporting…' : 'Export'}
          </Button>
        </DialogActions>
      </Dialog>

      <InvoicePaymentSummaryDrawer
        open={paymentSummaryOpen}
        onClose={() => setPaymentSummaryOpen(false)}
      />
    </>
  );
}
