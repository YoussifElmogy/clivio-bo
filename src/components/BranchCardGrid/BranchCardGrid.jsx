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
import AccessTime from '@mui/icons-material/AccessTime';
import EventBusy from '@mui/icons-material/EventBusy';
import PhoneOutlined from '@mui/icons-material/PhoneOutlined';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';
import { VACATION_DAY_OPTIONS } from '../../schemas/branchSchema';

const VACATION_SHORT = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

/** Parses API time strings (e.g. `09:00`, `18:00:00`) into 24h hour and minute. */
function parseTimeParts(value) {
  if (value == null || value === '') return null;
  const s = String(value).trim();
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (Number.isNaN(h) || Number.isNaN(min) || h > 23 || min > 59) return null;
  return { h, min };
}

/** Displays a single time as 12-hour with AM/PM (e.g. `6:00 PM`). */
function formatTimeAmPm(value) {
  const parts = parseTimeParts(value);
  if (!parts) return null;
  const { h, min } = parts;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  const mm = String(min).padStart(2, '0');
  return `${h12}:${mm} ${period}`;
}

function formatSchedule(row) {
  const from = formatTimeAmPm(row.from_time);
  const to = formatTimeAmPm(row.to_time);
  if (from && to) return `${from} – ${to}`;
  if (from) return `${from} –`;
  if (to) return `– ${to}`;
  return null;
}

function vacationDayLabels(row) {
  const raw = row.vacation_days;
  if (!Array.isArray(raw) || raw.length === 0) return [];
  return [...new Set(raw.map(Number).filter(n => n >= 0 && n <= 6))]
    .sort((a, b) => a - b)
    .map(v => VACATION_SHORT[v] ?? VACATION_DAY_OPTIONS.find(o => o.value === v)?.label ?? String(v));
}

function BranchCardSkeleton() {
  return (
    <Card
      elevation={0}
      variant="outlined"
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      <CardContent
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          boxSizing: 'border-box',
          pb: 2,
          pt: 2.25,
          px: 2.25,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Skeleton variant="rounded" height={26} sx={{ flex: 1, maxWidth: 220 }} />
          <Stack direction="row" spacing={0.5}>
            <Skeleton variant="circular" width={34} height={34} />
            <Skeleton variant="circular" width={34} height={34} />
          </Stack>
        </Stack>
        <Stack spacing={1.25} sx={{ mt: 2, flex: 1 }}>
          <Skeleton variant="text" width="55%" />
          <Skeleton variant="text" width="85%" />
          <Skeleton variant="text" width="45%" />
          <Skeleton variant="text" width="70%" />
        </Stack>
        <Box sx={{ mt: 'auto', pt: 2 }}>
          <Skeleton variant="rounded" width={76} height={26} sx={{ borderRadius: 1 }} />
        </Box>
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
  canEdit = true,
  canDelete = true,
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
              <Grid key={`sk-${i}`} size={{ xs: 12, sm: 6, md: 4 }} sx={{ display: 'flex' }}>
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
              const schedule = formatSchedule(row);
              const closedDays = vacationDayLabels(row);
              return (
                <Grid key={String(id)} size={{ xs: 12, sm: 6, md: 4 }} sx={{ display: 'flex' }}>
                  <Card
                    elevation={0}
                    variant="outlined"
                    sx={{
                      width: '100%',
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
                    <CardContent
                      sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        boxSizing: 'border-box',
                        pt: 2.25,
                        pb: 2,
                        px: 2.25,
                      }}
                    >
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
                          <Tooltip title={canEdit ? 'Edit' : 'No permission'}>
                            <span>
                              <IconButton
                                size="small"
                                color="primary"
                                aria-label={`Edit ${name}`}
                                onClick={() => onEdit?.(row)}
                                disabled={!canEdit}
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
                                aria-label={`Delete ${name}`}
                                onClick={() => onDelete?.(row)}
                                disabled={!canDelete}
                              >
                                <DeleteOutlineOutlined fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </Stack>

                      <Stack spacing={1.25} sx={{ mt: 2, flex: 1, minHeight: 0 }}>
                        <Stack direction="row" spacing={1} alignItems="flex-start">
                          <PhoneOutlined
                            sx={{ fontSize: 18, color: 'text.secondary', mt: 0.15, flexShrink: 0 }}
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
                        <Stack direction="row" spacing={1} alignItems="flex-start">
                          <AccessTime
                            sx={{ fontSize: 18, color: 'text.secondary', mt: 0.15, flexShrink: 0 }}
                          />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontVariantNumeric: 'tabular-nums' }}
                          >
                            {schedule ?? '—'}
                          </Typography>
                        </Stack>
                        {closedDays.length > 0 ? (
                          <Stack direction="row" spacing={1} alignItems="flex-start">
                            <EventBusy
                              sx={{ fontSize: 18, color: 'text.secondary', mt: 0.15, flexShrink: 0 }}
                              aria-hidden
                            />
                            <Stack
                              direction="row"
                            
                              sx={{ flex: 1, minWidth: 0, alignItems: 'center', gap: 0.75 ,flexWrap: 'wrap'}}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                component="span"
                                sx={{ fontWeight: 600, lineHeight: 1.2, flexShrink: 0 }}
                              >
                                Closed on
                              </Typography>
                              {closedDays.map(day => (
                                <Chip
                                  key={day}
                                  label={day}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }}
                                />
                              ))}
                            </Stack>
                          </Stack>
                        ) : 
                        <Stack direction="row" spacing={1} alignItems="flex-start">
                            <EventBusy
                              sx={{ fontSize: 18, color: 'text.secondary', mt: 0.15, flexShrink: 0 }}
                              aria-hidden
                            />
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            component="span"
                            sx={{ fontWeight: 600, flexShrink: 0  ,flex: 1, minWidth: 0}}
                          >
                            Open on all days
                          </Typography>
                        </Stack>}
                      </Stack>

                      <Box sx={{ mt: 'auto', pt: 2 }}>
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
