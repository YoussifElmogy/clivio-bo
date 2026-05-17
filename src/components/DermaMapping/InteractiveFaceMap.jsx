import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import useApi from '../../configs/useApi';
import faceMapImage from '../../assets/face-map.jpeg';
import { FACE_MAP_VIEWBOX, FACE_MAP_ZONES } from '../../constants/faceMapZones';
import { useToast } from '../../context/ToastContext';
import {
  buildDermaFaceMappingZonePostPayload,
  buildZoneServicePostBody,
  collectDermaFaceMappingLineIds,
  collectDermaFaceMappingLineIdsForZone,
  dermaFaceMappingLineDeleteUrl,
  dermaFaceMappingsCreateUrl,
  dermaFaceMappingsListUrl,
  getZoneAssignmentsFromRecord,
  mergeDermaFaceMappingFromApi,
} from '../../payloads/dermaFaceMappingPayload';
import FaceMappingAssignmentsPanel from './FaceMappingAssignmentsPanel';
import FaceZoneServiceDialog from './FaceZoneServiceDialog';

function apiErrorMessage(err, fallback) {
  const msg =
    err?.detail ||
    err?.response?.data?.detail ||
    err?.response?.data?.message ||
    err?.message;
  return typeof msg === 'string' ? msg : fallback;
}

export default function InteractiveFaceMap({ reservationId, patientId, onAssignmentsChange }) {
  const theme = useTheme();
  const { get, post, del } = useApi();
  const { showError, showSuccess } = useToast();

  const [activeZone, setActiveZone] = useState(null);
  const [activeServiceId, setActiveServiceId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [zoneAssignments, setZoneAssignments] = useState({});
  const zoneAssignmentsRef = useRef(zoneAssignments);
  const [mappingReady, setMappingReady] = useState(false);
  const [saving, setSaving] = useState(false);

  zoneAssignmentsRef.current = zoneAssignments;

  const refreshMappings = useCallback(async () => {
    const data = await get(dermaFaceMappingsListUrl(reservationId));
    const record = mergeDermaFaceMappingFromApi(data);
    setZoneAssignments(record);
    onAssignmentsChange?.(record);
    return record;
  }, [reservationId, get, onAssignmentsChange]);

  useEffect(() => {
    if (!reservationId) {
      setMappingReady(true);
      return;
    }
    let cancelled = false;
    (async () => {
      setMappingReady(false);
      try {
        await refreshMappings();
      } catch (err) {
        if (!cancelled) {
          const status = err?.status ?? err?.response?.status;
          if (status !== 404) {
            showError(apiErrorMessage(err, 'Could not load face mapping.'));
          }
          setZoneAssignments({});
          onAssignmentsChange?.({});
        }
      } finally {
        if (!cancelled) setMappingReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationId]);

  const persistZoneChange = useCallback(
    async ({ zone, service, products, clearEntireZone = false }) => {
      if (!reservationId || !patientId) return;
      setSaving(true);
      try {
        const record = zoneAssignmentsRef.current;
        const zoneEntries = getZoneAssignmentsFromRecord(record, zone.id);
        const zoneMappingId = zoneEntries[0]?.zoneMappingId ?? null;
        const serviceId = service?.id != null ? Number(service.id) : null;
        const hasProducts =
          !clearEntireZone &&
          products?.length > 0 &&
          serviceId != null &&
          buildZoneServicePostBody({ service, items: products });

        if (!hasProducts) {
          const lineIds = clearEntireZone
            ? collectDermaFaceMappingLineIdsForZone(record, zone.id)
            : collectDermaFaceMappingLineIds(
                record[`${zone.id}-${serviceId}`] ??
                  zoneEntries.find(a => a.serviceId === serviceId)
              );
          if (lineIds.length) {
            await Promise.all(lineIds.map(lineId => del(dermaFaceMappingLineDeleteUrl(lineId))));
          }

          const remaining = clearEntireZone
            ? []
            : zoneEntries.filter(a => a.serviceId !== serviceId);

          if (remaining.length) {
            const payload = buildDermaFaceMappingZonePostPayload({
              reservationId,
              patientId,
              zone,
              zoneMappingId,
              services: remaining.map(entry => ({
                service: entry.service ?? {
                  id: entry.serviceId,
                  name: entry.serviceName,
                  category: entry.serviceCategory,
                  category_display: entry.serviceCategoryDisplay,
                },
                items: entry.lines ?? entry.products ?? [],
              })),
            });
            if (payload) await post(dermaFaceMappingsCreateUrl(), payload);
          }
        } else {
          const mergedByServiceId = new Map();
          zoneEntries.forEach(entry => {
            mergedByServiceId.set(entry.serviceId, entry);
          });
          mergedByServiceId.set(serviceId, {
            zoneId: zone.id,
            zoneLabel: zone.label,
            serviceId,
            service,
            lines: products,
            products,
            zoneMappingId,
          });

          const payload = buildDermaFaceMappingZonePostPayload({
            reservationId,
            patientId,
            zone,
            zoneMappingId,
            services: [...mergedByServiceId.values()].map(entry => ({
              service: entry.service ?? {
                id: entry.serviceId,
                name: entry.serviceName,
                category: entry.serviceCategory,
                category_display: entry.serviceCategoryDisplay,
              },
              items: entry.lines ?? entry.products ?? [],
            })),
          });
          if (payload) await post(dermaFaceMappingsCreateUrl(), payload);
        }

        await refreshMappings();
        showSuccess(hasProducts ? 'Zone saved.' : 'Treatment removed.');
        setDialogOpen(false);
        setActiveServiceId(null);
      } catch (err) {
        showError(apiErrorMessage(err, 'Could not update face mapping.'));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [reservationId, patientId, post, del, refreshMappings, showError, showSuccess]
  );

  const highlightedZoneIds = useMemo(() => {
    const ids = new Set();
    Object.values(zoneAssignments).forEach(a => {
      const items = a.lines ?? a.products ?? [];
      if (items.length > 0) ids.add(a.zoneId);
    });
    return ids;
  }, [zoneAssignments]);

  const assignmentList = useMemo(
    () =>
      Object.values(zoneAssignments).sort((a, b) => {
        if (a.zoneId !== b.zoneId) return a.zoneId - b.zoneId;
        return (a.serviceName ?? '').localeCompare(b.serviceName ?? '');
      }),
    [zoneAssignments]
  );

  const activeZoneAssignment = useMemo(() => {
    if (!activeZone) return null;
    if (activeServiceId == null) return null;
    return zoneAssignments[`${activeZone.id}-${activeServiceId}`] ?? null;
  }, [activeZone, activeServiceId, zoneAssignments]);

  const assignedServiceIdsForActiveZone = useMemo(() => {
    if (!activeZone) return [];
    return Object.values(zoneAssignments)
      .filter(a => a.zoneId === activeZone.id)
      .map(a => a.serviceId)
      .filter(id => id != null);
  }, [activeZone, zoneAssignments]);

  const handleZoneClick = zone => {
    setActiveZone(zone);
    setActiveServiceId(null);
    setDialogOpen(true);
  };

  const handleConfirm = ({ zone, service, products }) => {
    persistZoneChange({ zone, service, products: products ?? [] });
  };

  const handleRemoveZone = zone => {
    persistZoneChange({ zone, service: {}, products: [], clearEntireZone: true });
  };

  const handleUndoService = (zoneId, serviceId) => {
    const zone = FACE_MAP_ZONES.find(z => z.id === zoneId);
    if (!zone || serviceId == null) return;
    persistZoneChange({ zone, service: { id: serviceId }, products: [] });
  };

  const handleUndoZone = zoneId => {
    const zone = FACE_MAP_ZONES.find(z => z.id === zoneId);
    if (!zone) return;
    persistZoneChange({ zone, service: {}, products: [], clearEntireZone: true });
  };

  const handleEditZone = (zoneId, serviceId) => {
    const zone = FACE_MAP_ZONES.find(z => z.id === zoneId);
    if (!zone || saving) return;
    setActiveZone(zone);
    setActiveServiceId(serviceId ?? null);
    setDialogOpen(true);
  };

  const primary = theme.palette.primary.main;

  if (!mappingReady) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 560 }}>
          Tap a zone to add a service. You can assign multiple services per zone; saving sends all
          services for that zone.
        </Typography>
        {saving ? (
          <Chip label="Saving…" size="small" color="primary" variant="outlined" />
        ) : null}
      </Stack>

      <Box
        sx={{
          position: 'relative',
          display: 'block',
          width: '100%',
          maxWidth: 580,
          mx: 'auto',
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.08)}`,
          lineHeight: 0,
          opacity: saving ? 0.85 : 1,
          transition: 'opacity 0.2s',
        }}
      >
        <Box
          component="img"
          src={faceMapImage}
          alt="Face treatment zones"
          sx={{
            display: 'block',
            width: '100%',
            height: 'auto',
          }}
        />
        <Box
          component="svg"
          viewBox={`0 0 ${FACE_MAP_VIEWBOX.width} ${FACE_MAP_VIEWBOX.height}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden={false}
          role="img"
          aria-label="Interactive face zones"
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            display: 'block',
            pointerEvents: 'none',
            '& polygon': {
              pointerEvents: saving ? 'none' : 'auto',
              fill: 'rgba(255, 0, 0, 0)',
              stroke: 'transparent',
              strokeWidth: 2,
              transition: 'fill 0.2s ease, stroke 0.2s ease',
              cursor: saving ? 'default' : 'pointer',
              outline: 'none',
            },
            '& polygon:hover': {
              fill: alpha(theme.palette.warning.main, 0.22),
            },
            '& polygon[data-assigned="true"]': {
              fill: alpha(primary, 0.38),
              stroke: primary,
            },
            '& polygon[data-assigned="true"]:hover': {
              fill: alpha(primary, 0.48),
            },
          }}
        >
          {FACE_MAP_ZONES.map(zone => {
            const assigned = highlightedZoneIds.has(zone.id);
            return (
              <polygon
                key={zone.id}
                id={`zone-${zone.id}`}
                data-assigned={assigned ? 'true' : 'false'}
                points={zone.points}
                onClick={() => !saving && handleZoneClick(zone)}
                role="button"
                aria-label={`Zone ${zone.id}: ${zone.label}${assigned ? ', has treatment' : ''}`}
                tabIndex={-1}
              />
            );
          })}
        </Box>
      </Box>

      <FaceMappingAssignmentsPanel
        assignments={assignmentList}
        disabled={saving}
        onEditZone={handleEditZone}
        onRemoveService={handleUndoService}
      />

      <FaceZoneServiceDialog
        open={dialogOpen}
        zone={activeZone}
        initialAssignment={activeZoneAssignment}
        assignedServiceIds={assignedServiceIdsForActiveZone}
        onClose={() => {
          if (!saving) {
            setDialogOpen(false);
            setActiveServiceId(null);
          }
        }}
        onConfirm={handleConfirm}
        onRemoveZone={handleRemoveZone}
      />
    </Box>
  );
}
