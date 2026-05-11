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
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
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
import { parsePaginatedList } from '../utils/parsePaginatedList';
import { isDoctorUser } from '../utils/authRoles';

function doctorLabel(d) {
  return d?.name?.trim?.() || d?.full_name?.trim?.() || d?.email?.trim?.() || `Doctor #${d?.id ?? d?.uuid}`;
}

export default function DoctorMedicinesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { get, del } = useApi();
  const { showError, showInfo, showSuccess } = useToast();
  const isDoctor = isDoctorUser(user);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState(isDoctor ? String(user?.id ?? '') : '');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [listVersion, setListVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (isDoctor) return undefined;
    (async () => {
      try {
        const data = await get('/doctors?page=1&page_size=200');
        if (cancelled) return;
        const parsed = parsePaginatedList(data, { listKeys: ['doctors'] });
        setDoctors(parsed.rows);
      } catch {
        if (!cancelled) setDoctors([]);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDoctor]);

  useEffect(() => {
    let cancelled = false;
    if (!doctorId) {
      setRows([]);
      setLoading(false);
      return undefined;
    }
    (async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams({ doctor_id: String(doctorId) }).toString();
        const data = await get(`/doctor-medicines?${query}`);
        if (cancelled) return;
        const parsed = parsePaginatedList(data, { listKeys: ['doctor_medicines', 'medicines', 'results'] });
        setRows(parsed.rows);
      } catch (err) {
        if (!cancelled) {
          const msg =
            err?.response?.data?.detail ||
            err?.response?.data?.message ||
            err?.message ||
            'Could not load medicines.';
          showError(typeof msg === 'string' ? msg : 'Could not load medicines.');
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId, listVersion]);

  const requestDelete = useCallback(
    row => {
      const id = row.id ?? row.uuid;
      if (id == null) {
        showInfo('This row has no id.');
        return;
      }
      setDeleteTarget({ id, label: row.name?.trim?.() || `Medicine #${id}` });
    },
    [showInfo]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    try {
      await del(`/doctor-medicines/${encodeURIComponent(deleteTarget.id)}`);
      setDeleteTarget(null);
      showSuccess('Medicine deleted.');
      setListVersion(v => v + 1);
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not delete medicine.';
      showError(typeof msg === 'string' ? msg : 'Could not delete medicine.');
    } finally {
      setDeleteSubmitting(false);
    }
  }, [deleteTarget, del, showError, showSuccess]);

  const columns = useMemo(
    () => [
      { id: 'doctor', label: 'Doctor', minWidth: 150 },
      { id: 'name', label: 'Medicine', minWidth: 170 },
      { id: 'concentration', label: 'Concentration', minWidth: 120 },
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
                      if (id != null) navigate(`/doctor-medicines/${encodeURIComponent(id)}/edit`);
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
    if (col.id === 'doctor')
      return row.doctor_name?.trim?.() || row.doctor?.name?.trim?.() || (row.doctor ? `Doctor #${row.doctor}` : '—');
    if (col.id === 'name') return row.name?.trim?.() || '—';
    if (col.id === 'concentration') return row.concentration?.trim?.() || '—';
    return '';
  }, []);

  return (
    <>
      <CustomLoader active={deleteSubmitting} />
      <FormPageShell
        title={`Doctor medicines (${rows.length})`}
        description="Manage medicines per doctor."
        headerAction={
          <Button
            variant="contained"
            onClick={() => navigate('/doctor-medicines/new')}
            sx={{ borderRadius: 2 }}
            disabled={!doctorId}
          >
            Add medicine
          </Button>
        }
      >
        {!isDoctor ? (
          <Box sx={{ mb: 2, maxWidth: 360 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="doctor-medicine-filter-doctor">Doctor</InputLabel>
              <Select
                labelId="doctor-medicine-filter-doctor"
                label="Doctor"
                value={doctorId}
                onChange={e => setDoctorId(e.target.value)}
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
        {!doctorId && !isDoctor ? (
          <Typography color="text.secondary">Select a doctor to load medicines.</Typography>
        ) : (
          <PaginatedTable
            columns={columns}
            rows={rows}
            loading={loading}
            emptyMessage="No medicines yet."
            page={0}
            rowsPerPage={Math.max(10, rows.length || 10)}
            onPageChange={() => {}}
            onRowsPerPageChange={() => {}}
            count={rows.length}
            hidePagination
            getRowId={row => row.id ?? row.uuid ?? JSON.stringify(row)}
            getCellValue={getCellValue}
          />
        )}
      </FormPageShell>
      <Dialog open={deleteTarget != null} onClose={() => !deleteSubmitting && setDeleteTarget(null)}>
        <DialogTitle>Delete medicine?</DialogTitle>
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
