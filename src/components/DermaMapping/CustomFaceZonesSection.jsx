import React, { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddRounded from '@mui/icons-material/AddRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlined from '@mui/icons-material/EditOutlined';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';
import { alpha, useTheme } from '@mui/material/styles';
import CustomZoneLabelDialog from './CustomZoneLabelDialog';

function CustomZoneCard({
  zone,
  hasTreatment,
  serviceCount,
  disabled,
  notOnMapCaption,
  onAddTreatment,
  onEditLabel,
  onRemove,
}) {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: hasTreatment ? alpha(theme.palette.primary.main, 0.4) : 'divider',
        bgcolor: hasTreatment ? alpha(theme.palette.primary.main, 0.04) : 'background.paper',
        transition: theme.transitions.create(['border-color', 'box-shadow', 'background-color']),
        '&:hover': {
          borderColor: alpha(theme.palette.primary.main, 0.35),
          boxShadow: `0 6px 24px ${alpha(theme.palette.common.black, 0.06)}`,
        },
      }}
    >
      <Stack direction="row" alignItems="flex-start" spacing={1.5}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(theme.palette.secondary.main, 0.12),
            color: 'secondary.main',
          }}
        >
          <PlaceOutlined />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 0.5 }}>
            <Chip
              label="Additional zone"
              size="small"
              color="secondary"
              variant="outlined"
              sx={{ height: 22, fontWeight: 700, fontSize: '0.7rem' }}
            />
            {hasTreatment ? (
              <Chip
                label={`${serviceCount} treatment${serviceCount === 1 ? '' : 's'}`}
                size="small"
                color="primary"
                sx={{ height: 22, fontSize: '0.7rem' }}
              />
            ) : (
              <Chip label="No treatment yet" size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
            )}
          </Stack>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.35 }}>
            {zone.label}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            {notOnMapCaption}
          </Typography>
        </Box>

        <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0 }}>
          <Tooltip title="Edit label">
            <span>
              <IconButton size="small" disabled={disabled} onClick={() => onEditLabel?.(zone)} aria-label="Edit zone label">
                <EditOutlined fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={hasTreatment ? 'Remove zone and all treatments' : 'Remove zone'}>
            <span>
              <IconButton
                size="small"
                disabled={disabled}
                color="error"
                onClick={() => onRemove?.(zone)}
                aria-label="Remove custom zone"
              >
                <DeleteOutlineRounded fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Add or edit treatment">
            <span>
              <IconButton
                size="small"
                color="primary"
                disabled={disabled}
                onClick={() => onAddTreatment?.(zone)}
                aria-label={`Add treatment to ${zone.label}`}
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.18) },
                }}
              >
                <AddRounded />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>
    </Paper>
  );
}

export default function CustomFaceZonesSection({
  customZones = [],
  zoneServiceCounts = {},
  highlightedZoneIds = new Set(),
  disabled = false,
  notOnMapCaption = 'Not on the face diagram',
  sectionSubtitle = 'Areas outside the face map',
  onAddZone,
  onUpdateZoneLabel,
  onRemoveZone,
  onOpenZone,
}) {
  const theme = useTheme();
  const [labelDialogOpen, setLabelDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);

  const canAddAnotherZone = useMemo(() => {
    if (customZones.length === 0) return true;
    const last = customZones[customZones.length - 1];
    return highlightedZoneIds.has(last.id);
  }, [customZones, highlightedZoneIds]);

  const openCreateDialog = () => {
    setEditingZone(null);
    setLabelDialogOpen(true);
  };

  const openEditDialog = zone => {
    setEditingZone(zone);
    setLabelDialogOpen(true);
  };

  const handleLabelConfirm = label => {
    if (editingZone) {
      onUpdateZoneLabel?.(editingZone, label);
    } else {
      onAddZone?.(label);
    }
    setLabelDialogOpen(false);
    setEditingZone(null);
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          mt: 3,
          maxWidth: 580,
          mx: 'auto',
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.05)}`,
        }}
      >
        <Box
          sx={{
            px: 2.5,
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: alpha(theme.palette.secondary.main, 0.06),
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Additional zones
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {sectionSubtitle}
              </Typography>
            </Box>
            {customZones.length > 0 ? (
              <Chip
                label={`${customZones.length} added`}
                size="small"
                color="secondary"
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
            ) : null}
          </Stack>
        </Box>

        <Stack spacing={1.5} sx={{ p: 2 }}>
          {customZones.map(zone => (
            <CustomZoneCard
              key={zone.id}
              zone={zone}
              hasTreatment={highlightedZoneIds.has(zone.id)}
              serviceCount={zoneServiceCounts[zone.id] ?? 0}
              disabled={disabled}
              notOnMapCaption={notOnMapCaption}
              onAddTreatment={onOpenZone}
              onEditLabel={openEditDialog}
              onRemove={onRemoveZone}
            />
          ))}

          {canAddAnotherZone ? (
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              disabled={disabled}
              startIcon={<AddRounded />}
              onClick={openCreateDialog}
              sx={{
                py: 1.75,
                borderRadius: 2.5,
                borderStyle: 'dashed',
                fontWeight: 700,
                '&:hover': { borderStyle: 'dashed' },
              }}
            >
              {customZones.length === 0 ? 'Add additional zone' : 'Add another additional zone'}
            </Button>
          ) : customZones.length > 0 ? (
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', px: 1 }}>
              Save treatment on &ldquo;{customZones[customZones.length - 1]?.label}&rdquo; before adding another.
            </Typography>
          ) : null}
        </Stack>
      </Paper>

      <CustomZoneLabelDialog
        open={labelDialogOpen}
        initialLabel={editingZone?.label ?? ''}
        onClose={() => {
          setLabelDialogOpen(false);
          setEditingZone(null);
        }}
        onConfirm={handleLabelConfirm}
      />
    </>
  );
}
