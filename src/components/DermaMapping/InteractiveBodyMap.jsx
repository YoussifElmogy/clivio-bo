import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import useApi from '../../configs/useApi';
import bodyMapImage from '../../assets/body-map.jpeg';
import { BODY_MAP_VIEWBOX, BODY_MAP_ZONES } from '../../constants/bodyMapZones';
import {
  createCustomBodyZone,
  isMapBodyZoneId,
  nextCustomBodyZoneId,
} from '../../constants/customBodyZones';
import { useToast } from '../../context/ToastContext';
import {
  buildDermaBodyMappingZonePostPayload,
  buildZoneServicePostBody,
  collectDermaFaceMappingLineIds,
  collectDermaFaceMappingLineIdsForZone,
  dermaBodyMappingLineDeleteUrl,
  dermaBodyMappingsCreateUrl,
  dermaBodyMappingsListUrl,
  getZoneAssignmentsFromRecord,
  mergeDermaBodyMappingStateFromApi,
  prepareAdditionalZoneForPost,
} from '../../payloads/dermaBodyMappingPayload';
import CustomFaceZonesSection from './CustomFaceZonesSection';
import FaceMappingAssignmentsPanel from './FaceMappingAssignmentsPanel';
import FaceZoneServiceDialog from './FaceZoneServiceDialog';
import ViewOnlyBanner from './ViewOnlyBanner';

function apiErrorMessage(err, fallback) {
  const msg =
    err?.detail ||
    err?.response?.data?.detail ||
    err?.response?.data?.message ||
    err?.message;
  return typeof msg === 'string' ? msg : fallback;
}

function findZoneById(zoneId, customZones) {
  const mapZone = BODY_MAP_ZONES.find(z => z.id === zoneId);
  if (mapZone) return mapZone;
  return customZones.find(z => z.id === zoneId) ?? null;
}

export default function InteractiveBodyMap({
  reservationId,
  patientId,
  onAssignmentsChange,
  readOnly = false,
}) {
  const theme = useTheme();
  const { get, post, del } = useApi();
  const { showError, showSuccess } = useToast();

  const [activeZone, setActiveZone] = useState(null);
  const [activeServiceId, setActiveServiceId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [customZones, setCustomZones] = useState([]);
  const [zoneAssignments, setZoneAssignments] = useState({});
  const zoneAssignmentsRef = useRef(zoneAssignments);
  const customZonesRef = useRef(customZones);
  const [mappingReady, setMappingReady] = useState(false);
  const [saving, setSaving] = useState(false);

  zoneAssignmentsRef.current = zoneAssignments;
  customZonesRef.current = customZones;

  const notifyParent = useCallback(
    record => {
      onAssignmentsChange?.(record);
    },
    [onAssignmentsChange]
  );

  const refreshMappings = useCallback(async () => {
    const data = await get(dermaBodyMappingsListUrl(reservationId));
    const { assignments, customZones: loadedCustom } = mergeDermaBodyMappingStateFromApi(data);
    setZoneAssignments(assignments);
    setCustomZones(loadedCustom);
    notifyParent(assignments);
    return { assignments, customZones: loadedCustom };
  }, [reservationId, get, notifyParent]);

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
            showError(apiErrorMessage(err, 'Could not load body mapping.'));
          }
          setZoneAssignments({});
          setCustomZones([]);
          notifyParent({});
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
      if (readOnly || !reservationId || !patientId) return;
      setSaving(true);
      try {
        const record = zoneAssignmentsRef.current;
        const zoneEntries = getZoneAssignmentsFromRecord(record, zone.id);
        const zoneMappingId = zone.zoneMappingId ?? zoneEntries[0]?.zoneMappingId ?? null;
        const zoneForPayload =
          zone.isCustom === true ? prepareAdditionalZoneForPost(zone, zoneEntries) : zone;
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
            await Promise.all(lineIds.map(lineId => del(dermaBodyMappingLineDeleteUrl(lineId))));
          }

          const remaining = clearEntireZone
            ? []
            : zoneEntries.filter(a => a.serviceId !== serviceId);

          if (remaining.length) {
            const payload = buildDermaBodyMappingZonePostPayload({
              reservationId,
              patientId,
              zone: zoneForPayload,
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
            if (payload) await post(dermaBodyMappingsCreateUrl(), payload);
          }
        } else {
          const mergedByServiceId = new Map();
          zoneEntries.forEach(entry => {
            mergedByServiceId.set(entry.serviceId, entry);
          });
          mergedByServiceId.set(serviceId, {
            zoneId: zone.id,
            zoneLabel: zone.label,
            isCustomZone: zone.isCustom === true,
            serviceId,
            service,
            lines: products,
            products,
            zoneMappingId,
          });

          const payload = buildDermaBodyMappingZonePostPayload({
            reservationId,
            patientId,
            zone: zoneForPayload,
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
          if (payload) await post(dermaBodyMappingsCreateUrl(), payload);
        }

        await refreshMappings();
        showSuccess(hasProducts ? 'Zone saved.' : 'Treatment removed.');
        setDialogOpen(false);
        setActiveServiceId(null);
      } catch (err) {
        showError(apiErrorMessage(err, 'Could not update body mapping.'));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [readOnly, reservationId, patientId, post, del, refreshMappings, showError, showSuccess]
  );

  const highlightedMapZoneIds = useMemo(() => {
    const ids = new Set();
    Object.values(zoneAssignments).forEach(a => {
      if (a.isCustomZone) return;
      const items = a.lines ?? a.products ?? [];
      if (items.length > 0 && isMapBodyZoneId(a.zoneId)) ids.add(a.zoneId);
    });
    return ids;
  }, [zoneAssignments]);

  const highlightedAdditionalZoneIds = useMemo(() => {
    const ids = new Set();
    Object.values(zoneAssignments).forEach(a => {
      if (!a.isCustomZone) return;
      const items = a.lines ?? a.products ?? [];
      if (items.length > 0) ids.add(a.zoneId);
    });
    return ids;
  }, [zoneAssignments]);

  const zoneServiceCounts = useMemo(() => {
    const counts = {};
    Object.values(zoneAssignments).forEach(a => {
      if (!a.isCustomZone) return;
      const items = a.lines ?? a.products ?? [];
      if (items.length > 0) {
        counts[a.zoneId] = (counts[a.zoneId] ?? 0) + 1;
      }
    });
    return counts;
  }, [zoneAssignments]);

  const assignmentList = useMemo(
    () =>
      Object.values(zoneAssignments).sort((a, b) => {
        if (a.isCustomZone !== b.isCustomZone) return a.isCustomZone ? 1 : -1;
        if (a.zoneId !== b.zoneId) {
          if (typeof a.zoneId === 'number' && typeof b.zoneId === 'number') {
            return a.zoneId - b.zoneId;
          }
          return String(a.zoneId).localeCompare(String(b.zoneId));
        }
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
    if (readOnly) return;
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
    const assignment = Object.values(zoneAssignments).find(
      a => a.zoneId === zoneId && a.serviceId === serviceId
    );
    const zone = assignment?.isCustomZone
      ? customZones.find(z => z.id === zoneId) ?? {
          id: zoneId,
          label: assignment?.zoneLabel ?? '',
          isCustom: true,
          zone_id: assignment?.apiZoneId ?? undefined,
          zoneMappingId: assignment?.zoneMappingId ?? undefined,
        }
      : findZoneById(zoneId, customZones);
    if (!zone || serviceId == null) return;
    persistZoneChange({ zone, service: { id: serviceId }, products: [] });
  };

  const handleEditAssignment = assignment => {
    if (readOnly || !assignment || saving) return;
    const zone = assignment.isCustomZone
      ? customZones.find(z => z.id === assignment.zoneId) ?? {
          id: assignment.zoneId,
          label: assignment.zoneLabel,
          isCustom: true,
          zone_id: assignment.apiZoneId ?? undefined,
          zoneMappingId: assignment.zoneMappingId ?? undefined,
        }
      : findZoneById(assignment.zoneId, customZones);
    if (!zone) return;
    setActiveZone(zone);
    setActiveServiceId(assignment.serviceId ?? null);
    setDialogOpen(true);
  };

  const handleAddCustomZone = label => {
    if (readOnly) return;
    const id = nextCustomBodyZoneId(customZonesRef.current);
    const zone = createCustomBodyZone({ id, label });
    if (!zone) return;
    setCustomZones(prev => [...prev, zone].sort((a, b) => a.id - b.id));
  };

  const handleUpdateCustomZoneLabel = (zone, label) => {
    if (readOnly) return;
    const trimmed = label.trim();
    if (!trimmed) return;
    setCustomZones(prev =>
      prev.map(z => (z.id === zone.id ? { ...z, label: trimmed } : z)).sort((a, b) => a.id - b.id)
    );
    setZoneAssignments(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => {
        if (next[key].zoneId === zone.id) {
          next[key] = { ...next[key], zoneLabel: trimmed };
        }
      });
      return next;
    });
    if (activeZone?.id === zone.id) {
      setActiveZone(prev => (prev ? { ...prev, label: trimmed } : prev));
    }
  };

  const deleteZoneLinesFromServer = useCallback(
    async zone => {
      const record = zoneAssignmentsRef.current;
      const lineIds = collectDermaFaceMappingLineIdsForZone(record, zone.id);
      if (lineIds.length) {
        await Promise.all(lineIds.map(lineId => del(dermaBodyMappingLineDeleteUrl(lineId))));
      }
    },
    [del]
  );

  const handleRemoveCustomZone = async zone => {
    if (readOnly || saving) return;
    setSaving(true);
    try {
      await deleteZoneLinesFromServer(zone);
      await refreshMappings();
      showSuccess('Zone removed.');
    } catch (err) {
      showError(apiErrorMessage(err, 'Could not remove zone.'));
    } finally {
      setSaving(false);
    }
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
      {readOnly ? <ViewOnlyBanner message="Body mapping is view only." /> : null}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 560 }}>
          Tap a zone on the body or add an additional zone below. Multiple services per body zone are supported.
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
          src={bodyMapImage}
          alt="Body treatment zones"
          sx={{
            display: 'block',
            width: '100%',
            height: 'auto',
          }}
        />
        <Box
          component="svg"
          viewBox={`0 0 ${BODY_MAP_VIEWBOX.width} ${BODY_MAP_VIEWBOX.height}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden={false}
          role="img"
          aria-label="Interactive body zones"
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            display: 'block',
            pointerEvents: 'none',
            '& polygon': {
              pointerEvents: readOnly || saving ? 'none' : 'auto',
              fill: 'rgba(255, 0, 0, 0)',
              stroke: 'transparent',
              strokeWidth: 2,
              transition: 'fill 0.2s ease, stroke 0.2s ease',
              cursor: readOnly || saving ? 'default' : 'pointer',
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
          {BODY_MAP_ZONES.map(zone => {
            const assigned = highlightedMapZoneIds.has(zone.id);
            return (
              <polygon
                key={zone.id}
                id={`body-zone-${zone.id}`}
                data-assigned={assigned ? 'true' : 'false'}
                points={zone.points}
                onClick={() => !readOnly && !saving && handleZoneClick(zone)}
                role="button"
                aria-label={`Zone ${zone.id}: ${zone.label}${assigned ? ', has treatment' : ''}`}
                tabIndex={-1}
              />
            );
          })}
        </Box>
      </Box>

      <CustomFaceZonesSection
        customZones={customZones}
        zoneServiceCounts={zoneServiceCounts}
        highlightedZoneIds={highlightedAdditionalZoneIds}
        disabled={saving}
        readOnly={readOnly}
        notOnMapCaption="Not on the body diagram"
        sectionSubtitle=""
        onAddZone={handleAddCustomZone}
        onUpdateZoneLabel={handleUpdateCustomZoneLabel}
        onRemoveZone={handleRemoveCustomZone}
        onOpenZone={handleZoneClick}
      />

      <FaceMappingAssignmentsPanel
        assignments={assignmentList}
        disabled={saving}
        readOnly={readOnly}
        onEditZone={handleEditAssignment}
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
