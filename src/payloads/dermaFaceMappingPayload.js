/**
 * Derma face zone mapping — API contract for the backend.
 *
 * GET    /derma-face-mappings?reservation_id=:id
 * POST   /derma-face-mappings          (one zone; `services[]` with lines per service)
 * DELETE /derma-face-mapping-lines/:id
 */

export const DERMA_MAPPING_TYPE = {
  FACE: 'face',
  BODY: 'body',
};

export const DERMA_SERVICE_CATEGORY = {
  INJECTABLE: 'injectable',
  MACHINE: 'machine',
};

export const DERMA_LINE_TYPE = {
  PRODUCT: 'product',
  MACHINE: 'machine',
};

export const DERMA_PRODUCT_TYPE = {
  SYRINGE: 'syringe',
  VIAL: 'veil',
};

export const DERMA_MACHINE_TYPE = {
  DURATION: 'duration',
  PULSES: 'pulses',
  SESSIONS: 'sessions',
  INJECTABLES: 'injectables',
};

function toInt(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toPositiveNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function trimName(value, fallback) {
  const s = typeof value === 'string' ? value.trim() : '';
  return s || fallback;
}

/**
 * @param {object} service
 * @returns {{ id: number, name: string, category: string, category_display: string | null }}
 */
export function buildServiceRef(service) {
  const id = toInt(service?.id ?? service?.uuid);
  return {
    id,
    name: trimName(service?.name, id != null ? `Service #${id}` : 'Service'),
    category: String(service?.category ?? DERMA_SERVICE_CATEGORY.INJECTABLE).toLowerCase(),
    category_display:
      typeof service?.category_display === 'string' && service.category_display.trim()
        ? service.category_display.trim()
        : null,
  };
}

/**
 * UI catalog row → API treatment line (discriminated by line_type + machine_type / product_type).
 *
 * @param {object} item — saved row from FaceZoneServiceDialog
 * @returns {object | null}
 */
export function buildTreatmentLineFromUiItem(item) {
  if (!item || item.id == null) return null;

  if (item.catalogKind === 'machine') {
    const machineId = toInt(item.id);
    const machineType = String(item.type ?? '').toLowerCase();
    const base = {
      line_type: DERMA_LINE_TYPE.MACHINE,
      machine_id: machineId,
      machine_name: trimName(item.name, `Machine #${machineId}`),
      machine_type: machineType,
    };

    if (machineType === DERMA_MACHINE_TYPE.DURATION) {
      const minutes = toPositiveNumber(item.minutes);
      if (minutes == null) return null;
      return { ...base, minutes };
    }
    if (machineType === DERMA_MACHINE_TYPE.PULSES) {
      const pulses = toPositiveNumber(item.pulses);
      if (pulses == null || !Number.isInteger(pulses)) return null;
      return { ...base, pulses };
    }
    if (machineType === DERMA_MACHINE_TYPE.SESSIONS) {
      return base;
    }
    return null;
  }

  const productId = toInt(item.id);
  const productType =
    item.type === DERMA_PRODUCT_TYPE.SYRINGE ? DERMA_PRODUCT_TYPE.SYRINGE : DERMA_PRODUCT_TYPE.VIAL;

  const line = {
    line_type: DERMA_LINE_TYPE.PRODUCT,
    product_id: productId,
    product_name: trimName(item.name, `Product #${productId}`),
    product_type: productType,
  };

  if (item.machineId != null) {
    line.machine_id = toInt(item.machineId);
    line.machine_name =
      typeof item.machineName === 'string' && item.machineName.trim()
        ? item.machineName.trim()
        : null;
    line.machine_type = DERMA_MACHINE_TYPE.INJECTABLES;
  }

  if (productType === DERMA_PRODUCT_TYPE.SYRINGE) {
    const quantity = toPositiveNumber(item.quantity);
    if (quantity == null || !Number.isInteger(quantity)) return null;
    line.quantity = quantity;
  } else {
    const volumeMl = toPositiveNumber(item.volume_ml);
    if (volumeMl == null) return null;
    line.volume_ml = volumeMl;
  }

  return line;
}

/** UI item → POST line body (ids and amounts only). */
export function buildTreatmentLinePostBody(item) {
  const line = buildTreatmentLineFromUiItem(item);
  if (!line) return null;

  if (line.line_type === DERMA_LINE_TYPE.MACHINE) {
    const body = {
      line_type: line.line_type,
      machine_id: line.machine_id,
      machine_type: line.machine_type,
    };
    if (line.minutes != null) body.minutes = line.minutes;
    if (line.pulses != null) body.pulses = line.pulses;
    return body;
  }

  const body = {
    line_type: line.line_type,
    product_id: line.product_id,
    product_type: line.product_type,
  };
  if (line.quantity != null) body.quantity = line.quantity;
  if (line.volume_ml != null) body.volume_ml = line.volume_ml;
  if (line.machine_id != null) {
    body.machine_id = line.machine_id;
    body.machine_type = line.machine_type;
  }
  return body;
}

/**
 * One service block inside a zone POST body.
 *
 * @param {{ service: object, items: object[] }} input
 */
export function buildZoneServicePostBody({ service, items }) {
  const serviceId = toInt(service?.id ?? service?.uuid);
  if (serviceId == null) return null;

  const lines = (Array.isArray(items) ? items : [])
    .map(buildTreatmentLinePostBody)
    .filter(Boolean);

  if (!lines.length) return null;

  return { id: serviceId, lines };
}

/**
 * @deprecated Legacy single-service zone shape.
 */
export function buildZoneTreatmentPayload({ zone, service, items }) {
  const zoneId = toInt(zone?.id);
  if (zoneId == null) return null;

  const serviceBlock = buildZoneServicePostBody({ service, items });
  if (!serviceBlock) return null;

  return {
    zone_id: zoneId,
    zone_label:
      typeof zone?.label === 'string' && zone.label.trim() ? zone.label.trim() : `Zone ${zoneId}`,
    service: buildServiceRef(service),
    lines: serviceBlock.lines.map(line => buildTreatmentLineFromUiItem(line)).filter(Boolean),
  };
}

/**
 * Full document sent on every save (single zone edit replaces full zone list client-side, then sync).
 *
 * @param {{
 *   reservationId: number|string,
 *   patientId: number|string,
 *   zones: object[],
 *   mappingType?: string,
 * }} input
 */
export function buildDermaFaceMappingSavePayload({
  reservationId,
  patientId,
  zones,
  mappingType = DERMA_MAPPING_TYPE.FACE,
}) {
  const rid = toInt(reservationId);
  const pid = toInt(patientId);

  return {
    reservation_id: rid,
    patient_id: pid,
    mapping_type: mappingType,
    zones: (Array.isArray(zones) ? zones : []).filter(Boolean),
  };
}

function groupAssignmentsByZone(assignmentsRecord) {
  const byZone = new Map();

  Object.values(assignmentsRecord ?? {}).forEach(entry => {
    const zoneId = toInt(entry?.zoneId);
    if (zoneId == null) return;

    if (!byZone.has(zoneId)) {
      byZone.set(zoneId, {
        zone_id: zoneId,
        zone_label: entry.zoneLabel ?? `Zone ${zoneId}`,
        services: [],
      });
    }

    const service = entry.service ?? {
      id: entry.serviceId,
      name: entry.serviceName,
      category: entry.serviceCategory,
      category_display: entry.serviceCategoryDisplay,
    };
    const items = entry.lines ?? entry.products ?? entry.items ?? [];
    const block = buildZoneServicePostBody({ service, items: linesToUiItems(items) });
    if (block) byZone.get(zoneId).services.push(block);
  });

  return [...byZone.values()].filter(z => z.services.length > 0);
}

/**
 * @param {Record<string, { zoneId, zoneLabel, serviceId, serviceName, service?, products?, items?, lines? }>} assignmentsRecord
 */
export function buildDermaFaceMappingPayloadFromAssignments(
  assignmentsRecord,
  { reservationId, patientId, mappingType } = {}
) {
  const zones = groupAssignmentsByZone(assignmentsRecord);

  return buildDermaFaceMappingSavePayload({
    reservationId,
    patientId,
    zones,
    mappingType,
  });
}

function parseApiNumber(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** API line → UI chip / dialog row */
export function treatmentLineToUiItem(line) {
  if (!line || typeof line !== 'object') return null;

  if (line.line_type === DERMA_LINE_TYPE.MACHINE) {
    const machineId = toInt(line.machine_id);
    if (machineId == null) return null;
    return {
      lineId: toInt(line.id),
      id: machineId,
      name: line.machine_name,
      catalogKind: 'machine',
      type: line.machine_type,
      minutes: parseApiNumber(line.minutes),
      pulses: parseApiNumber(line.pulses),
    };
  }

  if (line.line_type === DERMA_LINE_TYPE.PRODUCT) {
    const productId = toInt(line.product_id);
    if (productId == null) return null;
    const productType =
      line.product_type === DERMA_PRODUCT_TYPE.SYRINGE
        ? DERMA_PRODUCT_TYPE.SYRINGE
        : DERMA_PRODUCT_TYPE.VIAL;
    return {
      lineId: toInt(line.id),
      id: productId,
      name: line.product_name,
      catalogKind: 'product',
      type: productType,
      quantity: parseApiNumber(line.quantity),
      volume_ml: parseApiNumber(line.volume_ml),
      machineId: line.machine_id != null ? toInt(line.machine_id) : null,
      machineName: line.machine_name,
    };
  }

  return null;
}

function linesToUiItems(linesOrLegacy) {
  if (!Array.isArray(linesOrLegacy)) return [];
  return linesOrLegacy
    .map(row => {
      if (row?.line_type) return treatmentLineToUiItem(row);
      return row;
    })
    .filter(Boolean);
}

export const DERMA_FACE_MAPPINGS_BASE = '/derma-face-mappings';
export const DERMA_FACE_MAPPING_LINES_BASE = '/derma-face-mapping-lines';

export function dermaFaceMappingsListUrl(reservationId) {
  const params = new URLSearchParams({
    reservation_id: String(reservationId),
  });
  return `${DERMA_FACE_MAPPINGS_BASE}?${params.toString()}`;
}

export function dermaFaceMappingsCreateUrl() {
  return DERMA_FACE_MAPPINGS_BASE;
}

export function dermaFaceMappingLineDeleteUrl(lineId) {
  return `${DERMA_FACE_MAPPING_LINES_BASE}/${encodeURIComponent(lineId)}`;
}

/** @deprecated Use dermaFaceMappingLineDeleteUrl */
export function dermaFaceMappingDeleteUrl(lineId) {
  return dermaFaceMappingLineDeleteUrl(lineId);
}

/** Line ids from a zone assignment (for DELETE /derma-face-mapping-lines/:id). */
export function collectDermaFaceMappingLineIds(assignment) {
  if (!assignment || typeof assignment !== 'object') return [];
  const fromRecord = Array.isArray(assignment.lineIds)
    ? assignment.lineIds.map(toInt).filter(id => id != null)
    : [];
  if (fromRecord.length) return [...new Set(fromRecord)];

  const items = assignment.lines ?? assignment.products ?? [];
  return [
    ...new Set(
      items.map(item => toInt(item?.lineId)).filter(id => id != null)
    ),
  ];
}

/** All line ids for every service on a face zone. */
export function collectDermaFaceMappingLineIdsForZone(assignmentsRecord, zoneId) {
  const zid = toInt(zoneId);
  if (zid == null) return [];
  return [
    ...new Set(
      Object.values(assignmentsRecord ?? {})
        .filter(a => a.zoneId === zid)
        .flatMap(collectDermaFaceMappingLineIds)
    ),
  ];
}

export function getZoneAssignmentsFromRecord(assignmentsRecord, zoneId) {
  const zid = toInt(zoneId);
  if (zid == null) return [];
  return Object.values(assignmentsRecord ?? {}).filter(a => a.zoneId === zid);
}

/**
 * Top-level mapping documents from GET (each may contain a `zones` array).
 */
export function extractDermaFaceMappingDocuments(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    if (Array.isArray(data.results)) return data.results;
    if (Array.isArray(data.mappings)) return data.mappings;
    if (Array.isArray(data.derma_face_mappings)) return data.derma_face_mappings;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.zones)) return [data];
    const root = data.mapping ?? data.derma_face_mapping;
    if (root && typeof root === 'object') {
      if (Array.isArray(root.zones)) return [root];
      return [root];
    }
  }
  return [];
}

/**
 * Flatten documents → zone rows (API nests zones inside each mapping record).
 *
 * @returns {object[]}
 */
export function extractDermaFaceMappingZoneRows(data) {
  const documents = extractDermaFaceMappingDocuments(data);
  const zoneRows = [];

  documents.forEach(doc => {
    if (!doc || typeof doc !== 'object') return;

    if (Array.isArray(doc.zones) && doc.zones.length > 0) {
      doc.zones.forEach(zone => {
        zoneRows.push({
          ...zone,
          documentId: doc.id,
          reservation_id: doc.reservation_id,
          patient_id: doc.patient_id,
          mapping_type: doc.mapping_type,
        });
      });
      return;
    }

    if (doc.zone_id != null) {
      zoneRows.push(doc);
    }
  });

  return zoneRows;
}

/** @deprecated Use extractDermaFaceMappingZoneRows */
export function extractDermaFaceMappingRows(data) {
  return extractDermaFaceMappingZoneRows(data);
}

/**
 * GET response → state for InteractiveFaceMap (keyed by zoneId-serviceId).
 *
 * @returns {Record<string, object>}
 */
function parseZoneServiceBlocks(row) {
  if (Array.isArray(row?.services) && row.services.length > 0) {
    return row.services;
  }
  if (row?.service?.id != null || row?.service_id != null) {
    return [
      {
        id: row.service_mapping_id,
        service: row.service,
        lines: row.lines ?? row.products ?? [],
      },
    ];
  }
  return [];
}

export function mergeDermaFaceMappingFromApi(data) {
  const rows = extractDermaFaceMappingZoneRows(data);
  const record = {};

  rows.forEach(row => {
    const zoneMappingId = toInt(row?.id);
    const zoneId = toInt(row?.zone_id);
    if (zoneId == null) return;

    const zoneLabel = row.zone_label ?? `Zone ${zoneId}`;
    const serviceBlocks = parseZoneServiceBlocks(row);

    serviceBlocks.forEach(block => {
      const service = block?.service ?? {};
      const serviceId = toInt(service?.id);
      if (serviceId == null) return;

      const rawLines = block?.lines ?? [];
      const items = linesToUiItems(rawLines);
      if (!items.length) return;

      const lineIds = rawLines.map(line => toInt(line?.id)).filter(id => id != null);
      const key = `${zoneId}-${serviceId}`;

      record[key] = {
        zoneMappingId,
        serviceMappingId: toInt(block?.id),
        lineIds,
        documentId: toInt(row?.documentId),
        zoneId,
        zoneLabel,
        serviceId,
        serviceName: service?.name ?? '',
        serviceCategory: service?.category ?? null,
        serviceCategoryDisplay: service?.category_display ?? null,
        service,
        lines: items,
        products: items,
      };
    });
  });

  return record;
}

/**
 * POST /derma-face-mappings — one zone with all its services.
 *
 * @param {{
 *   reservationId: number|string,
 *   patientId: number|string,
 *   zone: { id: number, label?: string },
 *   services: Array<{ service: object, items: object[] } | { id: number, lines: object[] }>,
 *   zoneMappingId?: number,
 * }} input
 */
export function buildDermaFaceMappingZonePostPayload({
  reservationId,
  patientId,
  zone,
  services,
  zoneMappingId,
}) {
  const zoneId = toInt(zone?.id);
  if (zoneId == null) return null;

  const serviceBlocks = (Array.isArray(services) ? services : [])
    .map(entry => {
      if (entry?.id != null && Array.isArray(entry?.lines)) return entry;
      return buildZoneServicePostBody(entry);
    })
    .filter(Boolean);

  if (!serviceBlocks.length) return null;

  const payload = {
    reservation_id: toInt(reservationId),
    patient_id: toInt(patientId),
    zone_id: zoneId,
    zone_label:
      typeof zone?.label === 'string' && zone.label.trim() ? zone.label.trim() : `Zone ${zoneId}`,
    services: serviceBlocks,
  };

  const zid = toInt(zoneMappingId);
  if (zid != null) payload.id = zid;

  return payload;
}

/** @deprecated Use buildDermaFaceMappingZonePostPayload */
export function buildDermaFaceMappingCreatePayload({
  reservationId,
  patientId,
  zone,
  service,
  items,
  mappingId,
}) {
  return buildDermaFaceMappingZonePostPayload({
    reservationId,
    patientId,
    zone,
    zoneMappingId: mappingId,
    services: [{ service, items }],
  });
}

export function dermaFaceMappingUpdateUrl(mappingId) {
  return `${DERMA_FACE_MAPPINGS_BASE}/${encodeURIComponent(mappingId)}`;
}

/** @deprecated Use dermaFaceMappingsListUrl */
export function dermaFaceMappingUrl(reservationId) {
  return dermaFaceMappingsListUrl(reservationId);
}

/** Example document for backend implementation (all supported line shapes). */
export const SAMPLE_DERMA_FACE_MAPPING_PAYLOAD = {
  reservation_id: 16,
  patient_id: 12,
  mapping_type: 'face',
  zones: [
    {
      zone_id: 8,
      zone_label: 'Forehead',
      service: {
        id: 2,
        name: 'Botox',
        category: 'injectable',
        category_display: 'Injectable',
      },
      lines: [
        {
          line_type: 'product',
          product_id: 10,
          product_name: 'Botox 100u',
          product_type: 'syringe',
          quantity: 2,
        },
        {
          line_type: 'product',
          product_id: 11,
          product_name: 'Botox Vial',
          product_type: 'veil',
          volume_ml: 1.5,
        },
      ],
    },
    {
      zone_id: 4,
      zone_label: 'Nose',
      service: {
        id: 1,
        name: 'Laser',
        category: 'machine',
        category_display: 'Machine',
      },
      lines: [
        {
          line_type: 'machine',
          machine_id: 3,
          machine_name: 'Fractional laser',
          machine_type: 'duration',
          minutes: 45,
        },
      ],
    },
    {
      zone_id: 2,
      zone_label: 'Right cheek',
      service: {
        id: 1,
        name: 'Laser',
        category: 'machine',
        category_display: 'Machine',
      },
      lines: [
        {
          line_type: 'machine',
          machine_id: 4,
          machine_name: 'IPL device',
          machine_type: 'pulses',
          pulses: 1200,
        },
      ],
    },
    {
      zone_id: 3,
      zone_label: 'Left cheek',
      service: {
        id: 1,
        name: 'Laser',
        category: 'machine',
        category_display: 'Machine',
      },
      lines: [
        {
          line_type: 'machine',
          machine_id: 5,
          machine_name: 'Session laser',
          machine_type: 'sessions',
        },
      ],
    },
    {
      zone_id: 1,
      zone_label: 'Upper face / temples',
      service: {
        id: 1,
        name: 'Laser',
        category: 'machine',
        category_display: 'Machine',
      },
      lines: [
        {
          line_type: 'product',
          product_id: 20,
          product_name: 'Filler Syringe',
          product_type: 'syringe',
          quantity: 1,
          machine_id: 6,
          machine_name: 'Injectable handpiece',
          machine_type: 'injectables',
        },
        {
          line_type: 'product',
          product_id: 21,
          product_name: 'Filler Vial',
          product_type: 'veil',
          volume_ml: 2,
          machine_id: 6,
          machine_name: 'Injectable handpiece',
          machine_type: 'injectables',
        },
      ],
    },
  ],
};
