/**
 * Derma body zone mapping — API contract (base URL already includes `/api`).
 *
 * GET    /derma-body-mappings?reservation_id=:id
 * POST   /derma-body-mappings
 * GET    /derma-body-mappings/:pk
 * DELETE /derma-body-mappings/:pk
 * DELETE /derma-body-mapping-lines/:pk
 *
 * POST body: reservation_id, patient_id, mapping_type: "body", zone_label, services[],
 * optional zone_id (map zones 1–5; additional zones: create without zone_id, edit when returned).
 */

import {
  CUSTOM_BODY_ZONE_ID_START,
  additionalBodyZoneInternalId,
  isCustomBodyZone,
  isMapBodyZoneId,
} from '../constants/customBodyZones';
import {
  DERMA_MAPPING_TYPE,
  buildDermaMappingZonePostPayload,
  collectDermaFaceMappingLineIds,
  collectDermaFaceMappingLineIdsForZone,
  createMergeDermaMappingStateFromApi,
  getZoneAssignmentsFromRecord,
  prepareAdditionalZoneForPost,
} from './dermaFaceMappingPayload';

export {
  DERMA_MAPPING_TYPE,
  DERMA_SERVICE_CATEGORY,
  buildZoneServicePostBody,
  buildDermaFaceMappingPayloadFromAssignments,
  collectDermaFaceMappingLineIds,
  collectDermaFaceMappingLineIdsForZone,
  getZoneAssignmentsFromRecord,
  prepareAdditionalZoneForPost,
  treatmentLineToUiItem,
} from './dermaFaceMappingPayload';

export const DERMA_BODY_MAPPINGS_BASE = '/derma-body-mappings';
export const DERMA_BODY_MAPPING_LINES_BASE = '/derma-body-mapping-lines';

export function dermaBodyMappingsListUrl(reservationId) {
  const params = new URLSearchParams({
    reservation_id: String(reservationId),
  });
  return `${DERMA_BODY_MAPPINGS_BASE}?${params.toString()}`;
}

export function dermaBodyMappingsCreateUrl() {
  return DERMA_BODY_MAPPINGS_BASE;
}

export function dermaBodyMappingLineDeleteUrl(lineId) {
  return `${DERMA_BODY_MAPPING_LINES_BASE}/${encodeURIComponent(lineId)}`;
}

export function dermaBodyMappingDetailUrl(mappingId) {
  return `${DERMA_BODY_MAPPINGS_BASE}/${encodeURIComponent(mappingId)}`;
}

export function extractDermaBodyMappingDocuments(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    if (Array.isArray(data.derma_body_mappings)) return data.derma_body_mappings;
    if (Array.isArray(data.results)) return data.results;
    if (Array.isArray(data.mappings)) return data.mappings;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.zones)) return [data];
    const root = data.mapping ?? data.derma_body_mapping;
    if (root && typeof root === 'object') {
      if (Array.isArray(root.zones)) return [root];
      return [root];
    }
  }
  return [];
}

export function extractDermaBodyMappingZoneRows(data) {
  const documents = extractDermaBodyMappingDocuments(data);
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

export const mergeDermaBodyMappingStateFromApi = createMergeDermaMappingStateFromApi({
  extractZoneRows: extractDermaBodyMappingZoneRows,
  isMapZoneId: isMapBodyZoneId,
  customZoneIdStart: CUSTOM_BODY_ZONE_ID_START,
  additionalZoneInternalIdFn: additionalBodyZoneInternalId,
});

export function mergeDermaBodyMappingFromApi(data) {
  return mergeDermaBodyMappingStateFromApi(data).assignments;
}

export function buildDermaBodyMappingZonePostPayload(input) {
  const payload = buildDermaMappingZonePostPayload({
    ...input,
    isCustomZone: isCustomBodyZone,
  });
  if (!payload) return null;
  payload.mapping_type = DERMA_MAPPING_TYPE.BODY;
  return payload;
}

/** Example POST body for one body zone (matches backend contract). */
export const SAMPLE_DERMA_BODY_MAPPING_ZONE_PAYLOAD = {
  reservation_id: 16,
  patient_id: 12,
  mapping_type: 'body',
  zone_id: 1,
  zone_label: 'Abdomen',
  services: [
    {
      id: 2,
      lines: [
        {
          line_type: 'product',
          product_id: 1,
          product_type: 'syringe',
          quantity: 2,
        },
        {
          line_type: 'product',
          product_id: 2,
          product_type: 'veil',
          volume_ml: 1.5,
        },
      ],
    },
    {
      id: 3,
      lines: [
        {
          line_type: 'machine',
          machine_id: 1,
          machine_type: 'duration',
          minutes: 45,
        },
        {
          line_type: 'machine',
          machine_id: 2,
          machine_type: 'pulses',
          pulses: 1200,
        },
        {
          line_type: 'machine',
          machine_id: 3,
          machine_type: 'sessions',
        },
      ],
    },
  ],
};
