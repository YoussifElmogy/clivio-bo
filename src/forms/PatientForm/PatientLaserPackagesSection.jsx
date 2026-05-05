import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FlashOnOutlined from '@mui/icons-material/FlashOnOutlined';
import useApi from '../../configs/useApi';
import { useToast } from '../../context/ToastContext';
import usePermissions from '../../hooks/usePermissions';
import { PERM } from '../../config/permissions';
import { parsePaginatedList } from '../../utils/parsePaginatedList';

const LIST_PAGE_SIZE = 200;

function optionPrimaryId(row) {
  if (row == null || typeof row !== 'object') return null;
  const v = row.id ?? row.uuid;
  if (v == null) return null;
  if (typeof v === 'number' && Number.isInteger(v) && v > 0) return v;
  const n = Number(v);
  if (Number.isInteger(n) && n > 0) return n;
  return null;
}

function pulseOptionLabel(row) {
  const pulses = row?.pulses != null && row.pulses !== '' ? String(row.pulses) : '—';
  const price = row?.price != null && String(row.price).trim() !== '' ? String(row.price).trim() : '';
  return price ? `${pulses} pulses · ${price}` : `${pulses} pulses`;
}

function areaOptionLabel(row) {
  const name = typeof row?.name === 'string' && row.name.trim() ? row.name.trim() : 'Area package';
  const price = row?.price != null && String(row.price).trim() !== '' ? String(row.price).trim() : '';
  return price ? `${name} · ${price}` : name;
}

function rowsWithNumericIds(rows) {
  return (rows ?? []).filter(r => optionPrimaryId(r) != null);
}

/**
 * Optional laser packages (pulse + area) for patient create/edit.
 * Shown only when the user can view laser catalog.
 */
export default function PatientLaserPackagesSection({ disabled = false }) {
  const theme = useTheme();
  const { control } = useFormContext();
  const { get } = useApi();
  const { showError } = useToast();
  const { can } = usePermissions();
  const canViewLaser = can(PERM.VIEW_LASER);

  const [pulseOptions, setPulseOptions] = useState([]);
  const [areaOptions, setAreaOptions] = useState([]);
  const [loadingPulse, setLoadingPulse] = useState(false);
  const [loadingArea, setLoadingArea] = useState(false);

  const fetchPulse = useCallback(async () => {
    setLoadingPulse(true);
    try {
      const data = await get(`/pulse-packages?page=1&page_size=${LIST_PAGE_SIZE}`);
      const parsed = parsePaginatedList(data, {
        listKeys: ['pulse_packages', 'pulsePackages', 'items', 'results'],
      });
      setPulseOptions(rowsWithNumericIds(parsed.rows));
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not load pulse packages.';
      showError(typeof msg === 'string' ? msg : 'Could not load pulse packages.');
      setPulseOptions([]);
    } finally {
      setLoadingPulse(false);
    }
  }, [ showError]);

  const fetchArea = useCallback(async () => {
    setLoadingArea(true);
    try {
      const data = await get(`/area-packages?page=1&page_size=${LIST_PAGE_SIZE}`);
      const parsed = parsePaginatedList(data, {
        listKeys: ['area_packages', 'areaPackages', 'items', 'results'],
      });
      setAreaOptions(rowsWithNumericIds(parsed.rows));
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not load area packages.';
      showError(typeof msg === 'string' ? msg : 'Could not load area packages.');
      setAreaOptions([]);
    } finally {
      setLoadingArea(false);
    }
  }, [ showError]);

  useEffect(() => {
    if (!canViewLaser) return;
    void Promise.all([fetchPulse(), fetchArea()]);
  }, [canViewLaser, fetchPulse, fetchArea]);

  const pulsePackageIds = useWatch({ control, name: 'pulse_package_ids', defaultValue: [] });
  const areaPackageIds = useWatch({ control, name: 'area_package_ids', defaultValue: [] });
  const packageCount =
    (Array.isArray(pulsePackageIds) ? pulsePackageIds.length : 0) +
    (Array.isArray(areaPackageIds) ? areaPackageIds.length : 0);

  const [laserSectionExpanded, setLaserSectionExpanded] = useState(false);

  useEffect(() => {
    if (packageCount > 0) setLaserSectionExpanded(true);
  }, [packageCount]);

  const pulseById = useMemo(() => {
    const m = new Map();
    for (const row of pulseOptions) {
      const id = optionPrimaryId(row);
      if (id != null) m.set(id, row);
    }
    return m;
  }, [pulseOptions]);

  const areaById = useMemo(() => {
    const m = new Map();
    for (const row of areaOptions) {
      const id = optionPrimaryId(row);
      if (id != null) m.set(id, row);
    }
    return m;
  }, [areaOptions]);

  if (!canViewLaser) return null;

  const listBusy = loadingPulse || loadingArea;

  return (
    <Grid size={12}>
      <Accordion
        expanded={laserSectionExpanded}
        onChange={(_, next) => setLaserSectionExpanded(next)}
        disableGutters
        elevation={0}
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: theme => alpha(theme.palette.primary.main, 0.03),
          '&:before': { display: 'none' },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="patient-laser-packages-content"
          id="patient-laser-packages-header"
          sx={{
            px: 2,
            py: 1.25,
            '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1.25, my: 0.5 },
          }}
        >
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
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
              Laser packages
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              Optional pulse and area packages. Open to choose one or both.
            </Typography>
          </Box>
          {listBusy ? (
            <CircularProgress size={22} thickness={5} sx={{ ml: 'auto', flexShrink: 0 }} aria-label="Loading packages" />
          ) : null}
        </AccordionSummary>
        <AccordionDetails sx={{ px: 2, pb: 2.5, pt: 0 }}>
          <Stack spacing={2.5}>
            <Controller
              name="pulse_package_ids"
              control={control}
              render={({ field, fieldState }) => {
                const ids = Array.isArray(field.value) ? field.value.map(Number).filter(Number.isFinite) : [];
                const selectedRows = ids.map(id => pulseById.get(id) ?? { id, _fallback: true });
                return (
                  <Autocomplete
                    multiple
                    options={pulseOptions}
                    loading={loadingPulse}
                    disabled={disabled}
                    getOptionLabel={opt => (opt?._fallback ? `Pulse package #${opt.id}` : pulseOptionLabel(opt))}
                    isOptionEqualToValue={(a, b) => optionPrimaryId(a) === optionPrimaryId(b)}
                    value={selectedRows}
                    onChange={(_, newRows) => {
                      const next = (newRows ?? [])
                        .map(r => optionPrimaryId(r))
                        .filter(id => id != null);
                      field.onChange(next);
                    }}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => {
                        const id = optionPrimaryId(option);
                        const label = option?._fallback ? `Pulse package #${id}` : pulseOptionLabel(option);
                        return <Chip {...getTagProps({ index })} key={id ?? index} size="small" label={label} />;
                      })
                    }
                    renderInput={params => (
                      <TextField
                        {...params}
                        label="Pulse packages"
                        placeholder={loadingPulse ? 'Loading…' : 'Search or select'}
                        error={Boolean(fieldState.error)}
                        helperText={fieldState.error?.message || 'Optional — multiple allowed'}
                        slotProps={{
                          ...params.slotProps,
                          input: {
                            ...params.slotProps?.input,
                            endAdornment: (
                              <>
                                {loadingPulse ? <CircularProgress color="inherit" size={18} /> : null}
                                {params.slotProps?.input?.endAdornment}
                              </>
                            ),
                          },
                        }}
                      />
                    )}
                  />
                );
              }}
            />
            <Controller
              name="area_package_ids"
              control={control}
              render={({ field, fieldState }) => {
                const ids = Array.isArray(field.value) ? field.value.map(Number).filter(Number.isFinite) : [];
                const selectedRows = ids.map(id => areaById.get(id) ?? { id, _fallback: true });
                return (
                  <Autocomplete
                    multiple
                    options={areaOptions}
                    loading={loadingArea}
                    disabled={disabled}
                    getOptionLabel={opt => (opt?._fallback ? `Area package #${opt.id}` : areaOptionLabel(opt))}
                    isOptionEqualToValue={(a, b) => optionPrimaryId(a) === optionPrimaryId(b)}
                    value={selectedRows}
                    onChange={(_, newRows) => {
                      const next = (newRows ?? [])
                        .map(r => optionPrimaryId(r))
                        .filter(id => id != null);
                      field.onChange(next);
                    }}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => {
                        const id = optionPrimaryId(option);
                        const label = option?._fallback ? `Area package #${id}` : areaOptionLabel(option);
                        return <Chip {...getTagProps({ index })} key={id ?? index} size="small" label={label} />;
                      })
                    }
                    renderInput={params => (
                      <TextField
                        {...params}
                        label="Area packages"
                        placeholder={loadingArea ? 'Loading…' : 'Search or select'}
                        error={Boolean(fieldState.error)}
                        helperText={fieldState.error?.message || 'Optional — multiple allowed'}
                        slotProps={{
                          ...params.slotProps,
                          input: {
                            ...params.slotProps?.input,
                            endAdornment: (
                              <>
                                {loadingArea ? <CircularProgress color="inherit" size={18} /> : null}
                                {params.slotProps?.input?.endAdornment}
                              </>
                            ),
                          },
                        }}
                      />
                    )}
                  />
                );
              }}
            />
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Grid>
  );
}
