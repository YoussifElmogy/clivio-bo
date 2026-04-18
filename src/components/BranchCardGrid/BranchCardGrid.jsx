import React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import TablePagination from '@mui/material/TablePagination';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import PhoneOutlined from '@mui/icons-material/PhoneOutlined';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';

function BranchCardSkeleton() {
  return (
    <Card
      elevation={0}
      variant="outlined"
      sx={{
        height: '100%',
        borderRadius: 2,
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      <CardContent sx={{ pb: 2, pt: 2.25, px: 2.25 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Skeleton variant="rounded" height={26} sx={{ flex: 1, maxWidth: 220 }} />
          <Stack direction="row" spacing={0.5}>
            <Skeleton variant="circular" width={34} height={34} />
            <Skeleton variant="circular" width={34} height={34} />
          </Stack>
        </Stack>
        <Skeleton variant="text" width="55%" sx={{ mt: 2 }} />
        <Skeleton variant="text" width="85%" />
        <Skeleton variant="rounded" width={76} height={26} sx={{ mt: 2, borderRadius: 1 }} />
      </CardContent>
    </Card>
  );
}

/**
 * Responsive card grid for branch lists. Pagination matches {@link PaginatedTable} behavior.
 */
export default function BranchCardGrid({
  rows,
  loading = false,
  emptyMessage = 'No branches yet.',
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  count,
  rowsPerPageOptions = [5, 10, 25],
  onEdit,
  onDelete,
  getRowId = row => row.id,
  skeletonCount: skeletonCountProp,
}) {
  const skeletonCount = Math.min(
    skeletonCountProp ?? rowsPerPage ?? 8,
    rowsPerPage ?? 8,
    12
  );

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
      <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
        {loading ? (
          <Grid container spacing={2.5}>
            {Array.from({ length: skeletonCount }, (_, i) => (
              <Grid key={`sk-${i}`} size={{ xs: 12, sm: 6, md: 4 }}>
                <BranchCardSkeleton />
              </Grid>
            ))}
          </Grid>
        ) : rows.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
            {emptyMessage}
          </Typography>
        ) : (
          <Grid container spacing={2.5}>
            {rows.map(row => {
              const id = getRowId(row);
              const active = row.active ?? row.is_active;
              const name = row.name?.trim() || '—';
              const phone = row.phone ?? '—';
              const address = row.address ?? '—';
              return (
                <Grid key={String(id)} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card
                    elevation={0}
                    variant="outlined"
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 2,
                      borderColor: 'divider',
                      transition: theme =>
                        `box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease`,
                      '&:hover': {
                        borderColor: 'primary.light',
                        boxShadow: 2,
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <CardContent sx={{ flex: 1, pt: 2.25, pb: 2, px: 2.25 }}>
                      <Stack
                        direction="row"
                        alignItems="flex-start"
                        justifyContent="space-between"
                        gap={1}
                      >
                        <Typography
                          variant="subtitle1"
                          component="h2"
                          sx={{
                            fontWeight: 700,
                            lineHeight: 1.35,
                            pr: 0.5,
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          {name}
                        </Typography>
                        <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0, mt: -0.5 }}>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              color="primary"
                              aria-label={`Edit ${name}`}
                              onClick={() => onEdit?.(row)}
                            >
                              <EditOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              aria-label={`Delete ${name}`}
                              onClick={() => onDelete?.(row)}
                            >
                              <DeleteOutlineOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Stack>

                      <Stack spacing={1.25} sx={{ mt: 2 }}>
                        <Stack direction="row" spacing={1} alignItems="flex-start">
                          <PhoneOutlined
                            sx={{ fontSize: 18, color: 'text.secondary', mt: 0.15 }}
                          />
                          <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                            {phone}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="flex-start">
                          <PlaceOutlined
                            sx={{ fontSize: 18, color: 'text.secondary', mt: 0.15, flexShrink: 0 }}
                          />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              wordBreak: 'break-word',
                            }}
                          >
                            {address}
                          </Typography>
                        </Stack>
                      </Stack>

                      <Box sx={{ mt: 2 }}>
                        <Chip
                          size="small"
                          label={active ? 'Active' : 'Inactive'}
                          color={active ? 'success' : 'default'}
                          variant={active ? 'filled' : 'outlined'}
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>

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
            '& .MuiTablePagination-toolbar': { px: 2, py: 1 },
          }}
        />
      ) : null}
    </Paper>
  );
}
