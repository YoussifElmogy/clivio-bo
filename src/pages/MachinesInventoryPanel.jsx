import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import ClearOutlined from '@mui/icons-material/ClearOutlined';
import useApi from '../configs/useApi';
import PaginatedTable from '../components/PaginatedTable/PaginatedTable';
import CustomLoader from '../components/CustomLoader/CustomLoader';
import { useToast } from '../context/ToastContext';
import { parsePaginatedList } from '../utils/parsePaginatedList';
import { servicesCatalogUrl } from '../utils/servicesCatalogUrl';

function buildMachinesListQuery(page, rowsPerPage, nameTrimmed, serviceId) {
  const params = new URLSearchParams();
  params.set('page', String(page + 1));
  params.set('page_size', String(rowsPerPage));
  if (nameTrimmed) params.set('name', nameTrimmed);
  if (serviceId !== '' && serviceId != null) params.set('service_id', String(serviceId));
  return params.toString();
}

export default function MachinesInventoryPanel({ onListCountChange } = {}) {
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
  const [serviceInput, setServiceInput] = useState('');
  const [appliedServiceId, setAppliedServiceId] = useState('');
  const [serviceOptions, setServiceOptions] = useState([]);

  const applySearch = useCallback(() => {
    setAppliedName(searchInput.trim());
    setAppliedServiceId(serviceInput);
    setPage(0);
  }, [searchInput, serviceInput]);

  const clearSearch = useCallback(() => {
    setSearchInput('');
    setAppliedName('');
    setServiceInput('');
    setAppliedServiceId('');
    setPage(0);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await get(servicesCatalogUrl('machine'));
        if (cancelled) return;
        const parsed = parsePaginatedList(data, { listKeys: ['services'] });
        setServiceOptions(parsed.rows);
      } catch {
        if (!cancelled) setServiceOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const query = buildMachinesListQuery(page, rowsPerPage, appliedName.trim(), appliedServiceId);
        const data = await get(`/machines?${query}`);
        if (cancelled) return;
        const parsed = parsePaginatedList(data, { listKeys: ['machines'] });
        setRows(parsed.rows);
        setTotalCount(parsed.total);
        if (listMode === null) setListMode(parsed.mode);
        const listCount = parsed.mode === 'server' ? parsed.total : parsed.rows.length;
        if (!cancelled) onListCountChange?.(listCount);
      } catch (err) {
        if (!cancelled) {
          const msg =
            err?.response?.data?.detail ||
            err?.response?.data?.message ||
            err?.message ||
            'Could not load machines.';
          showError(typeof msg === 'string' ? msg : 'Could not load machines.');
          setRows([]);
          setTotalCount(0);
          onListCountChange?.(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, listVersion, appliedName, appliedServiceId]);

  const handleConfirmDelete = useCallback(async () => {
    if (deleteTarget == null) return;
    const { id } = deleteTarget;
    setDeleteSubmitting(true);
    try {
      await del(`/machines/${encodeURIComponent(id)}`);
      setDeleteTarget(null);
      showSuccess('Machine deleted.');
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
        'Could not delete machine.';
      showError(typeof msg === 'string' ? msg : 'Could not delete machine.');
    } finally {
      setDeleteSubmitting(false);
    }
  }, [deleteTarget, del, listMode, rowsPerPage, showError, showSuccess, totalCount]);

  const requestDelete = useCallback(
    row => {
      const machineId = row.id ?? row.uuid;
      if (machineId == null) {
        showInfo('This row has no id.');
        return;
      }
      setDeleteTarget({
        id: machineId,
        name: row.name?.trim() || `Machine #${machineId}`,
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
      { id: 'name', label: 'Name', minWidth: 170 },
      { id: 'service', label: 'Service', minWidth: 150 },
      { id: 'type', label: 'Type', minWidth: 100 },
      { id: 'price', label: 'Price', minWidth: 110 },
      { id: 'description', label: 'Description', minWidth: 200 },
      {
        id: 'actions',
        label: 'Actions',
        align: 'right',
        minWidth: 100,
        render: row => {
          const machineId = row.id ?? row.uuid;
          return (
            <>
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  color="primary"
                  aria-label="Edit machine"
                  onClick={() => {
                    if (machineId != null) navigate(`/inventory/machines/${machineId}/edit`);
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
                  aria-label="Delete machine"
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
    if (col.id === 'service') return row.service_name?.trim?.() || row.service?.name?.trim?.() || '—';
    if (col.id === 'type') return row.type?.trim?.() || '—';
    if (col.id === 'price') return row.price != null && row.price !== '' ? row.price : '—';
    if (col.id === 'description') {
      const d = row.description?.trim?.();
      if (!d) return '—';
      return d.length > 80 ? `${d.slice(0, 80)}…` : d;
    }
    return '';
  }, []);

  return (
    <>
      <CustomLoader active={deleteSubmitting} />
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        alignItems={{ xs: 'stretch', md: 'center' }}
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
          aria-label="Search machines by name"
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
                    aria-label="Clear name field"
                    onClick={() => setSearchInput('')}
                    edge="end"
                  >
                    <ClearOutlined fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            },
          }}
          sx={{ flex: 1, minWidth: 0, maxWidth: { md: 320 } }}
        />
        <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 220 } }}>
          <InputLabel id="machines-filter-service-label">Service</InputLabel>
          <Select
            labelId="machines-filter-service-label"
            label="Service"
            value={serviceInput}
            onChange={e => setServiceInput(e.target.value)}
          >
            <MenuItem value="">
              <em>All services</em>
            </MenuItem>
            {serviceOptions.map(s => {
              const id = s.id ?? s.uuid;
              if (id == null) return null;
              const label = s.name?.trim?.() || `Service #${id}`;
              return (
                <MenuItem key={String(id)} value={String(id)}>
                  {label}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
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
        emptyMessage="No machines yet."
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
        aria-labelledby="delete-machine-dialog-title"
      >
        <DialogTitle id="delete-machine-dialog-title">Delete machine?</DialogTitle>
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
    </>
  );
}
