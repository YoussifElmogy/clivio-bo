import React, { useMemo } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import { buildUsedPackagesReviewSummary } from '../../payloads/appointmentLaserPackagesPayload';
import { reservationPricingSourceLabel } from '../../payloads/reservationPricingPayload';
import { formatMoney } from '../../utils/formatMoney';

function PricingLineItemsSection({
  items,
  loading,
  error,
  grandTotal,
  currency,
  discount = '',
  onDiscountChange,
  submitting = false,
  readOnly = false,
}) {
  const theme = useTheme();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography variant="body2" color="error">
        {error}
      </Typography>
    );
  }

  if (!items?.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No priced items yet. Save face/body mapping, then open review again.
      </Typography>
    );
  }

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table size="small" sx={{ minWidth: 520 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>Source</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Zone / service</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Detail</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700 }}>
              Unit
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 700 }}>
              Total
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map(row => {
            const zoneService = [row.zone_label, row.service_name].filter(Boolean).join(' · ') || '—';
            return (
              <TableRow key={row.id} hover>
                <TableCell>
                  <Chip
                    label={reservationPricingSourceLabel(row.source)}
                    size="small"
                    variant="outlined"
                    sx={{ height: 22, fontSize: '0.7rem' }}
                  />
                </TableCell>
                <TableCell sx={{ maxWidth: 140 }}>{zoneService}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                <TableCell color="text.secondary">{row.detail ?? '—'}</TableCell>
                <TableCell align="right">{formatMoney(row.unit_price ?? row.unit_price_number, currency)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  {formatMoney(row.total ?? row.total_number, currency)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <TextField
        label="Discount (optional)"
        type="number"
        size="small"
        value={discount}
        onChange={e => onDiscountChange?.(e.target.value)}
        disabled={submitting || readOnly}
        inputProps={{ min: 0, step: '0.01' }}
        InputProps={{
          readOnly: readOnly || undefined,
          endAdornment: <InputAdornment position="end">{currency}</InputAdornment>,
        }}
        sx={{ mt: 3, maxWidth: 280, display: 'block' }}
      />

      <Paper
        variant="outlined"
        sx={{
          mt: 2,
          p: 2.5,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.success.main, 0.06),
          borderColor: alpha(theme.palette.success.main, 0.35),
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          columnGap={4}
          rowGap={1.5}
          spacing={1}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Grand total
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'success.dark' }}>
            {formatMoney(grandTotal, currency)}
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}

function LaserPackagesReviewSection({
  usedPackages = [],
  pulsePackages = [],
  areaPackages = [],
}) {
  const theme = useTheme();
  const summary = useMemo(
    () => buildUsedPackagesReviewSummary(usedPackages, pulsePackages, areaPackages),
    [usedPackages, pulsePackages, areaPackages]
  );

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: alpha(theme.palette.warning.main, 0.04),
      }}
    >
      {!summary.hasSelections ? (
        <Typography variant="body2" color="text.secondary">
          No laser packages selected for this visit.
        </Typography>
      ) : (
        <Stack spacing={2}>
          {summary.pulseItems.length > 0 ? (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.75 }}>
                Pulse packages
              </Typography>
              <Stack spacing={0.75}>
                {summary.pulseItems.map(item => (
                  <Stack
                    key={`pulse-${item.record_id}`}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={2}
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <Typography variant="body2">{item.title}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.used_pulses > 0
                        ? `${item.used_pulses.toLocaleString()} pulses`
                        : '—'}
                      {item.remaining_pulses > 0
                        ? ` · ${item.remaining_pulses.toLocaleString()} remaining`
                        : ''}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          ) : null}

          {summary.areaItems.length > 0 ? (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.75 }}>
                Area packages
              </Typography>
              <Stack spacing={0.75}>
                {summary.areaItems.map(item => (
                  <Typography key={`area-${item.record_id}`} variant="body2">
                    · {item.title}
                  </Typography>
                ))}
              </Stack>
            </Box>
          ) : null}
        </Stack>
      )}
    </Paper>
  );
}

export default function DermaReviewRequestDialog({
  open,
  onClose,
  patientName,
  reservationId,
  reviewPayload,
  pricingItems = [],
  pricingLoading = false,
  pricingError = null,
  grandTotal = null,
  currency = 'EGP',
  discount = '',
  onDiscountChange,
  submitting = false,
  onSubmit,
  readOnly = false,
  showLaserPackages = false,
  showPricing = true,
  usedPackages = [],
  pulsePackages = [],
  areaPackages = [],
}) {
  const theme = useTheme();

  const prescription = reviewPayload?.prescription ?? {};
  const visitTypeLabel =
    reviewPayload?.general_service?.name ??
    (reviewPayload?.visit_type?.trim?.() || '—');

  const medicines = useMemo(
    () => (Array.isArray(prescription.medicines) ? prescription.medicines : []),
    [prescription.medicines]
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        {readOnly ? 'View review request' : 'Review request'}
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400, mt: 0.5 }}>
          {patientName ? `${patientName} · ` : ''}
          Appointment #{reservationId}
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ px: { xs: 2, sm: 3 } }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
              Prescription
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.04),
              }}
            >
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography variant="body2" color="text.secondary">
                    Type:
                  </Typography>
                  <Chip label={visitTypeLabel} size="small" color="primary" variant="outlined" />
                </Stack>
                {prescription.patient ? (
                  <Typography variant="body2" color="text.secondary">
                    Patient: {prescription.patient.name ?? '—'}
                    {prescription.patient.age != null ? ` · Age ${prescription.patient.age}` : ''}
                  </Typography>
                ) : null}
                <Typography variant="body2" color="text.secondary">
                  Attachments: {prescription.attachments_count ?? 0}
                </Typography>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.75 }}>
                    Medicines
                  </Typography>
                  {medicines.length > 0 ? (
                    <Stack spacing={0.75}>
                      {medicines.map((m, i) => (
                        <Typography key={`${m.name}-${i}`} variant="body2">
                          · {m.name}
                          {m.description ? ` — ${m.description}` : ''}
                        </Typography>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No medicines added.
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Paper>
          </Box>

          {showLaserPackages ? (
            <>
              <Divider />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Laser packages
                </Typography>
                <LaserPackagesReviewSection
                  usedPackages={usedPackages}
                  pulsePackages={pulsePackages}
                  areaPackages={areaPackages}
                />
              </Box>
            </>
          ) : null}

          {showPricing ? (
            <>
              <Divider />

              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Pricing
                </Typography>
                <PricingLineItemsSection
                  items={pricingItems}
                  loading={pricingLoading}
                  error={pricingError}
                  grandTotal={grandTotal}
                  currency={currency}
                  discount={discount}
                  onDiscountChange={onDiscountChange}
                  submitting={submitting}
                  readOnly={readOnly}
                />
              </Box>
            </>
          ) : null}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={submitting} sx={{ borderRadius: 2 }}>
          Close
        </Button>
        {!readOnly ? (
          <Button
            variant="contained"
            onClick={onSubmit}
            disabled={submitting}
            startIcon={
              submitting ? (
                <CircularProgress size={18} thickness={5} color="inherit" aria-hidden />
              ) : null
            }
            sx={{ borderRadius: 2, minWidth: 160 }}
          >
            {submitting ? 'Submitting…' : 'Submit review request'}
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}
