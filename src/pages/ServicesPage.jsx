import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import ClearOutlined from '@mui/icons-material/ClearOutlined';
import useApi from '../configs/useApi';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import PaginatedTable from '../components/PaginatedTable/PaginatedTable';
import CustomLoader from '../components/CustomLoader/CustomLoader';
import { useToast } from '../context/ToastContext';
import { parsePaginatedList } from '../utils/parsePaginatedList';
import { SERVICE_CATEGORY_OPTIONS } from '../schemas/serviceSchema';

function buildServicesListQuery(page, rowsPerPage, nameTrimmed) {
  const params = new URLSearchParams();
  params.set('page', String(page + 1));
  params.set('page_size', String(rowsPerPage));
  if (nameTrimmed) params.set('name', nameTrimmed);
  return params.toString();
}

export default function ServicesPage() {
  const navigate = useNavigate();
  const { get, del } = useApi();
  const { showError, showInfo, showSuccess } = useToast();
  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [listMode, setListMode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [listVersion, setListVersion] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [appliedName, setAppliedName] = useState('');

  const applySearch = useCallback(() => {
    setAppliedName(searchInput.trim());
    setPage(0);
  }, [searchInput]);

  const clearSearch = useCallback(() => {
    setSearchInput('');
    setAppliedName('');
    setPage(0);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const query = buildServicesListQuery(page, rowsPerPage, appliedName.trim());
        const data = await get(`/services?${query}`);
        if (cancelled) return;
        const parsed = parsePaginatedList(data, { listKeys: ['services'] });
        setRows(parsed.rows);
        setTotalCount(parsed.total);
        if (listMode === null) setListMode(parsed.mode);
      } catch (err) {
        if (!cancelled) {
          const msg =
            err?.response?.data?.detail ||
            err?.response?.data?.message ||
            err?.message ||
            'Could not load services.';
          showError(typeof msg === 'string' ? msg : 'Could not load services.');
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
  }, [page, rowsPerPage, listVersion, appliedName]);

  const handleConfirmDelete = useCallback(async () => {
    if (deleteTarget == null) return;
    const { id } = deleteTarget;
    setDeleteSubmitting(true);
    try {
      await del(`/services/${encodeURIComponent(id)}`);
      setDeleteTarget(null);
      showSuccess('Service deleted.');
      if (listMode === 'client') {
        setRows(prev => prev.filter(row => (row.id ?? row.uuid) !== id));
        setTotalCount(c => Math.max(0, c - 1));
      } else {
        setListVersion(v => v + 1);
        setPage(p => {
          const nextTotal = Math.max(0, totalCount - 1);
          const lastPage = Math.max(0, Math.ceil(nextTotal / rowsPerPage) - 1);
          return Math.min(p, lastPage);
        });
      }
    } catch (err) {
      const msg =
        err?.detail ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not delete service.';
      showError(typeof msg === 'string' ? msg : 'Could not delete service.');
    } finally {
      setDeleteSubmitting(false);
    }
  }, [deleteTarget, del, listMode, rowsPerPage, showError, showSuccess, totalCount]);

  const requestDelete = useCallback(
    row => {
      const serviceId = row.id ?? row.uuid;
      if (serviceId == null) {
        showInfo('This row has no id.');
        return;
      }
      setDeleteTarget({
        id: serviceId,
        name: row.name?.trim() || `Service #${serviceId}`,
      });
    },
    [showInfo]
  );

  const count = listMode === 'server' ? totalCount : rows.length;
  const paginatedRows = useMemo(() => {
    if (listMode === 'server' || listMode === null) return rows;
    return rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [listMode, rows, page, rowsPerPage]);

  const columns = useMemo(
    () => [
      { id: 'name', label: 'Name', minWidth: 180 },
      { id: 'category', label: 'Category', minWidth: 120 },
      { id: 'description', label: 'Description', minWidth: 220 },
      {
        id: 'actions',
        label: 'Actions',
        align: 'right',
        minWidth: 100,
        render: row => {
          const serviceId = row.id ?? row.uuid;
          return (
            <>
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  color="primary"
                  aria-label="Edit service"
                  onClick={() => {
                    if (serviceId != null) navigate(`/services/${serviceId}/edit`);
                    else showInfo('This row has no id.');
                  }}
                >
                  <EditOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  color="error"
                  aria-label="Delete service"
                  onClick={() => requestDelete(row)}
                >
                  <DeleteOutlineOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          );
        },
      },
    ],
    [navigate, requestDelete, showInfo]
  );

  const getCellValue = useCallback((row, col) => {
    if (col.id === 'name') return row.name?.trim?.() || '—';
    if (col.id === 'category') {
      const raw = typeof row.category === 'string' ? row.category.trim() : '';
      const opt = SERVICE_CATEGORY_OPTIONS.find(o => o.value === raw);
      return opt?.label ?? (raw ? raw : '—');
    }
    if (col.id === 'description') return row.description?.trim?.() || '—';
    return '';
  }, []);

  return (
    <>
      <CustomLoader active={deleteSubmitting} />
      <FormPageShell
        title={`Services (${count})`}
        headerAction={
          <Button variant="contained" onClick={() => navigate('/services/new')} sx={{ borderRadius: 2 }}>
            Add service
          </Button>
        }
        paperSx={{ p: { xs: 2, sm: 3 } }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          sx={{ mb: 2 }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Search by name…"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applySearch();
              }
            }}
            aria-label="Search services by name"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined color="action" fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: searchInput ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      aria-label="Clear search field"
                      onClick={() => setSearchInput('')}
                      edge="end"
                    >
                      <ClearOutlined fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
            sx={{ flex: 1, minWidth: 0, maxWidth: { sm: 520 } }}
          />
          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            <Button variant="contained" onClick={applySearch} sx={{ borderRadius: 2, px: 2.5 }}>
              Apply
            </Button>
            <Button variant="outlined" onClick={clearSearch} sx={{ borderRadius: 2, px: 2 }}>
              Clear
            </Button>
          </Box>
        </Stack>
        <PaginatedTable
          columns={columns}
          rows={paginatedRows}
          loading={loading}
          emptyMessage="No services yet."
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
        <Dialog
          open={deleteTarget != null}
          onClose={() => !deleteSubmitting && setDeleteTarget(null)}
          aria-labelledby="delete-service-dialog-title"
        >
          <DialogTitle id="delete-service-dialog-title">Delete service?</DialogTitle>
          <DialogContent>
            This cannot be undone.{' '}
            {deleteTarget ? (
              <>
                Remove <strong>{deleteTarget.name}</strong>?
              </>
            ) : null}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDeleteTarget(null)} disabled={deleteSubmitting}>
              Cancel
            </Button>
            <Button
              color="error"
              variant="contained"
              onClick={handleConfirmDelete}
              disabled={deleteSubmitting}
              startIcon={
                deleteSubmitting ? (
                  <CircularProgress size={18} thickness={5} color="inherit" aria-hidden />
                ) : null
              }
            >
              {deleteSubmitting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </FormPageShell>
    </>
  );
}
