import React from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlined from '@mui/icons-material/EditOutlined';
import MedicationLiquidOutlined from '@mui/icons-material/MedicationLiquidOutlined';
import PrecisionManufacturingOutlined from '@mui/icons-material/PrecisionManufacturingOutlined';
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined';
import { alpha, useTheme } from '@mui/material/styles';
import { DERMA_SERVICE_CATEGORY } from '../../payloads/dermaFaceMappingPayload';
import { formatDermaZoneProductChipLabel } from '../../schemas/productSchema';

function serviceCategoryMeta(assignment) {
  const category =
    assignment?.serviceCategory ??
    assignment?.service?.category ??
    '';
  const display =
    assignment?.serviceCategoryDisplay ??
    assignment?.service?.category_display ??
    '';

  if (category === DERMA_SERVICE_CATEGORY.MACHINE) {
    return {
      label: display || 'Machine',
      color: 'info',
      Icon: PrecisionManufacturingOutlined,
    };
  }
  return {
    label: display || 'Injectable',
    color: 'primary',
    Icon: MedicationLiquidOutlined,
  };
}

function lineIcon(item) {
  if (item?.catalogKind === 'machine') {
    if (item.type === 'duration') return ScheduleOutlined;
    return PrecisionManufacturingOutlined;
  }
  return MedicationLiquidOutlined;
}

function FaceMappingAssignmentCard({ assignment, disabled, onEdit, onRemove }) {
  const theme = useTheme();
  const isAdditional = assignment.isCustomZone === true;
  const items = assignment.lines ?? assignment.products ?? [];
  const { label: categoryLabel, color: categoryColor, Icon: CategoryIcon } =
    serviceCategoryMeta(assignment);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 0,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        bgcolor: 'background.paper',
        transition: theme.transitions.create(['border-color', 'box-shadow'], {
          duration: theme.transitions.duration.shorter,
        }),
        '&:hover': {
          borderColor: alpha(theme.palette.primary.main, 0.35),
          boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.06)}`,
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'stretch',
          gap: 0,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            px: isAdditional ? 1.25 : 1.75,
            py: 2,
            minWidth: isAdditional ? 72 : 56,
            bgcolor: alpha(
              isAdditional ? theme.palette.secondary.main : theme.palette.primary.main,
              0.08
            ),
            borderRight: '1px solid',
            borderColor: 'divider',
          }}
        >
          {isAdditional ? (
            <Typography
              variant="caption"
              sx={{
                color: 'secondary.main',
                fontWeight: 700,
                letterSpacing: 0.3,
                textTransform: 'uppercase',
                fontSize: '0.6rem',
                lineHeight: 1.25,
                textAlign: 'center',
                maxWidth: 64,
              }}
            >
              Additional
            </Typography>
          ) : (
            <>
              <Typography
                variant="caption"
                sx={{
                  color: 'primary.main',
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  fontSize: '0.65rem',
                  lineHeight: 1,
                  mb: 0.25,
                }}
              >
                Zone
              </Typography>
              <Typography
                component="span"
                sx={{
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  lineHeight: 1,
                  color: 'primary.main',
                }}
              >
                {assignment.zoneId}
              </Typography>
            </>
          )}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0, py: 1.5, pr: 1, pl: 1.75 }}>
          <Stack
            direction="row"
            alignItems="flex-start"
            justifyContent="space-between"
            spacing={1}
            sx={{ mb: 1 }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, lineHeight: 1.35, mb: 0.5 }}
              >
                {assignment.zoneLabel}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap" useFlexGap>
                <CategoryIcon sx={{ fontSize: 16, color: `${categoryColor}.main`, opacity: 0.9 }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {assignment.serviceName}
                </Typography>
                <Chip
                  label={categoryLabel}
                  size="small"
                  color={categoryColor}
                  variant="outlined"
                  sx={{
                    height: 22,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    '& .MuiChip-label': { px: 1 },
                  }}
                />
              </Stack>
            </Box>

            <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0, mt: -0.25 }}>
              <Tooltip title="Edit zone">
                <span>
                  <IconButton
                    size="small"
                    disabled={disabled}
                    aria-label={
                      isAdditional
                        ? `Edit ${assignment.zoneLabel}`
                        : `Edit zone ${assignment.zoneId}`
                    }
                    onClick={() => onEdit?.(assignment)}
                    sx={{
                      color: 'text.secondary',
                      '&:hover': { color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.08) },
                    }}
                  >
                    <EditOutlined fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Remove treatment">
                <span>
                  <IconButton
                    size="small"
                    disabled={disabled}
                    aria-label={`Remove ${assignment.serviceName} from zone ${assignment.zoneId}`}
                    onClick={() => onRemove?.(assignment.zoneId, assignment.serviceId)}
                    sx={{
                      color: 'text.secondary',
                      '&:hover': { color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.08) },
                    }}
                  >
                    <DeleteOutlineRounded fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Stack>

          <Stack spacing={0.75}>
            {items.map(item => {
              const LineIcon = lineIcon(item);
              return (
                <Box
                  key={`${item.id}-${item.catalogKind ?? 'p'}`}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    py: 0.75,
                    px: 1.25,
                    borderRadius: 1.5,
                    bgcolor: alpha(theme.palette.grey[500], 0.06),
                    border: '1px solid',
                    borderColor: alpha(theme.palette.divider, 0.8),
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 28,
                      height: 28,
                      borderRadius: 1,
                      flexShrink: 0,
                      bgcolor: 'background.paper',
                      color: `${categoryColor}.main`,
                    }}
                  >
                    <LineIcon sx={{ fontSize: 16 }} />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.4 }}>
                    {formatDermaZoneProductChipLabel(item)}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        </Box>
      </Box>
    </Paper>
  );
}

export default function FaceMappingAssignmentsPanel({
  assignments = [],
  disabled = false,
  onEditZone,
  onRemoveService,
}) {
  const theme = useTheme();
  const count = assignments.length;

  if (count === 0) return null;

  return (
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
        boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.06)}`,
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.primary.main, 0.04),
        }}
      >
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.3 }}>
            Treatment plan
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Face map and additional areas for this appointment
          </Typography>
        </Box>
        <Chip
          label={`${count} treatment${count === 1 ? '' : 's'}`}
          size="small"
          color="primary"
          sx={{ fontWeight: 700 }}
        />
      </Box>

      <Stack spacing={1.5} sx={{ p: 2 }}>
        {assignments.map(assignment => (
          <FaceMappingAssignmentCard
            key={assignment.mappingId ?? `${assignment.zoneId}-${assignment.serviceId}`}
            assignment={assignment}
            disabled={disabled}
            onEdit={onEditZone}
            onRemove={onRemoveService}
          />
        ))}
      </Stack>
    </Paper>
  );
}
