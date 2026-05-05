import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import useApi from '../configs/useApi';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import PaginatedTable from '../components/PaginatedTable/PaginatedTable';
import CustomLoader from '../components/CustomLoader/CustomLoader';
import { useToast } from '../context/ToastContext';
import usePermissions from '../hooks/usePermissions';
import { PERM } from '../config/permissions';
import { parsePaginatedList } from '../utils/parsePaginatedList';

function buildListQuery(page, rowsPerPage) {
  const params = new URLSearchParams();
  params.set('page', String(page + 1));
  params.set('page_size', String(rowsPerPage));
  return params.toString();
}

function PulsePackagesTab() {
  const navigate = useNavigate();
  const { get, del } = useApi();
  const { showError, showInfo, showSuccess } = useToast();
  const { can } = usePermissions();
  const canAdd = can(PERM.ADD_PULSE_PACKAGE);
  const canEdit = can(PERM.EDIT_PULSE_PACKAGE);
  const canDelete = can(PERM.DELETE_PULSE_PACKAGE);

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
    if (listMode === 'client') return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await get(`/pulse-packages?${buildListQuery(page, rowsPerPage)}`);
        if (cancelled) return;
        const parsed = parsePaginatedList(data, {
          listKeys: ['pulse_packages', 'pulsePackages', 'items', 'results'],
        });
        setRows(parsed.rows);
        setTotalCount(parsed.total);
        if (listMode === null) setListMode(parsed.mode);
      } catch (err) {
        if (!cancelled) {
          const msg =
            err?.response?.data?.detail ||
            err?.response?.data?.message ||
            err?.message ||
            'Could not load pulse packages.';
          showError(typeof msg === 'string' ? msg : 'Could not load pulse packages.');
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
  }, [page, rowsPerPage, listVersion]);

  const handleConfirmDelete = useCallback(async () => {
    if (deleteTarget == null) return;
    const { id } = deleteTarget;
    setDeleteSubmitting(true);
    try {
      await del(`/pulse-packages/${encodeURIComponent(id)}`);
      setDeleteTarget(null);
      showSuccess('Pulse package deleted.');
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
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not delete pulse package.';
      showError(typeof msg === 'string' ? msg : 'Could not delete pulse package.');
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
      { id: 'pulses', label: 'Pulses', minWidth: 100 },
      { id: 'price', label: 'Price', minWidth: 120 },
      { id: 'description', label: 'Description', minWidth: 220 },
      {
        id: 'actions',
        label: 'Actions',
        align: 'right',
        minWidth: 100,
        render: row => {
          const rid = row.id ?? row.uuid;
          return (
            <>
              <Tooltip title={canEdit ? 'Edit' : 'No permission'}>
                <span>
                  <IconButton
                    size="small"
                    color="primary"
                    aria-label="Edit pulse package"
                    disabled={!canEdit}
                    onClick={() => {
                      if (rid != null) navigate(`/laser/pulse-packages/${encodeURIComponent(rid)}/edit`);
                      else showInfo('This row has no id.');
                    }}
                  >
                    <EditOutlined fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={canDelete ? 'Delete' : 'No permission'}>
                <span>
                  <IconButton
                    size="small"
                    color="error"
                    aria-label="Delete pulse package"
                    disabled={!canDelete}
                    onClick={() => {
                      if (rid == null) {
                        showInfo('This row has no id.');
                        return;
                      }
                      setDeleteTarget({
                        id: rid,
                        label: `${row.pulses ?? '—'} pulses`,
                      });
                    }}
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
    [canDelete, canEdit, navigate, showInfo]
  );

  const getCellValue = useCallback((row, col) => {
    if (col.id === 'pulses') return row.pulses ?? '—';
    if (col.id === 'price') return row.price ?? '—';
    if (col.id === 'description') return row.description?.trim?.() || '—';
    return '';
  }, []);

  return (
    <>
      <CustomLoader active={deleteSubmitting} />
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, flexWrap: 'wrap' }}>
        <Typography sx={{ fontWeight: 600, color: 'text.secondary', flex: 1, minWidth: 0 }}>
          Total: {count}
        </Typography>
        <Tooltip title={canAdd ? 'Add pulse package' : 'No permission'}>
          <span>
            <Button
              variant="contained"
              onClick={() => navigate('/laser/pulse-packages/new')}
              disabled={!canAdd}
              sx={{ borderRadius: 2 }}
            >
              Add pulse package
            </Button>
          </span>
        </Tooltip>
      </Stack>
      <PaginatedTable
        columns={columns}
        rows={paginatedRows}
        loading={loading}
        emptyMessage="No pulse packages yet."
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
        aria-labelledby="delete-pulse-dialog-title"
      >
        <DialogTitle id="delete-pulse-dialog-title">Delete pulse package?</DialogTitle>
        <DialogContent>
          This cannot be undone.
          {deleteTarget?.label ? (
            <>
              {' '}
              Remove <strong>{deleteTarget.label}</strong>?
            </>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleteSubmitting}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={handleConfirmDelete} disabled={deleteSubmitting}>
            {deleteSubmitting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function AreaPackagesTab() {
  const navigate = useNavigate();
  const { get, del } = useApi();
  const { showError, showInfo, showSuccess } = useToast();
  const { can } = usePermissions();
  const canAdd = can(PERM.ADD_AREA_PACKAGE);
  const canEdit = can(PERM.EDIT_AREA_PACKAGE);
  const canDelete = can(PERM.DELETE_AREA_PACKAGE);

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
    if (listMode === 'client') return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await get(`/area-packages?${buildListQuery(page, rowsPerPage)}`);
        if (cancelled) return;
        const parsed = parsePaginatedList(data, {
          listKeys: ['area_packages', 'areaPackages', 'items', 'results'],
        });
        setRows(parsed.rows);
        setTotalCount(parsed.total);
        if (listMode === null) setListMode(parsed.mode);
      } catch (err) {
        if (!cancelled) {
          const msg =
            err?.response?.data?.detail ||
            err?.response?.data?.message ||
            err?.message ||
            'Could not load area packages.';
          showError(typeof msg === 'string' ? msg : 'Could not load area packages.');
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
  }, [page, rowsPerPage, listVersion]);

  const handleConfirmDelete = useCallback(async () => {
    if (deleteTarget == null) return;
    const { id } = deleteTarget;
    setDeleteSubmitting(true);
    try {
      await del(`/area-packages/${encodeURIComponent(id)}`);
      setDeleteTarget(null);
      showSuccess('Area package deleted.');
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
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not delete area package.';
      showError(typeof msg === 'string' ? msg : 'Could not delete area package.');
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
      { id: 'name', label: 'Name', minWidth: 160 },
      { id: 'price', label: 'Price', minWidth: 120 },
      { id: 'description', label: 'Description', minWidth: 220 },
      {
        id: 'actions',
        label: 'Actions',
        align: 'right',
        minWidth: 100,
        render: row => {
          const rid = row.id ?? row.uuid;
          return (
            <>
              <Tooltip title={canEdit ? 'Edit' : 'No permission'}>
                <span>
                  <IconButton
                    size="small"
                    color="primary"
                    aria-label="Edit area package"
                    disabled={!canEdit}
                    onClick={() => {
                      if (rid != null) navigate(`/laser/area-packages/${encodeURIComponent(rid)}/edit`);
                      else showInfo('This row has no id.');
                    }}
                  >
                    <EditOutlined fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={canDelete ? 'Delete' : 'No permission'}>
                <span>
                  <IconButton
                    size="small"
                    color="error"
                    aria-label="Delete area package"
                    disabled={!canDelete}
                    onClick={() => {
                      if (rid == null) {
                        showInfo('This row has no id.');
                        return;
                      }
                      setDeleteTarget({
                        id: rid,
                        label: row.name?.trim() || 'this package',
                      });
                    }}
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
    [canDelete, canEdit, navigate, showInfo]
  );

  const getCellValue = useCallback((row, col) => {
    if (col.id === 'name') return row.name?.trim?.() || '—';
    if (col.id === 'price') return row.price ?? '—';
    if (col.id === 'description') return row.description?.trim?.() || '—';
    return '';
  }, []);

  return (
    <>
      <CustomLoader active={deleteSubmitting} />
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, flexWrap: 'wrap' }}>
        <Typography sx={{ fontWeight: 600, color: 'text.secondary', flex: 1, minWidth: 0 }}>
          Total: {count}
        </Typography>
        <Tooltip title={canAdd ? 'Add area package' : 'No permission'}>
          <span>
            <Button
              variant="contained"
              onClick={() => navigate('/laser/area-packages/new')}
              disabled={!canAdd}
              sx={{ borderRadius: 2 }}
            >
              Add area package
            </Button>
          </span>
        </Tooltip>
      </Stack>
      <PaginatedTable
        columns={columns}
        rows={paginatedRows}
        loading={loading}
        emptyMessage="No area packages yet."
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
        aria-labelledby="delete-area-dialog-title"
      >
        <DialogTitle id="delete-area-dialog-title">Delete area package?</DialogTitle>
        <DialogContent>
          This cannot be undone.
          {deleteTarget?.label ? (
            <>
              {' '}
              Remove <strong>{deleteTarget.label}</strong>?
            </>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleteSubmitting}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={handleConfirmDelete} disabled={deleteSubmitting}>
            {deleteSubmitting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default function LaserPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') === 'area' ? 1 : 0;
  const [tab, setTab] = useState(tabFromUrl);

  useEffect(() => {
    setTab(searchParams.get('tab') === 'area' ? 1 : 0);
  }, [searchParams]);

  const handleTabChange = (_, value) => {
    setTab(value);
    setSearchParams(value === 1 ? { tab: 'area' } : { tab: 'pulse' }, { replace: true });
  };

  return (
    <FormPageShell
      title="Laser"
      description="Manage pulse packages and area packages."
      paperSx={{ p: { xs: 2, sm: 3 } }}
    >
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={handleTabChange} aria-label="Laser sections">
          <Tab label="Pulse packages" id="laser-tab-pulse" aria-controls="laser-panel-pulse" />
          <Tab label="Area packages" id="laser-tab-area" aria-controls="laser-panel-area" />
        </Tabs>
      </Box>
      {tab === 0 ? (
        <div role="tabpanel" id="laser-panel-pulse" aria-labelledby="laser-tab-pulse">
          <PulsePackagesTab />
        </div>
      ) : (
        <div role="tabpanel" id="laser-panel-area" aria-labelledby="laser-tab-area">
          <AreaPackagesTab />
        </div>
      )}
    </FormPageShell>
  );
}
