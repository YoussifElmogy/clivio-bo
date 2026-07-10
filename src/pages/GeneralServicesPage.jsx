import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
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
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { parsePaginatedList } from '../utils/parsePaginatedList';
import { formatGeneralServicePrice } from '../payloads/generalServicePayload';

function buildGeneralServicesListQuery(page, rowsPerPage, doctorId) {
  const params = new URLSearchParams();
  params.set('page', String(page + 1));
  params.set('page_size', String(rowsPerPage));
  params.set('doctor_id', String(doctorId));
  return params.toString();
}

export default function GeneralServicesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { get, del } = useApi();
  const { showError, showInfo, showSuccess } = useToast();
  const doctorId = user?.id != null ? String(user.id) : '';

  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [listMode, setListMode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [listVersion, setListVersion] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  useEffect(() => {
    if (!doctorId) {
      setRows([]);
      setTotalCount(0);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const query = buildGeneralServicesListQuery(page, rowsPerPage, doctorId);
        const data = await get(`/general-services?${query}`);
        if (cancelled) return;
        const parsed = parsePaginatedList(data, {
          listKeys: ['general_services', 'results'],
        });
        setRows(parsed.rows);
        setTotalCount(parsed.total);
        if (listMode === null) setListMode(parsed.mode);
      } catch (err) {
        if (!cancelled) {
          const msg =
            err?.detail ||
            err?.response?.data?.detail ||
            err?.response?.data?.message ||
            err?.message ||
            'Could not load general services.';
          showError(typeof msg === 'string' ? msg : 'Could not load general services.');
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
  }, [doctorId, page, rowsPerPage, listVersion]);

  const requestDelete = useCallback(
    row => {
      const id = row.id ?? row.uuid;
      if (id == null) {
        showInfo('This row has no id.');
        return;
      }
      setDeleteTarget({ id, label: row.name?.trim?.() || `Service #${id}` });
    },
    [showInfo]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    try {
      await del(`/general-services/${encodeURIComponent(deleteTarget.id)}`);
      setDeleteTarget(null);
      showSuccess('General service deleted.');
      if (listMode === 'client') {
        setRows(prev => prev.filter(row => (row.id ?? row.uuid) !== deleteTarget.id));
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
        'Could not delete general service.';
      showError(typeof msg === 'string' ? msg : 'Could not delete general service.');
    } finally {
      setDeleteSubmitting(false);
    }
  }, [deleteTarget, del, listMode, rowsPerPage, showError, showSuccess, totalCount]);

  const count = listMode === 'server' ? totalCount : rows.length;
  const paginatedRows = useMemo(() => {
    if (listMode === 'server' || listMode === null) return rows;
    return rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [listMode, rows, page, rowsPerPage]);

  const columns = useMemo(
    () => [
      { id: 'name', label: 'Name', minWidth: 200 },
      { id: 'clinic_fees', label: 'Clinic fees', minWidth: 120 },
      {
        id: 'actions',
        label: 'Actions',
        align: 'right',
        minWidth: 100,
        render: row => {
          const id = row.id ?? row.uuid;
          return (
            <>
              <Tooltip title="Edit">
                <span>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => {
                      if (id != null) navigate(`/general-services/${encodeURIComponent(id)}/edit`);
                    }}
                  >
                    <EditOutlined fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Delete">
                <span>
                  <IconButton size="small" color="error" onClick={() => requestDelete(row)}>
                    <DeleteOutlineOutlined fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </>
          );
        },
      },
    ],
    [navigate, requestDelete]
  );

  const getCellValue = useCallback((row, col) => {
    if (col.id === 'name') return row.name?.trim?.() || '—';
    if (col.id === 'clinic_fees') {
      return formatGeneralServicePrice(row.clinic_fees ?? row.clinicFees) || '—';
    }
    return '';
  }, []);

  return (
    <>
      <CustomLoader active={deleteSubmitting} />
      <FormPageShell
        title={`General services (${count})`}
        description="Manage your consultation and other general-priced services."
        headerAction={
          <Button
            variant="contained"
            onClick={() => navigate('/general-services/new')}
            sx={{ borderRadius: 2 }}
            disabled={!doctorId}
          >
            Add service
          </Button>
        }
      >
        {!doctorId ? (
          <Box color="text.secondary">Sign in as a doctor to manage general services.</Box>
        ) : (
          <PaginatedTable
            columns={columns}
            rows={paginatedRows}
            loading={loading}
            emptyMessage="No general services yet."
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={setPage}
            onRowsPerPageChange={newSize => {
              setRowsPerPage(newSize);
              setPage(0);
            }}
            count={count}
            getRowId={row => row.id ?? row.uuid ?? JSON.stringify(row)}
            getCellValue={getCellValue}
          />
        )}
      </FormPageShell>
      <Dialog open={deleteTarget != null} onClose={() => !deleteSubmitting && setDeleteTarget(null)}>
        <DialogTitle>Delete general service?</DialogTitle>
        <DialogContent>
          This cannot be undone. Remove <strong>{deleteTarget?.label}</strong>?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleteSubmitting}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={handleConfirmDelete} disabled={deleteSubmitting}>
            {deleteSubmitting ? <CircularProgress size={18} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
