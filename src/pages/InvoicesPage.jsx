import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import OpenInNewOutlined from '@mui/icons-material/OpenInNewOutlined';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import useApi from '../configs/useApi';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import PaginatedTable from '../components/PaginatedTable/PaginatedTable';
import CustomLoader from '../components/CustomLoader/CustomLoader';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { canPayInvoices } from '../utils/invoicesAccess';
import { isSuperAdminUser } from '../utils/authRoles';
import { getUserBranchIds } from '../utils/userBranchIds';
import { parsePaginatedList } from '../utils/parsePaginatedList';
import {
  buildInvoicesListQuery,
  INVOICES_BRANCH_FILTER_ALL,
  INVOICE_STATUS_FILTER_OPTIONS,
  formatInvoiceMoney,
  invoiceDefaultPayAmount,
  invoiceMaxPayAmount,
  invoicePayUrl,
  invoiceStatusLabel,
  invoiceTypeLabel,
  invoiceViewUrl,
  isInvoicePaidStatus,
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
  if (s === 'partial' || s === 'partially_paid') return 'info';
  if (s === 'pending') return 'warning';
  return 'default';
}

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
  const { user } = useAuth();
  const { get, post } = useApi();
  const { showError, showSuccess, showInfo } = useToast();

  const isSuperAdmin = useMemo(() => isSuperAdminUser(user), [user]);
  const userBranchIds = useMemo(() => getUserBranchIds(user), [user]);
  const canPay = useMemo(() => canPayInvoices(user), [user]);
  const canUseInvoices = isSuperAdmin || userBranchIds.length > 0;

  const [branchOptions, setBranchOptions] = useState([]);
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
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
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [infoTarget, setInfoTarget] = useState(null);

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
          status: statusFilter,
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
  }, [branchFilter, statusFilter, page, rowsPerPage, listVersion, canUseInvoices]);

  const handleBranchFilterChange = useCallback(value => {
    setBranchFilter(value);
    setPage(0);
    setListVersion(v => v + 1);
  }, []);

  const handleStatusFilterChange = useCallback(value => {
    setStatusFilter(value);
    setPage(0);
    setListVersion(v => v + 1);
  }, []);

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
    if (id == null) return;
    setPayTarget(row);
    const defaultAmount = invoiceDefaultPayAmount(row);
    setPayAmount(defaultAmount === '' ? '' : String(defaultAmount));
  }, []);

  const handleConfirmPay = useCallback(async () => {
    if (!payTarget?.id) return;
    setPaySubmitting(true);
    try {
      const result = validateInvoicePayAmount(payAmount, payTarget);
      if (!result.ok) {
        showError(result.message);
        setPaySubmitting(false);
        return;
      }
      await post(invoicePayUrl(payTarget.id), result.payload);
      showSuccess('Payment recorded.');
      setPayTarget(null);
      setPayAmount('');
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
  }, [payAmount, payTarget, post, showError, showSuccess]);

  const count = listMode === 'server' ? totalCount : rows.length;
  const paginatedRows = useMemo(() => {
    if (listMode === 'server' || listMode === null) return rows;
    return rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [listMode, rows, page, rowsPerPage]);

  const columns = useMemo(
    () => [
      { id: 'id', label: 'Invoice #', minWidth: 90 },
      { id: 'patient', label: 'Patient', minWidth: 140 },
      { id: 'branch', label: 'Branch', minWidth: 120 },
      { id: 'doctor', label: 'Doctor', minWidth: 130 },
      { id: 'status', label: 'Status', minWidth: 100 },
      { id: 'subtotal', label: 'Subtotal', minWidth: 100, align: 'right' },
      { id: 'discount', label: 'Discount', minWidth: 100, align: 'right' },
      { id: 'total', label: 'Total', minWidth: 100, align: 'right' },
      { id: 'paid_amount', label: 'Paid', minWidth: 100, align: 'right' },
      { id: 'created', label: 'Created', minWidth: 150 },
      {
        id: 'actions',
        label: 'Actions',
        align: 'right',
        minWidth: 150,
        render: row => {
          const id = row.id ?? row.uuid;
          const paid = isInvoicePaidStatus(row.status);
          const hasUrl = Boolean(invoiceViewUrl(row));
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
              <Tooltip title={paid ? 'Already paid' : canPay ? 'Record payment' : 'No permission'}>
                <span>
                  <IconButton
                    size="small"
                    color="success"
                    aria-label="Record invoice payment"
                    disabled={!canPay || paid || id == null}
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
    if (col.id === 'id') return row.id != null ? `#${row.id}` : '—';
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
    if (col.id === 'created') return formatInvoiceDate(row.created_at);
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
      <CustomLoader active={paySubmitting} />
      <FormPageShell
        title={`Invoices (${count})`}
        description={
          isSuperAdmin
            ? 'View all invoices or filter by branch and status. Open PDFs and mark pending invoices as paid.'
            : 'Filter by branch and status, view invoice PDFs, and mark pending invoices as paid.'
        }
        paperSx={{ p: { xs: 2, sm: 3 } }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          sx={{ mb: 2.5 }}
        >
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 260 } }} disabled={branchesLoading}>
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
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
            <InputLabel id="invoices-status-filter-label">Status</InputLabel>
            <Select
              labelId="invoices-status-filter-label"
              label="Status"
              value={statusFilter}
              onChange={e => handleStatusFilterChange(e.target.value)}
            >
              {INVOICE_STATUS_FILTER_OPTIONS.map(opt => (
                <MenuItem key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <PaginatedTable
          columns={columns}
          rows={paginatedRows}
          loading={loading || branchesLoading}
          skeletonRows={rowsPerPage}
          emptyMessage={
            branchFilter === INVOICES_BRANCH_FILTER_ALL
              ? statusFilter
                ? `No ${statusFilter} invoices found.`
                : 'No invoices found.'
              : branchFilter
                ? statusFilter
                  ? `No ${statusFilter} invoices for this branch.`
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
              <InvoiceInfoRow
                label="Previous remaining"
                value={formatInvoiceMoney(infoTarget.previous_remaining)}
              />
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
    </>
  );
}
