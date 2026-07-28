import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import FilterAltOutlined from '@mui/icons-material/FilterAltOutlined';
import useApi from '../configs/useApi';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import PaginatedTable from '../components/PaginatedTable/PaginatedTable';
import ReservationStatusPill from '../components/ReservationStatus/ReservationStatusPill';
import ReservationGeneralServicesDrawer from '../components/GeneralServices/ReservationGeneralServicesDrawer';
import CustomLoader from '../components/CustomLoader/CustomLoader';
import EditOutlined from '@mui/icons-material/EditOutlined';
import TableSortLabel from '@mui/material/TableSortLabel';
import Tooltip from '@mui/material/Tooltip';
import AttachFileOutlined from '@mui/icons-material/AttachFileOutlined';
import CloudUploadOutlined from '@mui/icons-material/CloudUploadOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import InsertDriveFileOutlined from '@mui/icons-material/InsertDriveFileOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import MedicalServicesOutlined from '@mui/icons-material/MedicalServicesOutlined';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import usePermissions from '../hooks/usePermissions';
import { PERM } from '../config/permissions';
import { isAssistantUser, isDoctorUser, isSuperAdminUser } from '../utils/authRoles';
import { getDoctorAppointmentViewPath } from '../utils/doctorAppointmentNavigation';
import { parsePaginatedList } from '../utils/parsePaginatedList';
import {
  RESERVATION_STATUS,
  RESERVATION_STATUS_FILTER_OPTIONS,
  reservationStatusLabel,
} from '../constants/reservationStatus';
import { formatAttachmentSecondaryLine, formatHhmmToAmPm } from '../utils/timeFormat';
import {
  isReservationInvoicePaid,
  isReservationInvoicePaidFromRow,
} from '../utils/reservationInvoiceStatus';
import {
  DOCTOR_FILTER_ALL,
  doctorSelectOptions,
  fetchAllDoctors,
} from '../utils/doctorsCatalog';
import {
  buildReservationsListQuery,
  RESERVATION_SORT_ASC,
  RESERVATION_SORT_DESC,
} from '../payloads/reservationPayload';

const API_LIST = '/reservations';

const VISIT_DATE_PRESETS = [
  { id: 'today', label: 'Today', offset: 0 },
  { id: 'tomorrow', label: 'Tomorrow', offset: 1 },
  { id: 'yesterday', label: 'Yesterday', offset: -1 },
];

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

function isFinishedReservation(row) {
  return String(row?.status ?? '').trim().toLowerCase() === RESERVATION_STATUS.FINISHED;
}

/** Super admins and assistants cannot edit appointments once status is finished. */
function blocksStaffEditOnFinished(user, row) {
  if (!isFinishedReservation(row)) return false;
  return isSuperAdminUser(user) || isAssistantUser(user);
}

function generalServicesListingAccess(user, row, canViewAppointment) {
  if (isDoctorUser(user)) {
    return { allowed: false, tooltip: 'Doctors manage services in appointment summary' };
  }
  if (!canViewAppointment) {
    return { allowed: false, tooltip: 'No permission' };
  }
  if (isReservationInvoicePaidFromRow(row)) {
    return { allowed: false, tooltip: 'Invoice paid — cannot change services' };
  }
  return { allowed: true, tooltip: 'General services' };
}

function patientMobileCell(row) {
  const raw =
    row.patient_mobile ??
    row.patientMobile ??
    row.patient?.mobile ??
    row.mobile ??
    row.phone ??
    '';
  const s = String(raw).trim();
  return s || '—';
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

function rowDoctorId(row) {
  const raw = row?.doctor_id ?? row?.doctor?.id ?? row?.doctorId;
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
  const canViewAppointment = can(PERM.VIEW_APPOINTMENT);
  const canDeleteAppointment = can(PERM.DELETE_APPOINTMENT);
  const defaultVisitDate = useMemo(() => todayIsoDate(), []);
  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [listMode, setListMode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [statusInput, setStatusInput] = useState('');
  const [dateInput, setDateInput] = useState(defaultVisitDate);
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('');
  const [appliedDate, setAppliedDate] = useState(defaultVisitDate);
  const [doctorInput, setDoctorInput] = useState('');
  const [appliedDoctorId, setAppliedDoctorId] = useState('');
  const [appliedSort, setAppliedSort] = useState(RESERVATION_SORT_ASC);
  const [catalogDoctors, setCatalogDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [attachmentsUploading, setAttachmentsUploading] = useState(false);
  const [attachmentsDeletingId, setAttachmentsDeletingId] = useState(null);
  const [attachmentRows, setAttachmentRows] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeReservation, setActiveReservation] = useState(null);
  const [listVersion, setListVersion] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [generalServicesOpen, setGeneralServicesOpen] = useState(false);
  const [generalServicesTarget, setGeneralServicesTarget] = useState(null);

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
      let invoicePaid = isReservationInvoicePaidFromRow(row);
      if (!invoicePaid) {
        const patientId = rowPatientId(row);
        if (patientId != null) {
          try {
            const query = new URLSearchParams({
              patient_id: String(patientId),
              reservation_id: String(rid),
            }).toString();
            const summary = await get(`/reservation-summary?${query}`);
            invoicePaid = isReservationInvoicePaid(summary);
          } catch {
            invoicePaid = false;
          }
        }
      }
      setActiveReservation({
        id: rid,
        label: patientCell(row),
        invoicePaid,
      });
      setSelectedFile(null);
      setAttachmentsOpen(true);
      await refreshAttachments(rid);
    },
    [refreshAttachments, showInfo]
  );

  const openGeneralServicesDrawer = useCallback(
    async row => {
      const reservationId = row.id ?? row.uuid;
      const patientId = rowPatientId(row);
      const doctorId = rowDoctorId(row);
      if (reservationId == null) {
        showInfo('This row has no reservation id.');
        return;
      }
      if (patientId == null) {
        showInfo('This row has no patient id.');
        return;
      }
      if (doctorId == null) {
        showInfo('This row has no doctor id.');
        return;
      }

      let invoicePaid = isReservationInvoicePaidFromRow(row);
      if (!invoicePaid) {
        try {
          const query = new URLSearchParams({
            patient_id: String(patientId),
            reservation_id: String(reservationId),
          }).toString();
          const summary = await get(`/reservation-summary?${query}`);
          invoicePaid = isReservationInvoicePaid(summary);
        } catch {
          invoicePaid = false;
        }
      }

      setGeneralServicesTarget({
        reservationId,
        patientId,
        doctorId,
        patientLabel: patientCell(row),
        doctorName: row.doctor_name?.trim?.() || row.doctor?.name?.trim?.() || '',
        branchName: row.branch_name?.trim?.() || row.branch?.name?.trim?.() || '',
        visitDate:
          row.date_of_visit != null && String(row.date_of_visit).trim()
            ? String(row.date_of_visit).trim().slice(0, 10)
            : '',
        visitSlot: row.slot != null ? String(row.slot).trim() : '',
        invoicePaid,
      });
      setGeneralServicesOpen(true);
    },
    [get, showInfo]
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

  const closeGeneralServicesDrawer = useCallback(() => {
    setGeneralServicesOpen(false);
    setGeneralServicesTarget(null);
  }, []);

  const handleGeneralServicesSaved = useCallback(() => {
    setListVersion(v => v + 1);
  }, []);

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
        getDoctorAppointmentViewPath({
          reservationId,
          patientId,
          user,
        })
      );
    },
    [navigate, showInfo, user]
  );

  const requestDelete = useCallback(
    row => {
      const reservationId = row.id ?? row.uuid;
      if (reservationId == null) {
        showInfo('This row has no id.');
        return;
      }
      const visit = row.date_of_visit;
      const visitLabel =
        visit != null && String(visit).trim()
          ? String(visit).trim().slice(0, 10)
          : '';
      setDeleteTarget({
        id: reservationId,
        label: [patientCell(row), visitLabel].filter(Boolean).join(' · ') || 'this appointment',
      });
    },
    [showInfo]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (deleteTarget == null) return;
    const { id } = deleteTarget;
    setDeleteSubmitting(true);
    try {
      await del(`/reservations/${encodeURIComponent(id)}`);
      setDeleteTarget(null);
      showSuccess('Appointment deleted.');
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
        'Could not delete appointment.';
      showError(typeof msg === 'string' ? msg : 'Could not delete appointment.');
    } finally {
      setDeleteSubmitting(false);
    }
  }, [deleteTarget, del, listMode, rowsPerPage, showError, showSuccess, totalCount]);

  const applyFilters = useCallback(() => {
    setAppliedSearch(searchInput.trim());
    setAppliedStatus(statusInput.trim());
    setAppliedDate(dateInput.trim());
    setAppliedDoctorId(doctorInput.trim());
    setPage(0);
  }, [searchInput, statusInput, dateInput, doctorInput]);

  const clearFilters = useCallback(() => {
    setSearchInput('');
    setStatusInput('');
    setDateInput('');
    setAppliedSearch('');
    setAppliedStatus('');
    setAppliedDate('');
    setDoctorInput('');
    setAppliedDoctorId('');
    setAppliedSort(RESERVATION_SORT_ASC);
    setPage(0);
  }, []);

  const showAppointmentNumber =
    isDoctor || Boolean(String(appliedDoctorId ?? '').trim());

  const toggleAppointmentSort = useCallback(() => {
    setAppliedSort(prev =>
      prev === RESERVATION_SORT_DESC ? RESERVATION_SORT_ASC : RESERVATION_SORT_DESC
    );
    setPage(0);
  }, []);

  const applyVisitDatePreset = useCallback(
    offsetDays => {
      const next = dayjs().add(offsetDays, 'day').format('YYYY-MM-DD');
      setDateInput(next);
      setAppliedDate(next);
      setPage(0);
    },
    []
  );

  const visitDateValue = dateInput ? dayjs(dateInput) : null;

  const doctorOptions = useMemo(
    () => doctorSelectOptions(catalogDoctors, 'all'),
    [catalogDoctors]
  );

  useEffect(() => {
    if (isDoctor) {
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
  }, [isDoctor]);

  useEffect(() => {
    if (!doctorInput) return;
    const exists = doctorOptions.some(d => d.id === doctorInput);
    if (!exists) setDoctorInput('');
  }, [doctorInput, doctorOptions]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const query = buildReservationsListQuery({
          search: appliedSearch,
          status: appliedStatus,
          dateOfVisit: appliedDate,
          doctorId: appliedDoctorId,
          page: page + 1,
          pageSize: rowsPerPage,
          sort: showAppointmentNumber ? appliedSort : RESERVATION_SORT_ASC,
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
  }, [page, rowsPerPage, appliedSearch, appliedStatus, appliedDate, appliedDoctorId, appliedSort, showAppointmentNumber, listVersion]);

  const count = listMode === 'server' ? totalCount : rows.length;
  const paginatedRows = useMemo(() => {
    if (listMode === 'server' || listMode === null) return rows;
    return rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [listMode, rows, page, rowsPerPage]);

  const columns = useMemo(
    () => [
      ...(showAppointmentNumber
        ? [
            {
              id: 'appointment_number',
              label: 'No.',
              minWidth: 88,
              renderHeader: () => (
                <TableSortLabel
                  active
                  direction={appliedSort === RESERVATION_SORT_DESC ? 'desc' : 'asc'}
                  onClick={toggleAppointmentSort}
                >
                  No.
                </TableSortLabel>
              ),
            },
          ]
        : []),
      { id: 'patient', label: 'Patient', minWidth: 160 },
      { id: 'patient_mobile', label: 'Mobile', minWidth: 120 },
      { id: 'visit', label: 'Visit', minWidth: 140 },
      { id: 'slot', label: 'Time', minWidth: 108 },
      { id: 'branch', label: 'Branch', minWidth: 120 },
      { id: 'doctor', label: 'Doctor', minWidth: 120 },
      { id: 'status', label: 'Status', minWidth: 120, render: row => <ReservationStatusPill status={row.status} /> },
      {
        id: 'actions',
        label: 'Actions',
        align: 'right',
        minWidth: isDoctor ? 72 : 232,
        render: row => {
          const rid = row.id ?? row.uuid;
          const editBlockedFinished = blocksStaffEditOnFinished(user, row);
          const canEditRow = canEditAppointment && !editBlockedFinished;
          const generalServicesAccess = generalServicesListingAccess(user, row, canViewAppointment);
          const editTooltip = !canEditAppointment
            ? 'No permission'
            : editBlockedFinished
              ? 'Finished appointments cannot be edited'
              : 'Edit';
          return (
            <>
              <Tooltip title={canEditAppointment ? 'Attachments' : 'No permission'}>
                <span>
                  <IconButton
                    size="small"
                    color="secondary"
                    aria-label="Manage attachments"
                    onClick={e => {
                      e.stopPropagation();
                      openAttachmentsDrawer(row);
                    }}
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
                      onClick={e => {
                        e.stopPropagation();
                        openReservationSummary(row);
                      }}
                    >
                      <VisibilityOutlined fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              ) : (
                <>
                  <Tooltip title={generalServicesAccess.tooltip}>
                    <span>
                      <IconButton
                        size="small"
                        color="primary"
                        aria-label="General services"
                        onClick={e => {
                          e.stopPropagation();
                          openGeneralServicesDrawer(row);
                        }}
                        disabled={!generalServicesAccess.allowed}
                      >
                        <MedicalServicesOutlined fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title={editTooltip}>
                    <span>
                      <IconButton
                        size="small"
                        color="primary"
                        aria-label="Edit appointment"
                        onClick={e => {
                          e.stopPropagation();
                          if (rid != null) navigate(`/appointments/${encodeURIComponent(rid)}/edit`);
                        }}
                        disabled={!canEditRow}
                      >
                        <EditOutlined fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title={canDeleteAppointment ? 'Delete' : 'No permission'}>
                    <span>
                      <IconButton
                        size="small"
                        color="error"
                        aria-label="Delete appointment"
                        onClick={e => {
                          e.stopPropagation();
                          requestDelete(row);
                        }}
                        disabled={!canDeleteAppointment}
                      >
                        <DeleteOutlineOutlined fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </>
              )}
            </>
          );
        },
      },
    ],
    [
      navigate,
      canDeleteAppointment,
      canEditAppointment,
      canViewAppointment,
      isDoctor,
      showAppointmentNumber,
      appliedSort,
      toggleAppointmentSort,
      openAttachmentsDrawer,
      openGeneralServicesDrawer,
      openReservationSummary,
      requestDelete,
      user,
    ]
  );

  const getCellValue = useCallback((row, col) => {
    if (col.id === 'appointment_number') {
      const raw = row.appointment_number ?? row.appointmentNumber;
      if (raw == null || String(raw).trim() === '') return '—';
      return String(raw).trim();
    }
    if (col.id === 'patient') return patientCell(row);
    if (col.id === 'patient_mobile') return patientMobileCell(row);
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
    <>
      <CustomLoader active={deleteSubmitting} />
      <FormPageShell
        title={`Appointments (${count})`}
        description="View and edit reservations. Search by patient name or mobile; filter by status or visit date."
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

          <Stack direction="row" flexWrap="wrap" spacing={1} useFlexGap>
            {VISIT_DATE_PRESETS.map(preset => (
              <Button
                key={preset.id}
                size="small"
                variant="outlined"
                disabled={loading}
                onClick={() => applyVisitDatePreset(preset.offset)}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, mb: 2 }}
              >
                {preset.label}
              </Button>
            ))}
          </Stack>

          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1}
            alignItems={{ xs: 'stretch', md: 'flex-end' }}
            flexWrap="wrap"
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
              sx={{ flex: { md: '1 1 220px' }, minWidth: { md: 200 } }}
            />
            {!isDoctor ? (
              <FormControl
                size="small"
                sx={{ minWidth: { xs: '100%', md: 200 } }}
                disabled={loading || doctorsLoading}
              >
                <InputLabel id="res-filter-doctor-label">Doctor</InputLabel>
                <Select
                  labelId="res-filter-doctor-label"
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
                {RESERVATION_STATUS_FILTER_OPTIONS.map(o => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <DatePicker
              label="Visit date"
              value={visitDateValue?.isValid() ? visitDateValue : null}
              onChange={v => setDateInput(v?.isValid() ? v.format('YYYY-MM-DD') : '')}
              disabled={loading}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
              sx={{ minWidth: { xs: '100%', md: 180 } }}
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
      </Paper>

      <PaginatedTable
        columns={columns}
        rows={paginatedRows}
        loading={loading || doctorsLoading}
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
        onRowClick={isDoctor ? openReservationSummary : undefined}
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
                        secondary={formatAttachmentSecondaryLine(att)}
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
                        {!activeReservation?.invoicePaid ? (
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
                        ) : null}
                      </ListItemSecondaryAction>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Box>
        </Stack>
      </Drawer>
      <ReservationGeneralServicesDrawer
        key={generalServicesOpen ? String(generalServicesTarget?.reservationId ?? 'open') : 'closed'}
        open={generalServicesOpen}
        onClose={closeGeneralServicesDrawer}
        reservationId={generalServicesTarget?.reservationId ?? null}
        patientId={generalServicesTarget?.patientId ?? null}
        doctorId={generalServicesTarget?.doctorId ?? null}
        patientLabel={generalServicesTarget?.patientLabel ?? ''}
        doctorName={generalServicesTarget?.doctorName ?? ''}
        branchName={generalServicesTarget?.branchName ?? ''}
        visitDate={generalServicesTarget?.visitDate ?? ''}
        visitSlot={generalServicesTarget?.visitSlot ?? ''}
        readOnly={generalServicesTarget?.invoicePaid ?? false}
        onSaved={handleGeneralServicesSaved}
      />
      <Dialog
        open={deleteTarget != null}
        onClose={() => !deleteSubmitting && setDeleteTarget(null)}
        aria-labelledby="delete-appointment-dialog-title"
      >
        <DialogTitle id="delete-appointment-dialog-title">Delete appointment?</DialogTitle>
        <DialogContent>
          This cannot be undone.{' '}
          {deleteTarget ? (
            <>
              Remove <strong>{deleteTarget.label}</strong>?
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
