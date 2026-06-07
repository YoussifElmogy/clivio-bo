import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import FilterAltOutlined from '@mui/icons-material/FilterAltOutlined';
import { ANALYTICS_BRANCH_FILTER_ALL } from '../../payloads/analyticsPayload';

const DATE_PRESETS = [
  { id: '7d', label: '7 days', days: 7 },
  { id: '30d', label: '30 days', days: 30 },
  { id: '90d', label: '90 days', days: 90 },
  { id: 'ytd', label: 'Year to date', ytd: true },
];

export default function AnalyticsFilters({
  startDate,
  endDate,
  branchId,
  branchOptions = [],
  loading = false,
  onStartDateChange,
  onEndDateChange,
  onBranchChange,
  onPreset,
  onClear,
}) {
  const start = startDate ? dayjs(startDate) : null;
  const end = endDate ? dayjs(endDate) : null;

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        mb: 3,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: theme => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'grey.50'),
      }}
    >
      <Stack spacing={1} >
        <Stack direction="row" alignItems="center" spacing={1} >
          <FilterAltOutlined color="primary" fontSize="small" />
          <Box component="span" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
            Filters
          </Box>
        </Stack>

        <Stack direction="row" flexWrap="wrap" spacing={1} useFlexGap >
          {DATE_PRESETS.map(preset => (
            <Button
              key={preset.id}
              size="small"
              variant="outlined"
              disabled={loading}
              onClick={() => onPreset?.(preset)}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 ,mb: 2}}
            >
              {preset.label}
            </Button>
          ))}
        </Stack>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1}
          alignItems={{ xs: 'stretch', md: 'flex-end' }}
        >
          <DatePicker
            label="Start date"
            value={start?.isValid() ? start : null}
            onChange={v => onStartDateChange?.(v?.isValid() ? v.format('YYYY-MM-DD') : '')}
            disabled={loading}
            slotProps={{ textField: { size: 'small', fullWidth: true } }}
            sx={{ minWidth: { md: 180 } }}
          />
          <DatePicker
            label="End date"
            value={end?.isValid() ? end : null}
            onChange={v => onEndDateChange?.(v?.isValid() ? v.format('YYYY-MM-DD') : '')}
            disabled={loading}
            minDate={start?.isValid() ? start : undefined}
            slotProps={{ textField: { size: 'small', fullWidth: true } }}
            sx={{ minWidth: { md: 180 } }}
          />
          <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 220 } }}>
            <InputLabel id="analytics-branch-label">Branch</InputLabel>
            <Select
              labelId="analytics-branch-label"
              label="Branch"
              value={branchId ?? ANALYTICS_BRANCH_FILTER_ALL}
              onChange={e => onBranchChange?.(e.target.value)}
              disabled={loading}
            >
              <MenuItem value={ANALYTICS_BRANCH_FILTER_ALL}>All branches</MenuItem>
              {branchOptions.map(b => (
                <MenuItem key={b.id} value={String(b.id)}>
                  {b.name?.trim() || `Branch #${b.id}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            onClick={onClear}
            disabled={loading}
            sx={{ borderRadius: 2, flexShrink: 0, alignSelf: { xs: 'stretch', md: 'center' } }}
          >
            Clear filters
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
