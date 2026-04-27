import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import EventAvailableOutlined from '@mui/icons-material/EventAvailableOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import ClearOutlined from '@mui/icons-material/ClearOutlined';
import useApi from '../configs/useApi';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import PaginatedTable from '../components/PaginatedTable/PaginatedTable';
import CustomLoader from '../components/CustomLoader/CustomLoader';
import { useToast } from '../context/ToastContext';
import usePermissions from '../hooks/usePermissions';
import { PERM } from '../config/permissions';
import { parsePaginatedList } from '../utils/parsePaginatedList';

function normalizePatientsList(data) {
  const parsed = parsePaginatedList(data, { listKeys: ['patients', 'results'] });
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

function patientFullName(row) {
  const a = String(row.first_name ?? '').trim();
  const b = String(row.last_name ?? '').trim();
  if (a || b) return [a, b].filter(Boolean).join(' ');
  const n = row.name;
  return typeof n === 'string' && n.trim() ? n.trim() : null;
}

function patientMobile(row) {
  const m = row.mobile_number ?? row.phone ?? row.mobile;
  return m != null && String(m).trim() !== '' ? String(m).trim() : null;
}

function formatDob(value) {
  if (value == null || value === '') return '—';
  const s = String(value).trim();
  return s.length >= 10 ? s.slice(0, 10) : s;
}

/** List URL: `patients?search=…` when filtering, plus `page` & `page_size` for pagination. */
function buildPatientsListQuery(page, rowsPerPage, searchTrimmed) {
  const params = new URLSearchParams();
  if (searchTrimmed) {
    params.set('search', searchTrimmed);
  }
  params.set('page', String(page + 1));
  params.set('page_size', String(rowsPerPage));
  return params.toString();
}

export default function PatientsPage() {
  const navigate = useNavigate();
  const { get, del } = useApi();
  const { showError, showInfo, showSuccess } = useToast();
  const { can } = usePermissions();
  const canAddPatient = can(PERM.ADD_PATIENT);
  const canEditPatient = can(PERM.EDIT_PATIENT);
  const canDeletePatient = can(PERM.DELETE_PATIENT);
  const canAddAppointment = can(PERM.ADD_APPOINTMENT);
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
  const [appliedSearch, setAppliedSearch] = useState('');

  const applySearch = useCallback(() => {
    setAppliedSearch(searchInput.trim());
    setPage(0);
  }, [searchInput]);

  const clearSearch = useCallback(() => {
    setSearchInput('');
    setAppliedSearch('');
    setPage(0);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const q = appliedSearch.trim();
        const query = buildPatientsListQuery(page, rowsPerPage, q);
        const data = await get(`/patients?${query}`);
        if (cancelled) return;
        const { rows: nextRows, total, mode } = normalizePatientsList(data);
        setRows(nextRows);
        setTotalCount(total);
        if (listMode === null) {
          setListMode(mode);
        }
      } catch (err) {
        if (!cancelled) {
          const msg =
            err?.detail ||
            err?.response?.data?.detail ||
            err?.response?.data?.message ||
            err?.message ||
            'Could not load patients.';
          showError(typeof msg === 'string' ? msg : 'Could not load patients.');
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
  }, [page, rowsPerPage, listVersion, appliedSearch]);

  const handleConfirmDelete = useCallback(async () => {
    if (deleteTarget == null) return;
    const { id } = deleteTarget;
    setDeleteSubmitting(true);
    try {
      await del(`/patients/${encodeURIComponent(id)}`);
      setDeleteTarget(null);
      showSuccess('Patient deleted.');
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
        'Could not delete patient.';
      showError(typeof msg === 'string' ? msg : 'Could not delete patient.');
    } finally {
      setDeleteSubmitting(false);
    }
  }, [deleteTarget, del, listMode, rowsPerPage, showError, showSuccess, totalCount]);

  const requestDelete = useCallback(
    row => {
      const patientId = row.id ?? row.uuid;
      if (patientId == null) {
        showInfo('This row has no id.');
        return;
      }
      setDeleteTarget({
        id: patientId,
        name: patientFullName(row) || patientMobile(row) || 'this patient',
      });
    },
    [showInfo]
  );

  const count = listMode === 'server' ? totalCount : rows.length;
  const paginatedRows = useMemo(() => {
    if (listMode === 'server' || listMode === null) {
      return rows;
    }
    return rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [listMode, rows, page, rowsPerPage]);

  const columns = useMemo(
    () => [
      { id: 'name', label: 'Name', minWidth: 180 },
      { id: 'mobile', label: 'Mobile', minWidth: 140 },
      { id: 'dob', label: 'Date of birth', minWidth: 120 },
      {
        id: 'actions',
        label: 'Actions',
        align: 'right',
        minWidth: 132,
        render: row => {
          const patientId = row.id ?? row.uuid;
          return (
            <>
              <Tooltip title={canAddAppointment ? 'Add appointment' : 'No permission'}>
                <span>
                  <IconButton
                    size="small"
                    color="primary"
                    aria-label="Add appointment"
                    onClick={() => {
                      if (patientId != null) navigate(`/patients/${patientId}/appointment`);
                      else showInfo('This row has no id.');
                    }}
                    disabled={!canAddAppointment}
                  >
                    <EventAvailableOutlined fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={canEditPatient ? 'Edit' : 'No permission'}>
                <span>
                  <IconButton
                    size="small"
                    color="primary"
                    aria-label="Edit patient"
                    onClick={() => {
                      if (patientId != null) navigate(`/patients/${patientId}/edit`);
                      else showInfo('This row has no id.');
                    }}
                    disabled={!canEditPatient}
                  >
                    <EditOutlined fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={canDeletePatient ? 'Delete' : 'No permission'}>
                <span>
                  <IconButton
                    size="small"
                    color="error"
                    aria-label="Delete patient"
                    onClick={() => requestDelete(row)}
                    disabled={!canDeletePatient}
                  >
                    <DeleteOutlineOutlined fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </>
          );
        },
      },
    ],
    [
      navigate,
      requestDelete,
      showInfo,
      canAddAppointment,
      canEditPatient,
      canDeletePatient,
    ]
  );

  const getCellValue = useCallback((row, col) => {
    if (col.id === 'name') return patientFullName(row) ?? '—';
    if (col.id === 'mobile') return patientMobile(row) ?? '—';
    if (col.id === 'dob') return formatDob(row.date_of_birth);
    return '';
  }, []);

  return (
    <>
      <CustomLoader active={deleteSubmitting} />
      <FormPageShell
        title={`Patients (${count})`}
        headerAction={
          <Tooltip title={canAddPatient ? 'Add patient' : 'No permission'}>
            <span>
              <Button
                variant="contained"
                onClick={() => navigate('/patients/new')}
                sx={{ borderRadius: 2 }}
                disabled={!canAddPatient}
              >
                Add patient
              </Button>
            </span>
          </Tooltip>
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
            placeholder="Search by name or mobile…"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applySearch();
              }
            }}
            aria-label="Search patients"
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
          <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
            <Button variant="contained" onClick={applySearch} sx={{ borderRadius: 2, px: 2.5 }}>
              Apply
            </Button>
            <Button variant="outlined" onClick={clearSearch} sx={{ borderRadius: 2, px: 2 }}>
              Clear
            </Button>
          </Stack>
        </Stack>
        <PaginatedTable
          columns={columns}
          rows={paginatedRows}
          loading={loading}
          skeletonRows={rowsPerPage}
          emptyMessage="No patients found."
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
          aria-labelledby="delete-patient-list-dialog-title"
        >
          <DialogTitle id="delete-patient-list-dialog-title">Delete patient?</DialogTitle>
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
