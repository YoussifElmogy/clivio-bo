import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import useApi from '../configs/useApi';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import BranchCardGrid from '../components/BranchCardGrid/BranchCardGrid';
import CustomLoader from '../components/CustomLoader/CustomLoader';
import { useToast } from '../context/ToastContext';

/**
 * @returns {{ mode: 'server' | 'client', rows: unknown[], total: number }}
 */
function parseBranchesListResponse(data) {
  if (Array.isArray(data)) {
    return { mode: 'client', rows: data, total: data.length };
  }
  if (data && typeof data === 'object' && Array.isArray(data.results)) {
    const total =
      typeof data.total === 'number' && !Number.isNaN(data.total)
        ? data.total
        : data.results.length;
    return { mode: 'server', rows: data.results, total };
  }
  if (data && typeof data === 'object') {
    if (Array.isArray(data.data)) {
      const rows = data.data;
      return { mode: 'client', rows, total: rows.length };
    }
    if (Array.isArray(data.branches)) {
      const rows = data.branches;
      return { mode: 'client', rows, total: rows.length };
    }
  }
  return { mode: 'client', rows: [], total: 0 };
}

export default function BranchesPage() {
  const navigate = useNavigate();
  const { get, del } = useApi();
  const { showError, showInfo, showSuccess } = useToast();
  const [branches, setBranches] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  /** null until first successful parse — then 'server' (API pagination) or 'client' (slice locally). */
  const [listMode, setListMode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  /** Bumps after a successful delete in server mode to refetch the current page. */
  const [listVersion, setListVersion] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  useEffect(() => {
    if (listMode === 'client') return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await get(
          `/branches?page=${page + 1}&page_size=${rowsPerPage}`
        );
        if (cancelled) return;
        const parsed = parseBranchesListResponse(data);
        setBranches(parsed.rows);
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
            'Could not load branches.';
          showError(typeof msg === 'string' ? msg : 'Could not load branches.');
          setBranches([]);
          setTotalCount(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // listMode omitted on purpose: when it flips null → server we must not refetch; client mode skips via early return.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, listVersion]);

  const handleConfirmDelete = useCallback(async () => {
    if (deleteTarget == null) return;
    const { id } = deleteTarget;
    setDeleteSubmitting(true);
    try {
      await del(`/branches/${encodeURIComponent(id)}`);
      setDeleteTarget(null);
      showSuccess('Branch deleted.');
      if (listMode === 'client') {
        setBranches(prev => prev.filter(row => (row.id ?? row.uuid) !== id));
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
        'Could not delete branch.';
      showError(typeof msg === 'string' ? msg : 'Could not delete branch.');
    } finally {
      setDeleteSubmitting(false);
    }
  }, [deleteTarget, del, listMode, rowsPerPage, showError, showSuccess, totalCount]);

  const count = listMode === 'server' ? totalCount : branches.length;
  const paginatedRows = useMemo(() => {
    if (listMode === 'server' || listMode === null) {
      return branches;
    }
    return branches.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [listMode, branches, page, rowsPerPage]);

  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = e => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const requestDelete = useCallback(
    row => {
      const branchId = row.id ?? row.uuid;
      if (branchId == null) {
        showInfo('This row has no id.');
        return;
      }
      setDeleteTarget({
        id: branchId,
        name: row.name?.trim() || 'this branch',
      });
    },
    [showInfo]
  );

  const handleEdit = useCallback(
    row => {
      const branchId = row.id ?? row.uuid;
      if (branchId != null) navigate(`/branches/${branchId}/edit`);
      else showInfo('This row has no id.');
    },
    [navigate, showInfo]
  );

  return (
    <>
      <CustomLoader active={deleteSubmitting} />
      <FormPageShell
        title={`Branches (${count})`}
        headerAction={
          <Button variant="contained" onClick={() => navigate('/branches/new')} sx={{ borderRadius: 2 }}>
            Add branches
          </Button>
        }
        paperSx={{ p: { xs: 2, sm: 3 } }}
      >
        <BranchCardGrid
          rows={paginatedRows}
          loading={loading}
          emptyMessage="No branches yet."
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          count={count}
          getRowId={row => row.id ?? row.uuid ?? JSON.stringify(row)}
          onEdit={handleEdit}
          onDelete={requestDelete}
        />
        <Dialog
          open={deleteTarget != null}
          onClose={() => !deleteSubmitting && setDeleteTarget(null)}
          aria-labelledby="delete-branch-dialog-title"
        >
          <DialogTitle id="delete-branch-dialog-title">Delete branch?</DialogTitle>
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
