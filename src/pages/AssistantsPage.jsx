import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useToast } from '../context/ToastContext';
import usePermissions from '../hooks/usePermissions';
import { PERM } from '../config/permissions';
import { parsePaginatedList } from '../utils/parsePaginatedList';
import { formatAssistantBranchesCell } from '../payloads/assistantPayload';

export default function AssistantsPage() {
  const navigate = useNavigate();
  const { get, del } = useApi();
  const { showError, showInfo, showSuccess } = useToast();
  const { can } = usePermissions();
  const canAddAssistant = can(PERM.ADD_ASSISTANT);
  const canEditAssistant = can(PERM.EDIT_ASSISTANT);
  const canDeleteAssistant = can(PERM.DELETE_ASSISTANT);
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
        const data = await get(`/assistants?page=${page + 1}&page_size=${rowsPerPage}`);
        if (cancelled) return;
        const parsed = parsePaginatedList(data, { listKeys: ['assistants'] });
        setRows(parsed.rows);
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
            'Could not load assistants.';
          showError(typeof msg === 'string' ? msg : 'Could not load assistants.');
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
      await del(`/assistants/${encodeURIComponent(id)}`);
      setDeleteTarget(null);
      showSuccess('Assistant deleted.');
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
        'Could not delete assistant.';
      showError(typeof msg === 'string' ? msg : 'Could not delete assistant.');
    } finally {
      setDeleteSubmitting(false);
    }
  }, [deleteTarget, del, listMode, rowsPerPage, showError, showSuccess, totalCount]);

  const requestDelete = useCallback(
    row => {
      const assistantId = row.id ?? row.uuid;
      if (assistantId == null) {
        showInfo('This row has no id.');
        return;
      }
      setDeleteTarget({
        id: assistantId,
        name: row.name?.trim() || row.email || 'this assistant',
      });
    },
    [showInfo]
  );

  const count = listMode === 'server' ? totalCount : rows.length;
  const paginatedRows = useMemo(() => {
    if (listMode === 'server' || listMode === null) {
      return rows;
    }
    return rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [listMode, rows, page, rowsPerPage]);

  const columns = useMemo(
    () => [
      { id: 'name', label: 'Name', minWidth: 160 },
      { id: 'email', label: 'Email', minWidth: 200 },
      { id: 'phone', label: 'Phone', minWidth: 130 },
      { id: 'branch', label: 'Branches', minWidth: 160 },
      {
        id: 'actions',
        label: 'Actions',
        align: 'right',
        minWidth: 100,
        render: row => {
          const assistantId = row.id ?? row.uuid;
          return (
            <>
              <Tooltip title={canEditAssistant ? 'Edit' : 'No permission'}>
                <span>
                  <IconButton
                    size="small"
                    color="primary"
                    aria-label="Edit assistant"
                    onClick={() => {
                      if (assistantId != null) navigate(`/assistants/${assistantId}/edit`);
                      else showInfo('This row has no id.');
                    }}
                    disabled={!canEditAssistant}
                  >
                    <EditOutlined fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={canDeleteAssistant ? 'Delete' : 'No permission'}>
                <span>
                  <IconButton
                    size="small"
                    color="error"
                    aria-label="Delete assistant"
                    onClick={() => requestDelete(row)}
                    disabled={!canDeleteAssistant}
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
    [navigate, requestDelete, showInfo, canEditAssistant, canDeleteAssistant]
  );

  const getCellValue = useCallback((row, col) => {
    if (col.id === 'name') return row.name ?? '—';
    if (col.id === 'email') return row.email ?? '—';
    if (col.id === 'phone') return row.phone ?? '—';
    if (col.id === 'branch') {
      return formatAssistantBranchesCell(row);
    }
    return '';
  }, []);

  return (
    <>
      <CustomLoader active={deleteSubmitting} />
      <FormPageShell
        title={`Assistants (${count})`}
        headerAction={
          <Tooltip title={canAddAssistant ? 'Add assistant' : 'No permission'}>
            <span>
              <Button
                variant="contained"
                onClick={() => navigate('/assistants/new')}
                sx={{ borderRadius: 2 }}
                disabled={!canAddAssistant}
              >
                Add assistant
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
          emptyMessage="No assistants yet."
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
          aria-labelledby="delete-assistant-dialog-title"
        >
          <DialogTitle id="delete-assistant-dialog-title">Delete assistant?</DialogTitle>
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
