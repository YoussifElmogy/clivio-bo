import React, { useCallback, useMemo } from 'react';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import FlashOnOutlined from '@mui/icons-material/FlashOnOutlined';
import RadioButtonUncheckedRounded from '@mui/icons-material/RadioButtonUncheckedRounded';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import {
  PACKAGE_TYPE_AREA,
  PACKAGE_TYPE_PULSE,
  areaPackageTitle,
  clampPulseUsedInput,
  pulsePackageTitle,
} from '../../payloads/appointmentLaserPackagesPayload';
import ViewOnlyBanner from './ViewOnlyBanner';

function formatPrice(value) {
  const raw = value != null ? String(value).trim() : '';
  return raw || null;
}

function SelectablePackageCard({ selected, disabled, onToggle, children, sx }) {
  const theme = useTheme();
  return (
    <Paper
      component="button"
      type="button"
      onClick={disabled ? undefined : onToggle}
      disabled={disabled}
      variant="outlined"
      sx={{
        display: 'block',
        width: '100%',
        p: 0,
        textAlign: 'left',
        cursor: disabled ? 'not-allowed' : 'pointer',
        borderRadius: 2,
        border: '1px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        bgcolor: disabled
          ? alpha(theme.palette.action.disabledBackground, 0.4)
          : selected
            ? alpha(theme.palette.primary.main, 0.06)
            : 'background.paper',
        opacity: disabled ? 0.72 : 1,
        transition: 'border-color 0.2s, background-color 0.2s, box-shadow 0.2s',
        boxShadow: selected ? `0 0 0 1px ${alpha(theme.palette.primary.main, 0.2)}` : 'none',
        '&:hover': disabled
          ? {}
          : {
              borderColor: selected ? 'primary.main' : 'text.disabled',
              bgcolor: selected
                ? alpha(theme.palette.primary.main, 0.08)
                : alpha(theme.palette.action.hover, 0.04),
            },
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
}

function CardCheckIcon({ selected, disabled }) {
  return (
    <Box
      sx={{
        pt: 0.25,
        color: disabled ? 'action.disabled' : selected ? 'primary.main' : 'action.disabled',
        flexShrink: 0,
      }}
    >
      {selected ? (
        <CheckCircleRounded fontSize="small" />
      ) : (
        <RadioButtonUncheckedRounded fontSize="small" />
      )}
    </Box>
  );
}

function PulsePackageCard({ pkg, selected, usedPulses, readOnly, onToggle, onUsedPulsesChange }) {
  const price = formatPrice(pkg.price);
  const remaining = Number(pkg.remaining_pulses) || 0;
  const total = Number(pkg.total_pulses) || 0;
  const noRemaining = remaining <= 0;
  const disabled = readOnly || (noRemaining && !selected);

  return (
    <SelectablePackageCard selected={selected} disabled={disabled} onToggle={onToggle}>
      <Box sx={{ px: 2, py: 1.5 }}>
        <Stack direction="row" alignItems="flex-start" spacing={1.25}>
          <CardCheckIcon selected={selected} disabled={disabled} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.4 }}>
              {pulsePackageTitle(pkg)}
            </Typography>
            <Stack direction="row" flexWrap="wrap" spacing={1} sx={{ mt: 0.75 }}>
              <Chip
                size="small"
                label={`${remaining.toLocaleString()} / ${total.toLocaleString()} pulses left`}
                variant="outlined"
                sx={{ height: 22, fontSize: '0.7rem' }}
              />
              {price ? (
                <Chip size="small" label={price} color="primary" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
              ) : null}
              {noRemaining ? (
                <Chip size="small" label="No pulses remaining" color="default" sx={{ height: 22, fontSize: '0.7rem' }} />
              ) : null}
            </Stack>
          </Box>
        </Stack>

        {selected ? (
          <Box sx={{ mt: 1.5, pl: 4.25 }} onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
            <TextField
              label="Pulses to use"
              type="number"
              size="small"
              fullWidth
              value={usedPulses}
              onChange={e => onUsedPulsesChange(e.target.value, remaining)}
              disabled={readOnly || noRemaining}
              inputProps={{ min: 1, max: remaining > 0 ? remaining : 1, step: 1 }}
              helperText={remaining > 0 ? `Up to ${remaining.toLocaleString()} remaining` : 'No pulses remaining'}
            />
          </Box>
        ) : null}
      </Box>
    </SelectablePackageCard>
  );
}

function AreaPackageCard({ pkg, selected, readOnly, onToggle }) {
  const price = formatPrice(pkg.price);
  const used = Boolean(pkg.is_used);
  const disabled = readOnly || used;

  return (
    <SelectablePackageCard selected={selected} disabled={disabled} onToggle={onToggle}>
      <Box sx={{ px: 2, py: 1.5 }}>
        <Stack direction="row" alignItems="flex-start" spacing={1.25}>
          <CardCheckIcon selected={selected} disabled={disabled} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.4 }}>
              {areaPackageTitle(pkg)}
            </Typography>
            <Stack direction="row" flexWrap="wrap" spacing={1} sx={{ mt: 0.75 }}>
              {price ? (
                <Chip size="small" label={price} color="primary" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
              ) : null}
              {used ? (
                <Chip size="small" label="Already used" color="default" sx={{ height: 22, fontSize: '0.7rem' }} />
              ) : null}
            </Stack>
          </Box>
        </Stack>
      </Box>
    </SelectablePackageCard>
  );
}

function PackageSection({ title, subtitle, emptyMessage, children }) {
  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
        {title}
      </Typography>
      {subtitle ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {subtitle}
        </Typography>
      ) : null}
      {children ?? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          {emptyMessage}
        </Typography>
      )}
    </Box>
  );
}

export default function AppointmentLaserPackagesTab({
  pulsePackages = [],
  areaPackages = [],
  loading = false,
  value = [],
  onChange,
  readOnly = false,
}) {
  const theme = useTheme();

  const selectionByKey = useMemo(() => {
    const map = new Map();
    for (const item of value) {
      if (!item || typeof item !== 'object') continue;
      const type = Number(item.type);
      const record_id = Number(item.record_id);
      if (!Number.isFinite(record_id) || record_id <= 0) continue;
      map.set(`${type}:${record_id}`, item);
    }
    return map;
  }, [value]);

  const pulseRemainingByRecordId = useMemo(() => {
    const map = new Map();
    for (const pkg of pulsePackages) {
      map.set(Number(pkg.record_id), Number(pkg.remaining_pulses) || 0);
    }
    return map;
  }, [pulsePackages]);

  const updateSelection = useCallback(
    (nextMap) => {
      if (typeof onChange !== 'function') return;
      onChange(Array.from(nextMap.values()));
    },
    [onChange]
  );

  const togglePulse = useCallback(
    recordId => {
      if (readOnly) return;
      const key = `${PACKAGE_TYPE_PULSE}:${recordId}`;
      const next = new Map(selectionByKey);
      if (next.has(key)) {
        next.delete(key);
      } else {
        const remaining = pulseRemainingByRecordId.get(recordId) ?? 0;
        if (remaining <= 0) return;
        next.set(key, { type: PACKAGE_TYPE_PULSE, record_id: recordId, used_pulses: '' });
      }
      updateSelection(next);
    },
    [readOnly, selectionByKey, pulseRemainingByRecordId, updateSelection]
  );

  const setPulseUsed = useCallback(
    (recordId, usedPulses, remaining) => {
      if (readOnly) return;
      const key = `${PACKAGE_TYPE_PULSE}:${recordId}`;
      const next = new Map(selectionByKey);
      const existing = next.get(key);
      if (!existing) return;
      next.set(key, {
        ...existing,
        used_pulses: clampPulseUsedInput(usedPulses, remaining),
      });
      updateSelection(next);
    },
    [readOnly, selectionByKey, updateSelection]
  );

  const toggleArea = useCallback(
    recordId => {
      if (readOnly) return;
      const key = `${PACKAGE_TYPE_AREA}:${recordId}`;
      const next = new Map(selectionByKey);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.set(key, { type: PACKAGE_TYPE_AREA, record_id: recordId });
      }
      updateSelection(next);
    },
    [readOnly, selectionByKey, updateSelection]
  );

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
        <CircularProgress size={32} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Loading laser packages…
        </Typography>
      </Stack>
    );
  }

  const hasPackages = pulsePackages.length > 0 || areaPackages.length > 0;

  return (
    <Box>
      {readOnly ? <ViewOnlyBanner /> : null}

      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 3 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            color: 'primary.main',
            flexShrink: 0,
          }}
        >
          <FlashOnOutlined fontSize="small" />
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
            Laser packages
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Select pulse packages and enter pulses used, or choose area packages for this visit.
          </Typography>
        </Box>
      </Stack>

      {!hasPackages ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
          This patient has no laser packages on file.
        </Typography>
      ) : (
        <Stack spacing={3.5}>
          <PackageSection
            title="Pulse packages"
            subtitle="Select one or more packages and enter how many pulses to use."
            emptyMessage="No pulse packages available."
          >
            {pulsePackages.length > 0 ? (
              <Stack spacing={1.5}>
                {pulsePackages.map(pkg => {
                  const recordId = Number(pkg.record_id);
                  const key = `${PACKAGE_TYPE_PULSE}:${recordId}`;
                  const selected = selectionByKey.has(key);
                  const selection = selectionByKey.get(key);
                  return (
                    <PulsePackageCard
                      key={key}
                      pkg={pkg}
                      selected={selected}
                      usedPulses={selection?.used_pulses ?? ''}
                      readOnly={readOnly}
                      onToggle={() => togglePulse(recordId)}
                      onUsedPulsesChange={(v, remaining) => setPulseUsed(recordId, v, remaining)}
                    />
                  );
                })}
              </Stack>
            ) : null}
          </PackageSection>

          <PackageSection
            title="Area packages"
            subtitle="Select one or more area packages to redeem on this visit."
            emptyMessage="No area packages available."
          >
            {areaPackages.length > 0 ? (
              <Stack spacing={1.5}>
                {areaPackages.map(pkg => {
                  const recordId = Number(pkg.record_id);
                  const key = `${PACKAGE_TYPE_AREA}:${recordId}`;
                  const selected = selectionByKey.has(key);
                  return (
                    <AreaPackageCard
                      key={key}
                      pkg={pkg}
                      selected={selected}
                      readOnly={readOnly}
                      onToggle={() => toggleArea(recordId)}
                    />
                  );
                })}
              </Stack>
            ) : null}
          </PackageSection>
        </Stack>
      )}
    </Box>
  );
}
