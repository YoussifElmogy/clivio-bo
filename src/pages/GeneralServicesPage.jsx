import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
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
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import useApi from '../configs/useApi';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import PaginatedTable from '../components/PaginatedTable/PaginatedTable';
import CustomLoader from '../components/CustomLoader/CustomLoader';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isDoctorUser, isSuperAdminUser } from '../utils/authRoles';
import { fetchAllDoctors } from '../utils/doctorsCatalog';
import { parsePaginatedList } from '../utils/parsePaginatedList';
import { formatGeneralServicePrice } from '../payloads/generalServicePayload';

function buildGeneralServicesListQuery(page, rowsPerPage, doctorId) {
  const params = new URLSearchParams();
  params.set('page', String(page + 1));
  params.set('page_size', String(rowsPerPage));
  params.set('doctor_id', String(doctorId));
  return params.toString();
}

function doctorLabel(d) {
  return d?.name?.trim?.() || d?.full_name?.trim?.() || d?.email?.trim?.() || `Doctor #${d?.id ?? d?.uuid}`;
}

export default function GeneralServicesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { get, del } = useApi();
  const { showError, showInfo, showSuccess } = useToast();
  const isDoctor = isDoctorUser(user);
  const isSuperAdmin = isSuperAdminUser(user);

  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(isSuperAdmin);
  const [selectedDoctorId, setSelectedDoctorId] = useState(() => {
    if (isDoctor) return user?.id != null ? String(user.id) : '';
    return String(searchParams.get('doctor_id') ?? '').trim();
  });

  const doctorId = isDoctor ? (user?.id != null ? String(user.id) : '') : selectedDoctorId;

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
    if (!isSuperAdmin) return undefined;
    let cancelled = false;
    (async () => {
      setDoctorsLoading(true);
      try {
        const allDoctors = await fetchAllDoctors(get);
        if (cancelled) return;
        setDoctors(allDoctors);
      } catch {
        if (!cancelled) {
          setDoctors([]);
          showError('Could not load doctors.');
        }
      } finally {
        if (!cancelled) setDoctorsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    const next = new URLSearchParams(searchParams);
    if (selectedDoctorId) next.set('doctor_id', selectedDoctorId);
    else next.delete('doctor_id');
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDoctorId, isSuperAdmin]);

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

  const selectedDoctorName = useMemo(() => {
    if (!doctorId) return '';
    const match = doctors.find(d => String(d.id ?? d.uuid) === String(doctorId));
    return match ? doctorLabel(match) : '';
  }, [doctorId, doctors]);

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

  const handleAddService = () => {
    const query =
      isSuperAdmin && doctorId ? `?doctor_id=${encodeURIComponent(doctorId)}` : '';
    navigate(`/general-services/new${query}`);
  };

  const pageTitle = isSuperAdmin
    ? selectedDoctorName
      ? `General services — ${selectedDoctorName} (${count})`
      : `General services (${count})`
    : `General services (${count})`;

  const pageDescription = isSuperAdmin
    ? 'Add a service and assign it to doctors, or filter by doctor to review their catalog.'
    : 'Manage your consultation and other general-priced services.';

  return (
    <>
      <CustomLoader active={deleteSubmitting} />
      <FormPageShell
        title={pageTitle}
        description={pageDescription}
        headerAction={
          <Button
            variant="contained"
            onClick={handleAddService}
            sx={{ borderRadius: 2 }}
          >
            Add service
          </Button>
        }
      >
        {isSuperAdmin ? (
          <Box sx={{ mb: 2, maxWidth: 420 }}>
            <FormControl fullWidth size="small" disabled={doctorsLoading}>
              <InputLabel id="general-services-doctor-filter">Doctor</InputLabel>
              <Select
                labelId="general-services-doctor-filter"
                label="Doctor"
                value={selectedDoctorId}
                onChange={e => {
                  setSelectedDoctorId(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">
                  <em>Select doctor</em>
                </MenuItem>
                {doctors.map(d => {
                  const id = d.id ?? d.uuid;
                  if (id == null) return null;
                  return (
                    <MenuItem key={String(id)} value={String(id)}>
                      {doctorLabel(d)}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Box>
        ) : null}

        {!doctorId ? (
          <Typography color="text.secondary">
            {isDoctor ? 'Sign in as a doctor to manage general services.' : 'Select a doctor to load services.'}
          </Typography>
        ) : (
          <PaginatedTable
            columns={columns}
            rows={paginatedRows}
            loading={loading || doctorsLoading}
            emptyMessage="No general services yet."
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
