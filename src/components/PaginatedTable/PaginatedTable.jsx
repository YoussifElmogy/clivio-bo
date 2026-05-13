import React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import { useTheme } from '@mui/material/styles';

/**
 * Client-side paginated table. Pass the full `rows` array and `page` / `rowsPerPage`; slice rows before passing if you paginate server-side.
 *
 * @param {Array<{ id: string, label: string, align?: 'left'|'right'|'center', minWidth?: number, render?: (row) => React.ReactNode }>} columns
 * @param {function} [getCellValue] (row, column) => value for default cells when `render` is omitted
 * @param {number} [skeletonRows] number of placeholder rows while loading (capped by `rowsPerPage`)
 * @param {function} [onRowClick] (row) => void; when set, rows are clickable with pointer cursor
 */
export default function PaginatedTable({
  columns,
  rows,
  loading = false,
  emptyMessage = 'No data yet.',
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  count,
  rowsPerPageOptions = [5, 10, 25],
  getRowId = row => row.id,
  getCellValue,
  skeletonRows: skeletonRowsProp,
  onRowClick,
}) {
  const theme = useTheme();
  const skeletonRowCount = Math.min(
    skeletonRowsProp ?? rowsPerPage ?? 10,
    rowsPerPage ?? 10,
    25
  );

  const defaultGetCellValue = (row, col) => {
    if (getCellValue) return getCellValue(row, col);
    if (col.id in row && row[col.id] !== undefined) return row[col.id];
    return '';
  };

  return (
    <Paper
      elevation={0}
      variant="outlined"
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        borderColor: 'divider',
      }}
    >
      <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}>
        <Table size="medium" stickyHeader sx={{ minWidth: 640 }}>
          <TableHead>
            <TableRow>
              {columns.map(col => (
                <TableCell
                  key={col.id}
                  align={col.align ?? 'left'}
                  sx={{
                    fontWeight: 600,
                    minWidth: col.minWidth,
                    bgcolor: 'background.paper',
                    backgroundImage: `linear-gradient(180deg, ${theme.palette.background.paper} 0%, rgba(15, 118, 110, 0.04) 100%)`,
                  }}
                >
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: skeletonRowCount }, (_, i) => (
                <TableRow key={`skeleton-${i}`} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  {columns.map(col => (
                    <TableCell key={col.id} align={col.align ?? 'left'} sx={{ py: 1.75 }}>
                      <Skeleton
                        variant="rounded"
                        height={22}
                        width="100%"
                        sx={{
                          maxWidth: col.minWidth ? Math.min(col.minWidth + 40, 280) : 200,
                          transform: 'none',
                        }}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">{emptyMessage}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map(row => (
                <TableRow
                  key={String(getRowId(row))}
                  hover
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  sx={{
                    '&:last-child td': { borderBottom: 0 },
                    ...(onRowClick ? { cursor: 'pointer' } : {}),
                  }}
                >
                  {columns.map(col => (
                    <TableCell key={col.id} align={col.align ?? 'left'} sx={{ verticalAlign: 'middle' }}>
                      {col.render ? col.render(row) : defaultGetCellValue(row, col)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {!loading && count > 0 ? (
        <TablePagination
          component="div"
          count={count}
          page={page}
          onPageChange={onPageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={onRowsPerPageChange}
          rowsPerPageOptions={rowsPerPageOptions}
          labelRowsPerPage="Rows per page"
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            '& .MuiTablePagination-toolbar': { px: 1 },
          }}
        />
      ) : null}
    </Paper>
  );
}
