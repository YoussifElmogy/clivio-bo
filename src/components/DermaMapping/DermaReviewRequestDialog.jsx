import React, { useMemo } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import { isMapBodyZoneId } from '../../constants/customBodyZones';
import { isMapFaceZoneId } from '../../constants/customFaceZones';
import { formatDermaZoneProductChipLabel } from '../../schemas/productSchema';

function formatMoney(amount, currency = 'EGP') {
  if (amount == null || !Number.isFinite(Number(amount))) return '—';
  return `${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
}

function MappingSection({ title, zones, emptyMessage, isMapZoneId = isMapFaceZoneId }) {
  if (!zones?.length) {
    return (
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <Chip label={`${zones.length} zone${zones.length === 1 ? '' : 's'}`} size="small" variant="outlined" />
      </Stack>
      <Stack spacing={1.25}>
        {zones.map(zone => {
          const serviceBlocks =
            Array.isArray(zone.services) && zone.services.length > 0
              ? zone.services
              : zone.service
                ? [{ service: zone.service, lines: zone.lines ?? [] }]
                : [];

          const zoneKey = zone.zone_id ?? zone.zone_label ?? 'zone';

          return (
            <Paper key={zoneKey} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                {isMapZoneId(zone.zone_id)
                  ? `Zone ${zone.zone_id} — ${zone.zone_label}`
                  : zone.zone_label || 'Additional zone'}
              </Typography>
              <Stack spacing={1.25}>
                {serviceBlocks.map((block, blockIdx) => {
                  const svc = block.service ?? {};
                  const lines = block.lines ?? [];
                  return (
                    <Box key={`${zoneKey}-${svc.id ?? block.id ?? blockIdx}`}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                        {svc.name ?? `Service #${block.id ?? svc.id}`}
                        {svc.category_display ? ` · ${svc.category_display}` : ''}
                      </Typography>
                      <Stack direction="row" flexWrap="wrap" gap={0.5} useFlexGap>
                        {lines.map((line, idx) => (
                          <Chip
                            key={`${line.line_type}-${line.product_id ?? line.machine_id ?? idx}`}
                            label={lineToChipLabel(line)}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
}

function lineToChipLabel(line) {
  if (!line) return 'Item';
  if (line.line_type === 'machine') {
    return formatDermaZoneProductChipLabel({
      catalogKind: 'machine',
      name: line.machine_name,
      type: line.machine_type,
      minutes: line.minutes,
      pulses: line.pulses,
    });
  }
  return formatDermaZoneProductChipLabel({
    catalogKind: 'product',
    name: line.product_name,
    type: line.product_type,
    quantity: line.quantity,
    volume_ml: line.volume_ml,
    machineName: line.machine_name,
  });
}

export default function DermaReviewRequestDialog({
  open,
  onClose,
  patientName,
  reservationId,
  reviewPayload,
  totalPrice,
  currency = 'EGP',
  submitting = false,
  onSubmit,
}) {
  const theme = useTheme();

  const faceZones = reviewPayload?.face_mapping?.zones ?? [];
  const bodyZones = reviewPayload?.body_mapping?.zones ?? [];
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
        Review request
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400, mt: 0.5 }}>
          {patientName ? `${patientName} · ` : ''}
          Appointment #{reservationId}
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ px: { xs: 2, sm: 3 } }}>
        <Stack spacing={3}>
          <MappingSection
            title="Face mapping"
            zones={faceZones}
            emptyMessage="No face zones selected yet."
          />

          <Divider />

          <MappingSection
            title="Body mapping"
            zones={bodyZones}
            emptyMessage="No body zones selected yet."
            isMapZoneId={isMapBodyZoneId}
          />

          <Divider />

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

          <Divider />

          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.success.main, 0.06),
              borderColor: alpha(theme.palette.success.main, 0.35),
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Total price
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'success.dark' }}>
                {formatMoney(totalPrice, currency)}
              </Typography>
            </Stack>
            {totalPrice == null ? (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Pricing will be calculated when you submit the review request.
              </Typography>
            ) : null}
          </Paper>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={submitting} sx={{ borderRadius: 2 }}>
          Close
        </Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={submitting}
          sx={{ borderRadius: 2, minWidth: 160 }}
        >
          {submitting ? 'Submitting…' : 'Submit review request'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
