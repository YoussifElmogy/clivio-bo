import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import useApi from '../configs/useApi';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import PaginatedTable from '../components/PaginatedTable/PaginatedTable';
import EditOutlined from '@mui/icons-material/EditOutlined';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useToast } from '../context/ToastContext';
import { parsePaginatedList } from '../utils/parsePaginatedList';
import {
  RESERVATION_STATUS_OPTIONS,
  reservationStatusLabel,
} from '../constants/reservationStatus';
import { formatHhmmToAmPm } from '../utils/timeFormat';

const API_LIST = '/reservations';

function normalizeReservationsList(data) {
  const parsed = parsePaginatedList(data, { listKeys: ['reservations', 'results'] });
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

function patientCell(row) {
  const n = row.patient_name ?? row.patientName;
  if (n != null && String(n).trim()) return String(n).trim();
  const a = String(row.first_name ?? '').trim();
  const b = String(row.last_name ?? '').trim();
  if (a || b) return [a, b].filter(Boolean).join(' ');
  return row.patient_id != null ? `Patient #${row.patient_id}` : '—';
}

function buildListQuery(page, rowsPerPage, { patientName, status, dateOfVisit }) {
  const params = new URLSearchParams();
  const pn = patientName?.trim();
  if (pn) params.set('patient_name', pn);
  const st = status?.trim();
  if (st) params.set('status', st);
  const d = dateOfVisit?.trim();
  if (d) params.set('date_of_visit', d);
  params.set('page', String(page + 1));
  params.set('page_size', String(rowsPerPage));
  return params.toString();
}

export default function ReservationsPage() {
  const navigate = useNavigate();
  const { get } = useApi();
  const { showError } = useToast();
  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [listMode, setListMode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [patientNameInput, setPatientNameInput] = useState('');
  const [statusInput, setStatusInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [appliedPatientName, setAppliedPatientName] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('');
  const [appliedDate, setAppliedDate] = useState('');

  const applyFilters = useCallback(() => {
    setAppliedPatientName(patientNameInput.trim());
    setAppliedStatus(statusInput.trim());
    setAppliedDate(dateInput.trim());
    setPage(0);
  }, [patientNameInput, statusInput, dateInput]);

  const clearFilters = useCallback(() => {
    setPatientNameInput('');
    setStatusInput('');
    setDateInput('');
    setAppliedPatientName('');
    setAppliedStatus('');
    setAppliedDate('');
    setPage(0);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const query = buildListQuery(page, rowsPerPage, {
          patientName: appliedPatientName,
          status: appliedStatus,
          dateOfVisit: appliedDate,
        });
        const data = await get(`${API_LIST}?${query}`);
        if (cancelled) return;
        const { rows: nextRows, total, mode } = normalizeReservationsList(data);
        setRows(nextRows);
        setTotalCount(total);
        if (listMode === null) setListMode(mode);
      } catch (err) {
        if (!cancelled) {
          const msg =
            err?.detail ||
            err?.response?.data?.detail ||
            err?.response?.data?.message ||
            err?.message ||
            'Could not load appointments.';
          showError(typeof msg === 'string' ? msg : 'Could not load appointments.');
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
  }, [page, rowsPerPage, appliedPatientName, appliedStatus, appliedDate]);

  const count = listMode === 'server' ? totalCount : rows.length;
  const paginatedRows = useMemo(() => {
    if (listMode === 'server' || listMode === null) return rows;
    return rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [listMode, rows, page, rowsPerPage]);

  const columns = useMemo(
    () => [
      { id: 'patient', label: 'Patient', minWidth: 160 },
      { id: 'visit', label: 'Visit', minWidth: 140 },
      { id: 'slot', label: 'Time', minWidth: 108 },
      { id: 'branch', label: 'Branch', minWidth: 120 },
      { id: 'doctor', label: 'Doctor', minWidth: 120 },
      { id: 'status', label: 'Status', minWidth: 110 },
      {
        id: 'actions',
        label: 'Actions',
        align: 'right',
        minWidth: 72,
        render: row => {
          const rid = row.id ?? row.uuid;
          return (
            <Tooltip title="Edit">
              <IconButton
                size="small"
                color="primary"
                aria-label="Edit appointment"
                onClick={() => {
                  if (rid != null) navigate(`/appointments/${encodeURIComponent(rid)}/edit`);
                }}
              >
                <EditOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          );
        },
      },
    ],
    [navigate]
  );

  const getCellValue = useCallback((row, col) => {
    if (col.id === 'patient') return patientCell(row);
    if (col.id === 'visit') {
      const d = row.date_of_visit;
      if (d == null || String(d).trim() === '') return '—';
      const s = String(d).trim();
      return s.length >= 10 ? s.slice(0, 10) : s;
    }
    if (col.id === 'slot') {
      const t = row.slot;
      if (t == null || String(t).trim() === '') return '—';
      const hhmm = String(t).trim().slice(0, 5);
      const label = formatHhmmToAmPm(hhmm);
      return label || hhmm;
    }
    if (col.id === 'branch') return row.branch_name?.trim?.() || row.branch?.name?.trim?.() || '—';
    if (col.id === 'doctor') return row.doctor_name?.trim?.() || row.doctor?.name?.trim?.() || '—';
    if (col.id === 'status') return reservationStatusLabel(row.status);
    return '';
  }, []);

  return (
    <FormPageShell
      title={`Appointments (${count})`}
      description="View and edit reservations. Filter by patient, status, or visit date."
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
          <TextField
            label="Patient name"
            size="small"
            value={patientNameInput}
            onChange={e => setPatientNameInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyFilters();
              }
            }}
            placeholder="e.g. Ahmed"
            sx={{ flex: { md: '1 1 200px' }, minWidth: { md: 180 } }}
          />
          <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 160 } }}>
            <InputLabel id="res-filter-status-label">Status</InputLabel>
            <Select
              labelId="res-filter-status-label"
              label="Status"
              value={statusInput}
              onChange={e => setStatusInput(e.target.value)}
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              {RESERVATION_STATUS_OPTIONS.map(o => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Visit date"
            type="date"
            size="small"
            value={dateInput}
            onChange={e => setDateInput(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ minWidth: { xs: '100%', md: 170 } }}
          />
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

      <PaginatedTable
        columns={columns}
        rows={paginatedRows}
        loading={loading}
        skeletonRows={rowsPerPage}
        emptyMessage="No appointments found."
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
  );
}
