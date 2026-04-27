import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import useApi from '../configs/useApi';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import PaginatedTable from '../components/PaginatedTable/PaginatedTable';
import CustomLoader from '../components/CustomLoader/CustomLoader';
import { useToast } from '../context/ToastContext';
import usePermissions from '../hooks/usePermissions';
import { PERM } from '../config/permissions';
import { parsePaginatedList } from '../utils/parsePaginatedList';
import { formatTimeRangeAmPm } from '../utils/timeFormat';

const DAY_LABELS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function formatDoctorDay(value) {
  const day = Number(value);
  if (Number.isNaN(day) || day < 0 || day > 6) return 'Unknown day';
  return DAY_LABELS[day];
}

export default function DoctorsPage() {
  const navigate = useNavigate();
  const { get, del } = useApi();
  const { showError, showInfo, showSuccess } = useToast();
  const { can } = usePermissions();
  const canAddDoctor = can(PERM.ADD_DOCTOR);
  const canEditDoctor = can(PERM.EDIT_DOCTOR);
  const canDeleteDoctor = can(PERM.DELETE_DOCTOR);
  const [doctors, setDoctors] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [listMode, setListMode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [listVersion, setListVersion] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);

  useEffect(() => {
    if (listMode === 'client') return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await get(`/doctors?page=${page + 1}&page_size=${rowsPerPage}`);
        if (cancelled) return;
        const parsed = parsePaginatedList(data, { listKeys: ['doctors'] });
        setDoctors(parsed.rows);
        setTotalCount(parsed.total);
        if (listMode === null) {
          setListMode(parsed.mode);
        }
      } catch (err) {
        if (!cancelled) {
          const msg =
            err?.response?.data?.detail ||
            err?.response?.data?.message ||
            err?.message ||
            'Could not load doctors.';
          showError(typeof msg === 'string' ? msg : 'Could not load doctors.');
          setDoctors([]);
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
  }, [page, rowsPerPage, listVersion]);

  const handleConfirmDelete = useCallback(async () => {
    if (deleteTarget == null) return;
    const { id } = deleteTarget;
    setDeleteSubmitting(true);
    try {
      await del(`/doctors/${encodeURIComponent(id)}`);
      setDeleteTarget(null);
      showSuccess('Doctor deleted.');
      if (listMode === 'client') {
        setDoctors(prev => prev.filter(row => (row.id ?? row.uuid) !== id));
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
        'Could not delete doctor.';
      showError(typeof msg === 'string' ? msg : 'Could not delete doctor.');
    } finally {
      setDeleteSubmitting(false);
    }
  }, [deleteTarget, del, listMode, rowsPerPage, showError, showSuccess, totalCount]);

  const count = listMode === 'server' ? totalCount : doctors.length;
  const paginatedRows = useMemo(() => {
    if (listMode === 'server' || listMode === null) {
      return doctors;
    }
    return doctors.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [listMode, doctors, page, rowsPerPage]);

  const requestDelete = useCallback(
    row => {
      const doctorId = row.id ?? row.uuid;
      if (doctorId == null) {
        showInfo('This row has no id.');
        return;
      }
      setDeleteTarget({
        id: doctorId,
        name: row.name?.trim() || row.email || 'this doctor',
      });
    },
    [showInfo]
  );

  const requestView = useCallback(
    row => {
      const doctorId = row.id ?? row.uuid;
      if (doctorId == null) {
        showInfo('This row has no id.');
        return;
      }
      setViewTarget(row);
    },
    [showInfo]
  );

  const columns = useMemo(
    () => [
      { id: 'name', label: 'Name', minWidth: 160 },
      { id: 'email', label: 'Email', minWidth: 200 },
      { id: 'phone', label: 'Phone', minWidth: 130 },
      { id: 'specialty', label: 'Specialty', minWidth: 160 },
      {
        id: 'is_active',
        label: 'Active',
        align: 'center',
        minWidth: 90,
        render: row => {
          const on = row.is_active ?? row.active;
          return (
            <Checkbox
              checked={Boolean(on)}
              disabled
              size="small"
              color="success"
              sx={{
                p: 0.5,
                '&.Mui-disabled': { opacity: 1 },
                '&.Mui-disabled.Mui-checked': {
                  color: theme => theme.palette.success.main,
                },
                '&.Mui-disabled:not(.Mui-checked)': {
                  color: theme => theme.palette.action.disabled,
                },
              }}
              inputProps={{ 'aria-label': 'Active' }}
            />
          );
        },
      },
      {
        id: 'actions',
        label: 'Actions',
        align: 'right',
        minWidth: 100,
        render: row => {
          const doctorId = row.id ?? row.uuid;
          return (
            <>
              <Tooltip title={canEditDoctor ? 'Edit' : 'No permission'}>
                <span>
                  <IconButton
                    size="small"
                    color="primary"
                    aria-label="Edit doctor"
                    onClick={() => {
                      if (doctorId != null) navigate(`/doctors/${doctorId}/edit`);
                      else showInfo('This row has no id.');
                    }}
                    disabled={!canEditDoctor}
                  >
                    <EditOutlined fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="View">
                <IconButton
                  size="small"
                  color="info"
                  aria-label="View doctor details"
                  onClick={() => requestView(row)}
                >
                  <VisibilityOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={canDeleteDoctor ? 'Delete' : 'No permission'}>
                <span>
                  <IconButton
                    size="small"
                    color="error"
                    aria-label="Delete doctor"
                    onClick={() => requestDelete(row)}
                    disabled={!canDeleteDoctor}
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
    [navigate, requestDelete, requestView, showInfo, canEditDoctor, canDeleteDoctor]
  );

  return (
    <>
      <CustomLoader active={deleteSubmitting} />
      <FormPageShell
        title={`Doctors (${count})`}
        headerAction={
          <Tooltip title={canAddDoctor ? 'Add doctor' : 'No permission'}>
            <span>
              <Button
                variant="contained"
                onClick={() => navigate('/doctors/new')}
                sx={{ borderRadius: 2 }}
                disabled={!canAddDoctor}
              >
                Add doctor
              </Button>
            </span>
          </Tooltip>
        }
        paperSx={{ p: { xs: 2, sm: 3 } }}
      >
        <PaginatedTable
          columns={columns}
          rows={paginatedRows}
          loading={loading}
          emptyMessage="No doctors yet."
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={e => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          count={count}
          getRowId={row => row.id ?? row.uuid ?? JSON.stringify(row)}
          getCellValue={(row, col) => {
            if (col.id === 'name') return row.name ?? '—';
            if (col.id === 'email') return row.email ?? '—';
            if (col.id === 'phone') return row.phone ?? '—';
            if (col.id === 'specialty') return row.specialty ?? row.speciality ?? '—';
            return '';
          }}
        />
        <Dialog
          open={viewTarget != null}
          onClose={() => setViewTarget(null)}
          aria-labelledby="view-doctor-dialog-title"
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle id="view-doctor-dialog-title">Doctor details</DialogTitle>
          <DialogContent dividers>
            {viewTarget ? (
              <Stack spacing={1.5}>
                <Typography variant="body2">
                  <strong>Name:</strong> {viewTarget.name || '—'}
                </Typography>
                <Typography variant="body2">
                  <strong>Email:</strong> {viewTarget.email || '—'}
                </Typography>
                <Typography variant="body2">
                  <strong>Phone:</strong> {viewTarget.phone || '—'}
                </Typography>
                <Typography variant="body2">
                  <strong>Specialty:</strong> {viewTarget.specialty || viewTarget.speciality || '—'}
                </Typography>
                <Typography variant="body2">
                  <strong>Status:</strong> {viewTarget.is_active ?? viewTarget.active ? 'Active' : 'Inactive'}
                </Typography>

                <Typography variant="subtitle2" sx={{ pt: 1 }}>
                  Branch schedules
                </Typography>
                {Array.isArray(viewTarget.assigned_branches) && viewTarget.assigned_branches.length > 0 ? (
                  <Stack spacing={1.25}>
                    {viewTarget.assigned_branches.map((branch, idx) => (
                      <Stack key={branch.id ?? `${branch.name}-${idx}`} spacing={0.5}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {branch.name?.trim() || `Branch #${branch.id ?? idx + 1}`}
                        </Typography>
                        {Array.isArray(branch.schedule) && branch.schedule.length > 0 ? (
                          <Stack spacing={0.25}>
                            {branch.schedule.map((slot, slotIndex) => (
                              <Typography key={`${branch.id ?? idx}-slot-${slotIndex}`} variant="body2" color="text.secondary">
                                {formatDoctorDay(slot.day)}: {formatTimeRangeAmPm(slot.from_time, slot.to_time) || '—'}
                              </Typography>
                            ))}
                          </Stack>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No schedule slots.
                          </Typography>
                        )}
                      </Stack>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No assigned branches.
                  </Typography>
                )}
              </Stack>
            ) : null}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setViewTarget(null)}>Close</Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={deleteTarget != null}
          onClose={() => !deleteSubmitting && setDeleteTarget(null)}
          aria-labelledby="delete-doctor-dialog-title"
        >
          <DialogTitle id="delete-doctor-dialog-title">Delete doctor?</DialogTitle>
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
