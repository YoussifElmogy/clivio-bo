import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Drawer from '@mui/material/Drawer';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useApi from '../configs/useApi';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import PaginatedTable from '../components/PaginatedTable/PaginatedTable';
import EditOutlined from '@mui/icons-material/EditOutlined';
import Tooltip from '@mui/material/Tooltip';
import AttachFileOutlined from '@mui/icons-material/AttachFileOutlined';
import CloudUploadOutlined from '@mui/icons-material/CloudUploadOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import InsertDriveFileOutlined from '@mui/icons-material/InsertDriveFileOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import usePermissions from '../hooks/usePermissions';
import { PERM } from '../config/permissions';
import { isDoctorUser } from '../utils/authRoles';
import { parsePaginatedList } from '../utils/parsePaginatedList';
import {
  RESERVATION_STATUS_OPTIONS,
  reservationStatusLabel,
} from '../constants/reservationStatus';
import { formatHhmmToAmPm } from '../utils/timeFormat';

const API_LIST = '/reservations';

function todayIsoDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

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

function parseAttachmentsList(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    if (Array.isArray(data.attachments)) return data.attachments;
    if (Array.isArray(data.results)) return data.results;
    if (Array.isArray(data.items)) return data.items;
    if (data.data && Array.isArray(data.data)) return data.data;
  }
  return [];
}

function attachmentDisplayName(row) {
  return (
    row?.file_name ||
    row?.filename ||
    row?.name ||
    row?.original_name ||
    row?.path?.split?.('/')?.pop?.() ||
    'Attachment'
  );
}

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

function rowPatientId(row) {
  const raw = row?.patient_id ?? row?.patient?.id;
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export default function ReservationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { get, post, del } = useApi();
  const { showError, showSuccess, showInfo } = useToast();
  const { can } = usePermissions();
  const isDoctor = isDoctorUser(user);
  const canEditAppointment = can(PERM.EDIT_APPOINTMENT);
  const defaultVisitDate = useMemo(() => todayIsoDate(), []);
  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [listMode, setListMode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [patientNameInput, setPatientNameInput] = useState('');
  const [statusInput, setStatusInput] = useState('');
  const [dateInput, setDateInput] = useState(defaultVisitDate);
  const [appliedPatientName, setAppliedPatientName] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('');
  const [appliedDate, setAppliedDate] = useState(defaultVisitDate);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [attachmentsUploading, setAttachmentsUploading] = useState(false);
  const [attachmentsDeletingId, setAttachmentsDeletingId] = useState(null);
  const [attachmentRows, setAttachmentRows] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeReservation, setActiveReservation] = useState(null);

  const refreshAttachments = useCallback(
    async reservationId => {
      setAttachmentsLoading(true);
      try {
        const data = await get(`/reservations/${encodeURIComponent(reservationId)}/attachments`);
        setAttachmentRows(parseAttachmentsList(data));
      } catch (err) {
        const msg =
          err?.detail ||
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          'Could not load attachments.';
        showError(typeof msg === 'string' ? msg : 'Could not load attachments.');
        setAttachmentRows([]);
      } finally {
        setAttachmentsLoading(false);
      }
    },
    [get, showError]
  );

  const openAttachmentsDrawer = useCallback(
    async row => {
      const rid = row.id ?? row.uuid;
      if (rid == null) {
        showInfo('This row has no id.');
        return;
      }
      setActiveReservation({
        id: rid,
        label: patientCell(row),
      });
      setSelectedFile(null);
      setAttachmentsOpen(true);
      await refreshAttachments(rid);
    },
    [refreshAttachments, showInfo]
  );

  const handleUploadAttachment = useCallback(async () => {
    const reservationId = activeReservation?.id;
    if (!reservationId) return;
    if (!selectedFile) {
      showInfo('Choose a file first.');
      return;
    }
    setAttachmentsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      await post(`/reservations/${encodeURIComponent(reservationId)}/attachments`, formData);
      showSuccess('Attachment uploaded.');
      setSelectedFile(null);
      await refreshAttachments(reservationId);
    } catch (err) {
      const msg =
        err?.detail ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not upload attachment.';
      showError(typeof msg === 'string' ? msg : 'Could not upload attachment.');
    } finally {
      setAttachmentsUploading(false);
    }
  }, [activeReservation?.id, post, refreshAttachments, selectedFile, showError, showInfo, showSuccess]);

  const handleDeleteAttachment = useCallback(
    async attachmentId => {
      if (!attachmentId) return;
      setAttachmentsDeletingId(attachmentId);
      try {
        await del(`/attachments/${encodeURIComponent(attachmentId)}`);
        showSuccess('Attachment deleted.');
        if (activeReservation?.id) await refreshAttachments(activeReservation.id);
      } catch (err) {
        const msg =
          err?.detail ||
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          'Could not delete attachment.';
        showError(typeof msg === 'string' ? msg : 'Could not delete attachment.');
      } finally {
        setAttachmentsDeletingId(null);
      }
    },
    [activeReservation?.id, del, refreshAttachments, showError, showSuccess]
  );

  const handleViewAttachment = useCallback(
    att => {
      const url = attachmentViewUrl(att);
      if (!url) {
        showInfo('No view URL found for this attachment.');
        return;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    },
    [showInfo]
  );

  const openReservationSummary = useCallback(
    row => {
      const reservationId = row.id ?? row.uuid;
      const patientId = rowPatientId(row);
      if (reservationId == null) {
        showInfo('This row has no reservation id.');
        return;
      }
      if (patientId == null) {
        showInfo('This row has no patient id.');
        return;
      }
      navigate(
        `/appointments/${encodeURIComponent(reservationId)}/view?patient_id=${encodeURIComponent(patientId)}`
      );
    },
    [navigate, showInfo]
  );

  const applyFilters = useCallback(() => {
    setAppliedPatientName(patientNameInput.trim());
    setAppliedStatus(statusInput.trim());
    setAppliedDate(dateInput.trim());
    setPage(0);
  }, [patientNameInput, statusInput, dateInput]);

  const clearFilters = useCallback(() => {
    setPatientNameInput('');
    setStatusInput('');
    setDateInput(defaultVisitDate);
    setAppliedPatientName('');
    setAppliedStatus('');
    setAppliedDate(defaultVisitDate);
    setPage(0);
  }, [defaultVisitDate]);

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
        minWidth: 120,
        render: row => {
          const rid = row.id ?? row.uuid;
          return (
            <>
              <Tooltip title={canEditAppointment ? 'Attachments' : 'No permission'}>
                <span>
                  <IconButton
                    size="small"
                    color="secondary"
                    aria-label="Manage attachments"
                    onClick={() => openAttachmentsDrawer(row)}
                    disabled={!canEditAppointment}
                  >
                    <AttachFileOutlined fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              {isDoctor ? (
                <Tooltip title="View appointment">
                  <span>
                    <IconButton
                      size="small"
                      color="primary"
                      aria-label="View appointment"
                      onClick={() => openReservationSummary(row)}
                    >
                      <VisibilityOutlined fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              ) : (
                <Tooltip title={canEditAppointment ? 'Edit' : 'No permission'}>
                  <span>
                    <IconButton
                      size="small"
                      color="primary"
                      aria-label="Edit appointment"
                      onClick={() => {
                        if (rid != null) navigate(`/appointments/${encodeURIComponent(rid)}/edit`);
                      }}
                      disabled={!canEditAppointment}
                    >
                      <EditOutlined fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
            </>
          );
        },
      },
    ],
    [navigate, canEditAppointment, isDoctor, openAttachmentsDrawer, openReservationSummary]
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
      <Drawer
        anchor="right"
        open={attachmentsOpen}
        onClose={() => {
          if (!attachmentsUploading && attachmentsDeletingId == null) setAttachmentsOpen(false);
        }}
      >
        <Stack sx={{ width: { xs: '100vw', sm: 430 }, p: 2.5, gap: 2, height: '100%' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Appointment attachments
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {activeReservation?.label || 'Appointment'}
            </Typography>
          </Box>
          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
            <Stack spacing={1.25}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUploadOutlined />}
                disabled={attachmentsUploading}
                sx={{ borderRadius: 2, alignSelf: 'flex-start' }}
              >
                Choose file
                <input
                  hidden
                  type="file"
                  onChange={e => {
                    const file = e.target.files?.[0] ?? null;
                    setSelectedFile(file);
                  }}
                />
              </Button>
              <Typography variant="body2" color="text.secondary">
                {selectedFile ? selectedFile.name : 'No file selected'}
              </Typography>
              <Button
                variant="contained"
                onClick={handleUploadAttachment}
                disabled={!selectedFile || attachmentsUploading}
                sx={{ borderRadius: 2, alignSelf: 'flex-start' }}
              >
                {attachmentsUploading ? 'Uploading…' : 'Upload attachment'}
              </Button>
            </Stack>
          </Paper>
          <Divider />
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            {attachmentsLoading ? (
              <Stack alignItems="center" justifyContent="center" sx={{ pt: 5 }}>
                <CircularProgress size={28} />
              </Stack>
            ) : attachmentRows.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No attachments yet.
              </Typography>
            ) : (
              <List disablePadding>
                {attachmentRows.map((att, idx) => {
                  const aid = att.id ?? att.uuid;
                  return (
                    <ListItem key={aid ?? idx} divider sx={{ pr: 15 }}>
                      <InsertDriveFileOutlined color="action" sx={{ mr: 1.25 }} />
                      <ListItemText
                        primary={
                          <Box component="span" sx={{ overflowWrap: 'anywhere' }}>
                            {attachmentDisplayName(att)}
                          </Box>
                        }
                        secondary={att.created_at ? String(att.created_at).slice(0, 19).replace('T', ' ') : null}
                        primaryTypographyProps={{ noWrap: false }}
                        secondaryTypographyProps={{ noWrap: true }}
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="View attachment">
                          <span>
                            <IconButton
                              edge="end"
                              color="primary"
                              aria-label="View attachment"
                              onClick={() => handleViewAttachment(att)}
                              sx={{ mr: 0.5 }}
                            >
                              <VisibilityOutlined fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Delete attachment">
                          <span>
                            <IconButton
                              edge="end"
                              color="error"
                              aria-label="Delete attachment"
                              disabled={aid == null || attachmentsDeletingId === aid}
                              onClick={() => handleDeleteAttachment(aid)}
                            >
                              {attachmentsDeletingId === aid ? (
                                <CircularProgress size={18} thickness={5} color="inherit" />
                              ) : (
                                <DeleteOutlineOutlined fontSize="small" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Box>
        </Stack>
      </Drawer>
    </FormPageShell>
  );
}
