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
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined';
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
  formatInvoiceMoney,
  invoicePayUrl,
  invoiceStatusLabel,
  invoiceViewUrl,
  isInvoicePaidStatus,
  normalizeInvoicesList,
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
  if (s === 'pending') return 'warning';
  return 'default';
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
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [listMode, setListMode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [listVersion, setListVersion] = useState(0);
  const [payTarget, setPayTarget] = useState(null);
  const [paySubmitting, setPaySubmitting] = useState(false);

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
  }, [branchFilter, page, rowsPerPage, listVersion, canUseInvoices]);

  const handleBranchFilterChange = useCallback(value => {
    setBranchFilter(value);
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

  const handleConfirmPay = useCallback(async () => {
    if (!payTarget?.id) return;
    setPaySubmitting(true);
    try {
      await post(invoicePayUrl(payTarget.id));
      showSuccess('Invoice marked as paid.');
      setPayTarget(null);
      setListVersion(v => v + 1);
    } catch (err) {
      const msg =
        err?.detail ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not mark invoice as paid.';
      showError(typeof msg === 'string' ? msg : 'Could not mark invoice as paid.');
    } finally {
      setPaySubmitting(false);
    }
  }, [payTarget, post, showError, showSuccess]);

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
      { id: 'created', label: 'Created', minWidth: 150 },
      {
        id: 'actions',
        label: 'Actions',
        align: 'right',
        minWidth: 120,
        render: row => {
          const id = row.id ?? row.uuid;
          const paid = isInvoicePaidStatus(row.status);
          const hasUrl = Boolean(invoiceViewUrl(row));
          return (
            <>
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
              <Tooltip title={paid ? 'Already paid' : canPay ? 'Mark as paid' : 'No permission'}>
                <span>
                  <IconButton
                    size="small"
                    color="success"
                    aria-label="Mark invoice paid"
                    disabled={!canPay || paid || id == null}
                    onClick={() =>
                      setPayTarget({
                        id,
                        patientName: row.patient_name ?? `Invoice #${id}`,
                      })
                    }
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
    [canPay, handleViewInvoice]
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
            ? 'View all invoices or filter by branch. Open PDFs and mark pending invoices as paid.'
            : 'Filter by branch, view invoice PDFs, and mark pending invoices as paid.'
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
        </Stack>

        <PaginatedTable
          columns={columns}
          rows={paginatedRows}
          loading={loading || branchesLoading}
          skeletonRows={rowsPerPage}
          emptyMessage={
            branchFilter === INVOICES_BRANCH_FILTER_ALL
              ? 'No invoices found.'
              : branchFilter
                ? 'No invoices for this branch.'
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
        open={Boolean(payTarget)}
        onClose={() => !paySubmitting && setPayTarget(null)}
        aria-labelledby="pay-invoice-dialog-title"
      >
        <DialogTitle id="pay-invoice-dialog-title">Mark invoice as paid?</DialogTitle>
        <DialogContent>
          {payTarget ? (
            <Typography variant="body2">
              Confirm payment for <strong>{payTarget.patientName}</strong>. This will call the pay
              endpoint and update the invoice status.
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPayTarget(null)} disabled={paySubmitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleConfirmPay}
            disabled={paySubmitting}
            startIcon={
              paySubmitting ? (
                <CircularProgress size={18} thickness={5} color="inherit" aria-hidden />
              ) : null
            }
          >
            {paySubmitting ? 'Processing…' : 'Mark as paid'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
