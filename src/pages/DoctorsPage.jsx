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
import Tooltip from '@mui/material/Tooltip';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import useApi from '../configs/useApi';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import PaginatedTable from '../components/PaginatedTable/PaginatedTable';
import CustomLoader from '../components/CustomLoader/CustomLoader';
import { useToast } from '../context/ToastContext';
import { parsePaginatedList } from '../utils/parsePaginatedList';

export default function DoctorsPage() {
  const navigate = useNavigate();
  const { get, del } = useApi();
  const { showError, showInfo, showSuccess } = useToast();
  const [doctors, setDoctors] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [listMode, setListMode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [listVersion, setListVersion] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

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
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  color="primary"
                  aria-label="Edit doctor"
                  onClick={() => {
                    if (doctorId != null) navigate(`/doctors/${doctorId}/edit`);
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
                  aria-label="Delete doctor"
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

  return (
    <>
      <CustomLoader active={deleteSubmitting} />
      <FormPageShell
        title={`Doctors (${count})`}
        headerAction={
          <Button variant="contained" onClick={() => navigate('/doctors/new')} sx={{ borderRadius: 2 }}>
            Add doctor
          </Button>
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
