import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRounded from '@mui/icons-material/RadioButtonUncheckedRounded';
import { alpha, useTheme } from '@mui/material/styles';
import useApi from '../../configs/useApi';
import { useToast } from '../../context/ToastContext';
import {
  machineTypeLabel,
  machineZoneNeedsUsageField,
  machineZoneUsageFieldLabel,
  normalizeMachineType,
  parseMachineZoneUsage,
} from '../../schemas/machineSchema';
import {
  dermaZoneUsageFieldLabel,
  isSyringeProduct,
  normalizeProductType,
  parseDermaZoneProductUsage,
} from '../../schemas/productSchema';
import {
  allProductsUrl,
  dermaCatalogItemsUrl,
  dermaCatalogListKeys,
  dermaServicesListUrl,
  isMachineServiceCategory,
} from '../../utils/dermaCatalogUrl';
import { parsePaginatedList } from '../../utils/parsePaginatedList';

function apiErrorMessage(err, fallback) {
  const msg =
    err?.detail ||
    err?.response?.data?.detail ||
    err?.response?.data?.message ||
    err?.message;
  return typeof msg === 'string' ? msg : fallback;
}

function normalizeServiceId(value) {
  if (value === '' || value == null) return '';
  const n = Number(value);
  return Number.isFinite(n) ? n : value;
}

function catalogIdKey(id) {
  if (id == null || id === '') return '';
  const n = Number(id);
  return Number.isFinite(n) ? String(n) : String(id);
}

function catalogIdsMatch(a, b) {
  return catalogIdKey(a) === catalogIdKey(b);
}

function findCatalogItem(items, id) {
  return items.find(item => catalogIdsMatch(item.id, id)) ?? null;
}

function pickMapValue(map, id) {
  if (!map || id == null) return '';
  if (map[id] != null && map[id] !== '') return map[id];
  const key = Object.keys(map).find(k => catalogIdsMatch(k, id));
  return key != null ? map[key] : '';
}

function pickMapEntry(map, id) {
  if (!map || id == null) return undefined;
  if (map[id] != null) return map[id];
  const key = Object.keys(map).find(k => catalogIdsMatch(k, id));
  return key != null ? map[key] : undefined;
}

function mapProductRow(row) {
  const type = normalizeProductType(row.type);
  return {
    id: row.id ?? row.uuid,
    name: row.name?.trim?.() || `Product #${row.id ?? row.uuid}`,
    type,
    catalogKind: 'product',
  };
}

function mapMachineRow(row) {
  return {
    id: row.id ?? row.uuid,
    name: row.name?.trim?.() || `Machine #${row.id ?? row.uuid}`,
    type: normalizeMachineType(row.type),
    catalogKind: 'machine',
  };
}

function usageValueFromSavedItem(item) {
  if (item?.catalogKind === 'machine') {
    if (item.minutes != null) return String(item.minutes);
    if (item.pulses != null) return String(item.pulses);
    return '';
  }
  if (isSyringeProduct(item?.type)) {
    return item.quantity != null ? String(item.quantity) : '';
  }
  return item?.volume_ml != null ? String(item.volume_ml) : '';
}

function findService(services, serviceId) {
  return services.find(s => catalogIdsMatch(s.id ?? s.uuid, serviceId)) ?? null;
}

function productTypeChip(item) {
  return isSyringeProduct(item.type)
    ? { label: 'Syringe', color: 'primary' }
    : { label: 'Vial', color: 'secondary' };
}

function stopCardClick(e) {
  e.stopPropagation();
}

function SelectableCard({ selected, onToggle, children, sx }) {
  const theme = useTheme();
  return (
    <Paper
      component="button"
      type="button"
      onClick={onToggle}
      variant="outlined"
      sx={{
        display: 'block',
        width: '100%',
        p: 0,
        textAlign: 'left',
        cursor: 'pointer',
        borderRadius: 2,
        border: '1px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        bgcolor: selected ? alpha(theme.palette.primary.main, 0.06) : 'background.paper',
        transition: 'border-color 0.2s, background-color 0.2s, box-shadow 0.2s',
        boxShadow: selected ? `0 0 0 1px ${alpha(theme.palette.primary.main, 0.2)}` : 'none',
        '&:hover': {
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

function CardCheckIcon({ selected }) {
  return (
    <Box sx={{ pt: 0.25, color: selected ? 'primary.main' : 'action.disabled', flexShrink: 0 }}>
      {selected ? (
        <CheckCircleRounded fontSize="small" />
      ) : (
        <RadioButtonUncheckedRounded fontSize="small" />
      )}
    </Box>
  );
}

function UsageAmountField({ label, value, onChange, showError, errorMessage, step = 1, placeholder }) {
  return (
    <Box onClick={stopCardClick} onKeyDown={stopCardClick}>
      <TextField
        size="small"
        fullWidth
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        type="number"
        error={showError}
        inputProps={{ min: 0, step }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 1.5,
            bgcolor: 'background.paper',
          },
        }}
      />
      {showError && errorMessage ? (
        <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
          {errorMessage}
        </Typography>
      ) : null}
    </Box>
  );
}

function ProductCatalogCard({
  item,
  selected,
  usageValue,
  showError,
  errorMessage,
  onToggle,
  onUsageChange,
  nested,
}) {
  const chip = productTypeChip(item);
  const usageLabel = dermaZoneUsageFieldLabel(item.type);

  return (
    <SelectableCard selected={selected} onToggle={() => onToggle(item)} sx={nested ? { ml: 0 } : undefined}>
      <Box sx={{ px: nested ? 1.5 : 2, py: 1.5 }}>
        <Stack direction="row" alignItems="flex-start" spacing={1.25}>
          <CardCheckIcon selected={selected} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.4, pr: 1 }}>
              {item.name}
            </Typography>
            <Chip
              label={chip.label}
              size="small"
              color={chip.color}
              variant="outlined"
              sx={{ mt: 0.75, height: 22, fontSize: '0.7rem' }}
            />
          </Box>
        </Stack>
        <Collapse in={selected} unmountOnExit>
          <Box sx={{ mt: 1.5, pl: nested ? 3.5 : 4.25 }}>
            <UsageAmountField
              label={usageLabel}
              value={usageValue}
              onChange={v => onUsageChange(item.id, v)}
              showError={showError}
              errorMessage={errorMessage}
              step={isSyringeProduct(item.type) ? 1 : 0.1}
              placeholder={isSyringeProduct(item.type) ? '1' : '2.5'}
            />
          </Box>
        </Collapse>
      </Box>
    </SelectableCard>
  );
}

function MachineCatalogCard({
  machine,
  selected,
  usageValue,
  showUsageError,
  usageErrorMessage,
  injectableProducts,
  injectableProductsLoading,
  injectableSelection,
  injectableErrors,
  submitAttempted,
  onToggleMachine,
  onMachineUsageChange,
  onToggleInjectableProduct,
  onInjectableUsageChange,
}) {
  const machineType = normalizeMachineType(machine.type);
  const isInjectables = machineType === 'injectables';
  const needsUsage = machineZoneNeedsUsageField(machineType);
  const usageLabel = machineZoneUsageFieldLabel(machineType);
  const selection = injectableSelection ?? { productIds: [], usage: {} };

  const injectableSelectedCount = selection.productIds.length;

  return (
    <SelectableCard selected={selected} onToggle={() => onToggleMachine(machine)}>
      <Box sx={{ px: 2, py: 1.5 }}>
        <Stack direction="row" alignItems="flex-start" spacing={1.25}>
          <CardCheckIcon selected={selected} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.4, pr: 1 }}>
              {machine.name}
            </Typography>
            <Chip
              label={machineTypeLabel(machineType)}
              size="small"
              color="info"
              variant="outlined"
              sx={{ mt: 0.75, height: 22, fontSize: '0.7rem' }}
            />
          </Box>
        </Stack>

        <Collapse in={selected && needsUsage} unmountOnExit>
          <Box sx={{ mt: 1.5, pl: 4.25 }}>
            <UsageAmountField
              label={usageLabel}
              value={usageValue}
              onChange={v => onMachineUsageChange(machine.id, v)}
              showError={showUsageError}
              errorMessage={usageErrorMessage}
              step={machineType === 'pulses' ? 1 : 0.1}
              placeholder={machineType === 'pulses' ? '100' : '30'}
            />
          </Box>
        </Collapse>

        <Collapse in={selected && isInjectables} unmountOnExit>
          <Box sx={{ mt: 1.5, pl: 2 }} onClick={stopCardClick} onKeyDown={stopCardClick}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, pl: 0.5 }}>
              Select injectable products
              {injectableSelectedCount > 0 ? ` · ${injectableSelectedCount} selected` : ''}
            </Typography>
            {injectableProductsLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1.5, pl: 0.5 }}>
                <CircularProgress size={18} />
                <Typography variant="body2" color="text.secondary">
                  Loading products…
                </Typography>
              </Box>
            ) : injectableProducts.length > 0 ? (
              <Stack spacing={1}>
                {injectableProducts.map(product => {
                  const productSelected = selection.productIds.some(id =>
                    catalogIdsMatch(id, product.id)
                  );
                  const fieldError =
                    injectableErrors?.[product.id] ??
                    Object.entries(injectableErrors ?? {}).find(([key]) =>
                      catalogIdsMatch(key, product.id)
                    )?.[1];
                  return (
                    <ProductCatalogCard
                      key={product.id}
                      item={product}
                      selected={productSelected}
                      usageValue={pickMapValue(selection.usage, product.id)}
                      showError={submitAttempted && productSelected && Boolean(fieldError)}
                      errorMessage={fieldError}
                      onToggle={() => onToggleInjectableProduct(machine.id, product)}
                      onUsageChange={(productId, value) =>
                        onInjectableUsageChange(machine.id, productId, value)
                      }
                      nested
                    />
                  );
                })}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ pl: 0.5 }}>
                No injectable products available.
              </Typography>
            )}
          </Box>
        </Collapse>
      </Box>
    </SelectableCard>
  );
}

function restoreFromAssignment(initialAssignment) {
  const savedItems = initialAssignment?.lines ?? initialAssignment?.products ?? [];

  const isMachineAssignment = savedItems.some(
    p => p.catalogKind === 'machine' || p.machineId != null
  );

  if (!initialAssignment) {
    return {
      serviceId: '',
      selectedProductIds: [],
      productUsageById: {},
      selectedMachineIds: [],
      machineUsageById: {},
      injectableByMachine: {},
    };
  }

  const selectedProductIds = [];
  const productUsageById = {};
  const selectedMachineIds = [];
  const machineUsageById = {};
  const injectableByMachine = {};

  savedItems.forEach(p => {
    if (p.catalogKind === 'machine') {
      if (selectedMachineIds.length === 0) {
        selectedMachineIds.push(p.id);
        const usage = usageValueFromSavedItem(p);
        if (usage) machineUsageById[p.id] = usage;
      }
    } else if (p.machineId != null) {
      const mid = p.machineId;
      if (selectedMachineIds.length === 0) selectedMachineIds.push(mid);
      if (selectedMachineIds[0] !== mid) return;
      if (!injectableByMachine[mid]) {
        injectableByMachine[mid] = { productIds: [], usage: {} };
      }
      injectableByMachine[mid].productIds.push(p.id);
      injectableByMachine[mid].usage[p.id] = usageValueFromSavedItem(p);
    } else if (!isMachineAssignment) {
      selectedProductIds.push(p.id);
      productUsageById[p.id] = usageValueFromSavedItem(p);
    }
  });

  return {
    serviceId: normalizeServiceId(
      initialAssignment.serviceId ?? initialAssignment.service?.id
    ),
    selectedProductIds,
    productUsageById,
    selectedMachineIds,
    machineUsageById,
    injectableByMachine,
  };
}

export default function FaceZoneServiceDialog({
  open,
  zone,
  initialAssignment,
  assignedServiceIds = [],
  onClose,
  onConfirm,
  onRemoveZone,
}) {
  const theme = useTheme();
  const { get } = useApi();
  const { showError } = useToast();

  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [catalogItems, setCatalogItems] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [allInjectableProducts, setAllInjectableProducts] = useState([]);
  const [injectableProductsLoading, setInjectableProductsLoading] = useState(false);

  const [serviceId, setServiceId] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [productUsageById, setProductUsageById] = useState({});
  const [selectedMachineIds, setSelectedMachineIds] = useState([]);
  const [machineUsageById, setMachineUsageById] = useState({});
  const [injectableByMachine, setInjectableByMachine] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const selectedService = useMemo(
    () => (serviceId !== '' && serviceId != null ? findService(services, serviceId) : null),
    [services, serviceId]
  );

  const isMachineService = isMachineServiceCategory(selectedService?.category);
  const catalogSectionLabel = isMachineService ? 'Machines' : 'Products';
  const isEditingService = Boolean(initialAssignment);

  const isServiceAssignedToZone = useCallback(
    id => assignedServiceIds.some(assignedId => catalogIdsMatch(assignedId, id)),
    [assignedServiceIds]
  );

  const hasInjectablesMachine = useMemo(
    () =>
      isMachineService &&
      catalogItems.some(m => m.catalogKind === 'machine' && normalizeMachineType(m.type) === 'injectables'),
    [isMachineService, catalogItems]
  );

  useEffect(() => {
    if (!open) return;
    setSubmitAttempted(false);
    const restored = restoreFromAssignment(initialAssignment);
    setServiceId(restored.serviceId);
    setSelectedProductIds(restored.selectedProductIds);
    setProductUsageById(restored.productUsageById);
    setSelectedMachineIds(restored.selectedMachineIds);
    setMachineUsageById(restored.machineUsageById);
    setInjectableByMachine(restored.injectableByMachine);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, zone?.id, initialAssignment]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setServicesLoading(true);
      try {
        const data = await get(dermaServicesListUrl());
        if (cancelled) return;
        const { rows } = parsePaginatedList(data, { listKeys: ['services'] });
        setServices(rows);
      } catch (err) {
        if (!cancelled) {
          setServices([]);
          showError(apiErrorMessage(err, 'Could not load services.'));
        }
      } finally {
        if (!cancelled) setServicesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || serviceId === '' || serviceId == null) {
      setCatalogItems([]);
      return;
    }
    const service = findService(services, serviceId);
    const category = service?.category ?? 'injectable';
    let cancelled = false;
    (async () => {
      setCatalogLoading(true);
      try {
        const data = await get(dermaCatalogItemsUrl(serviceId, category));
        if (cancelled) return;
        const { rows } = parsePaginatedList(data, {
          listKeys: dermaCatalogListKeys(category),
        });
        const mapped = isMachineServiceCategory(category)
          ? rows.map(mapMachineRow)
          : rows.map(mapProductRow);
        setCatalogItems(mapped);
      } catch (err) {
        if (!cancelled) {
          setCatalogItems([]);
          showError(
            apiErrorMessage(
              err,
              isMachineServiceCategory(category)
                ? 'Could not load machines.'
                : 'Could not load products.'
            )
          );
        }
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, serviceId, services]);

  useEffect(() => {
    if (!open || !hasInjectablesMachine) {
      setAllInjectableProducts([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setInjectableProductsLoading(true);
      try {
        const data = await get(allProductsUrl());
        if (cancelled) return;
        const { rows } = parsePaginatedList(data, { listKeys: ['products'] });
        setAllInjectableProducts(rows.map(mapProductRow));
      } catch (err) {
        if (!cancelled) {
          setAllInjectableProducts([]);
          showError(apiErrorMessage(err, 'Could not load injectable products.'));
        }
      } finally {
        if (!cancelled) setInjectableProductsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, hasInjectablesMachine]);

  useEffect(() => {
    if (!open || serviceId === '' || serviceId == null) return;
    if (catalogLoading || catalogItems.length === 0) return;

    if (isMachineService) {
      setSelectedMachineIds(prev => prev.filter(id => findCatalogItem(catalogItems, id)));
      setMachineUsageById(prev => {
        const next = {};
        Object.keys(prev).forEach(key => {
          if (findCatalogItem(catalogItems, key)) next[key] = prev[key];
        });
        return next;
      });
      setInjectableByMachine(prev => {
        const next = {};
        Object.keys(prev).forEach(mid => {
          if (findCatalogItem(catalogItems, mid)) next[mid] = prev[mid];
        });
        return next;
      });
    } else {
      setSelectedProductIds(prev => prev.filter(id => findCatalogItem(catalogItems, id)));
      setProductUsageById(prev => {
        const next = {};
        Object.keys(prev).forEach(key => {
          if (findCatalogItem(catalogItems, key)) next[key] = prev[key];
        });
        return next;
      });
    }
  }, [open, serviceId, catalogItems, catalogLoading, isMachineService]);

  const resetCatalogSelection = () => {
    setSelectedProductIds([]);
    setProductUsageById({});
    setSelectedMachineIds([]);
    setMachineUsageById({});
    setInjectableByMachine({});
    setCatalogItems([]);
    setAllInjectableProducts([]);
    setSubmitAttempted(false);
  };

  const handleServiceChange = e => {
    setServiceId(normalizeServiceId(e.target.value));
    resetCatalogSelection();
  };

  const toggleProduct = item => {
    const itemId = item.id;
    setSelectedProductIds(prev => {
      if (prev.some(id => catalogIdsMatch(id, itemId))) {
        setProductUsageById(u => {
          const next = { ...u };
          Object.keys(next).forEach(key => {
            if (catalogIdsMatch(key, itemId)) delete next[key];
          });
          return next;
        });
        return prev.filter(id => !catalogIdsMatch(id, itemId));
      }
      setProductUsageById(u => ({ ...u, [itemId]: u[itemId] ?? '' }));
      return [...prev, itemId];
    });
  };

  const toggleMachine = machine => {
    const machineId = machine.id;
    const machineType = normalizeMachineType(machine.type);
    setSelectedMachineIds(prev => {
      if (prev.some(id => catalogIdsMatch(id, machineId))) {
        setMachineUsageById({});
        setInjectableByMachine({});
        return [];
      }
      if (machineZoneNeedsUsageField(machineType)) {
        setMachineUsageById(prev => ({ [machineId]: prev[machineId] ?? '' }));
      } else {
        setMachineUsageById({});
      }
      if (machineType === 'injectables') {
        setInjectableByMachine(prev => ({
          [machineId]: prev[machineId] ?? { productIds: [], usage: {} },
        }));
      } else {
        setInjectableByMachine({});
      }
      return [machineId];
    });
  };

  const toggleInjectableProduct = (machineId, product) => {
    const productId = product.id;
    setInjectableByMachine(prev => {
      const current = prev[machineId] ?? { productIds: [], usage: {} };
      const has = current.productIds.some(id => catalogIdsMatch(id, productId));
      if (has) {
        const usage = { ...current.usage };
        Object.keys(usage).forEach(key => {
          if (catalogIdsMatch(key, productId)) delete usage[key];
        });
        return {
          ...prev,
          [machineId]: {
            productIds: current.productIds.filter(id => !catalogIdsMatch(id, productId)),
            usage,
          },
        };
      }
      return {
        ...prev,
        [machineId]: {
          productIds: [...current.productIds, productId],
          usage: { ...current.usage, [productId]: current.usage[productId] ?? '' },
        },
      };
    });
  };

  const selectedCount = useMemo(() => {
    if (!isMachineService) return selectedProductIds.length;
    let count = 0;
    selectedMachineIds.forEach(mid => {
      const machine = findCatalogItem(catalogItems, mid);
      if (!machine) return;
      const t = normalizeMachineType(machine.type);
      if (t === 'injectables') {
        count += injectableByMachine[mid]?.productIds?.length ?? 0;
      } else {
        count += 1;
      }
    });
    return count;
  }, [isMachineService, selectedProductIds, selectedMachineIds, catalogItems, injectableByMachine]);

  const saveValidation = useMemo(() => {
    const errors = {};
    const injectableErrorsByMachine = {};

    if (serviceId === '' || serviceId == null) {
      return { canSave: false, errors, injectableErrorsByMachine };
    }

    if (isMachineService) {
      if (selectedCount === 0) {
        return { canSave: false, errors, injectableErrorsByMachine };
      }
      selectedMachineIds.forEach(mid => {
        const machine = findCatalogItem(catalogItems, mid);
        if (!machine) return;
        const t = normalizeMachineType(machine.type);
        if (t === 'injectables') {
          const sel = injectableByMachine[mid];
          const productIds = sel?.productIds ?? [];
          if (productIds.length === 0) {
            errors[`machine-${mid}`] = 'Select at least one product';
            return;
          }
          injectableErrorsByMachine[mid] = {};
          productIds.forEach(pid => {
            const product = findCatalogItem(allInjectableProducts, pid);
            if (!product) return;
            const parsed = parseDermaZoneProductUsage(product.type, sel.usage[pid]);
            if (!parsed.valid) injectableErrorsByMachine[mid][pid] = parsed.message;
          });
        } else if (machineZoneNeedsUsageField(t)) {
          const parsed = parseMachineZoneUsage(t, pickMapValue(machineUsageById, mid));
          if (!parsed.valid) errors[`machine-${mid}`] = parsed.message;
        }
      });
      const hasInjectableErrors = Object.values(injectableErrorsByMachine).some(
        m => Object.keys(m).length > 0
      );
      return {
        canSave: Object.keys(errors).length === 0 && !hasInjectableErrors,
        errors,
        injectableErrorsByMachine,
      };
    }

    if (selectedProductIds.length === 0) {
      return { canSave: false, errors, injectableErrorsByMachine };
    }
    selectedProductIds.forEach(pid => {
      const product = findCatalogItem(catalogItems, pid);
      if (!product) return;
      const parsed = parseDermaZoneProductUsage(product.type, pickMapValue(productUsageById, pid));
      if (!parsed.valid) errors[pid] = parsed.message;
    });
    return {
      canSave: Object.keys(errors).length === 0,
      errors,
      injectableErrorsByMachine,
    };
  }, [
    serviceId,
    isMachineService,
    selectedCount,
    selectedMachineIds,
    selectedProductIds,
    catalogItems,
    machineUsageById,
    injectableByMachine,
    allInjectableProducts,
    productUsageById,
  ]);

  const buildSavedItems = () => {
    if (isMachineService) {
      const items = [];
      selectedMachineIds.forEach(mid => {
        const machine = findCatalogItem(catalogItems, mid);
        if (!machine) return;
        const t = normalizeMachineType(machine.type);
        if (t === 'injectables') {
          const sel = injectableByMachine[mid];
          (sel?.productIds ?? []).forEach(pid => {
            const product = findCatalogItem(allInjectableProducts, pid);
            if (!product) return;
            const parsed = parseDermaZoneProductUsage(product.type, sel.usage[pid]);
            if (!parsed.valid) return;
            items.push({
              id: product.id,
              name: product.name,
              catalogKind: 'product',
              type: product.type,
              machineId: machine.id,
              machineName: machine.name,
              ...(parsed.quantity != null ? { quantity: parsed.quantity } : {}),
              ...(parsed.volume_ml != null ? { volume_ml: parsed.volume_ml } : {}),
            });
          });
        } else {
          const parsed = parseMachineZoneUsage(t, pickMapValue(machineUsageById, mid));
          items.push({
            id: machine.id,
            name: machine.name,
            catalogKind: 'machine',
            type: t,
            ...(parsed.minutes != null ? { minutes: parsed.minutes } : {}),
            ...(parsed.pulses != null ? { pulses: parsed.pulses } : {}),
          });
        }
      });
      return items;
    }

    return selectedProductIds
      .map(pid => {
        const product = findCatalogItem(catalogItems, pid);
        if (!product) return null;
        const parsed = parseDermaZoneProductUsage(product.type, pickMapValue(productUsageById, pid));
        if (!parsed.valid) return null;
        return {
          id: product.id,
          name: product.name,
          catalogKind: 'product',
          type: product.type,
          ...(parsed.quantity != null ? { quantity: parsed.quantity } : {}),
          ...(parsed.volume_ml != null ? { volume_ml: parsed.volume_ml } : {}),
        };
      })
      .filter(Boolean);
  };

  const handleSave = () => {
    setSubmitAttempted(true);
    if (!saveValidation.canSave) return;

    const service = findService(services, serviceId);
    if (!service || zone == null) return;

    const products = buildSavedItems();
    if (!products.length) return;

    onConfirm?.({
      zone,
      service: {
        id: service.id ?? service.uuid,
        name: service.name?.trim?.() || `Service #${service.id ?? service.uuid}`,
        category: service.category,
        category_display: service.category_display,
      },
      products,
    });
    onClose?.();
  };

  const handleRemove = () => {
    if (zone == null) return;
    onRemoveZone?.(zone);
    onClose?.();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
    >
      <Box
        sx={{
          px: 3,
          pt: 2.5,
          pb: 2,
          bgcolor: alpha(theme.palette.primary.main, 0.06),
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
          {zone ? (
            <Chip label={`Zone ${zone.id}`} size="small" color="primary" sx={{ fontWeight: 700 }} />
          ) : null}
          <Typography variant="h6" component="h2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
            {zone?.label ?? 'Zone treatment'}
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {isEditingService
            ? 'Service cannot be changed while editing. Update products or amounts below.'
            : isMachineService
              ? 'Pick one machine for this zone. Inside injectables machines you can select multiple products.'
              : 'Pick a service, select products, and enter amounts. Services already on this zone are disabled.'}
        </Typography>
      </Box>

      <DialogContent sx={{ px: 3, pt: 2.5, pb: 1 }}>
        <Typography variant="overline" color="text.secondary" sx={{ display: 'block', letterSpacing: 0.8, mb: 1 }}>
          Service
        </Typography>
        <FormControl
          fullWidth
          size="small"
          disabled={servicesLoading || isEditingService}
          sx={{ mb: 2 }}
        >
          <InputLabel id="face-zone-service-label">Select service</InputLabel>
          <Select
            labelId="face-zone-service-label"
            label="Select service"
            value={serviceId}
            onChange={handleServiceChange}
            sx={{
              borderRadius: 2,
              ...(isEditingService
                ? {
                    '& .MuiSelect-select': { cursor: 'default' },
                  }
                : {}),
            }}
          >
            {services.map(s => {
              const id = s.id ?? s.uuid;
              const alreadyOnZone = !isEditingService && isServiceAssignedToZone(id);
              const label = s.category_display ? `${s.name} · ${s.category_display}` : s.name;
              return (
                <MenuItem key={id} value={id} disabled={alreadyOnZone}>
                  {alreadyOnZone ? `${label} (already on this zone)` : label}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        {servicesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        ) : null}

        {serviceId !== '' && serviceId != null ? (
          <>
            <Divider sx={{ mb: 2 }} />
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
              <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.8 }}>
                {catalogSectionLabel}
              </Typography>
              {selectedCount > 0 ? (
                <Chip
                  label={`${selectedCount} selected`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ height: 24 }}
                />
              ) : null}
            </Stack>

            {catalogLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, py: 4 }}>
                <CircularProgress size={22} />
                <Typography variant="body2" color="text.secondary">
                  Loading…
                </Typography>
              </Box>
            ) : catalogItems.length > 0 ? (
              <Stack spacing={1.25} sx={{ maxHeight: 340, overflowY: 'auto', pr: 0.5, mr: -0.5 }}>
                {isMachineService
                  ? catalogItems.map(machine => (
                      <MachineCatalogCard
                        key={machine.id}
                        machine={machine}
                        selected={selectedMachineIds.some(id => catalogIdsMatch(id, machine.id))}
                        usageValue={pickMapValue(machineUsageById, machine.id)}
                        showUsageError={(() => {
                          const mid = selectedMachineIds.find(id => catalogIdsMatch(id, machine.id));
                          return (
                            submitAttempted &&
                            mid != null &&
                            Boolean(saveValidation.errors[`machine-${mid}`])
                          );
                        })()}
                        usageErrorMessage={(() => {
                          const mid = selectedMachineIds.find(id => catalogIdsMatch(id, machine.id));
                          return mid != null ? saveValidation.errors[`machine-${mid}`] : undefined;
                        })()}
                        injectableProducts={allInjectableProducts}
                        injectableProductsLoading={injectableProductsLoading}
                        injectableSelection={pickMapEntry(injectableByMachine, machine.id)}
                        injectableErrors={saveValidation.injectableErrorsByMachine[machine.id]}
                        submitAttempted={submitAttempted}
                        onToggleMachine={toggleMachine}
                        onMachineUsageChange={(id, value) =>
                          setMachineUsageById(prev => ({ ...prev, [id]: value }))
                        }
                        onToggleInjectableProduct={toggleInjectableProduct}
                        onInjectableUsageChange={(machineId, productId, value) =>
                          setInjectableByMachine(prev => ({
                            ...prev,
                            [machineId]: {
                              ...(prev[machineId] ?? { productIds: [], usage: {} }),
                              usage: {
                                ...(prev[machineId]?.usage ?? {}),
                                [productId]: value,
                              },
                            },
                          }))
                        }
                      />
                    ))
                  : catalogItems.map(item => (
                      <ProductCatalogCard
                        key={item.id}
                        item={item}
                        selected={selectedProductIds.some(id => catalogIdsMatch(id, item.id))}
                        usageValue={pickMapValue(productUsageById, item.id)}
                        showError={
                          submitAttempted &&
                          selectedProductIds.includes(item.id) &&
                          Boolean(saveValidation.errors[item.id])
                        }
                        errorMessage={saveValidation.errors[item.id]}
                        onToggle={toggleProduct}
                        onUsageChange={(id, value) =>
                          setProductUsageById(prev => ({ ...prev, [id]: value }))
                        }
                      />
                    ))}
              </Stack>
            ) : (
              <Paper
                variant="outlined"
                sx={{
                  py: 3,
                  px: 2,
                  textAlign: 'center',
                  borderRadius: 2,
                  borderStyle: 'dashed',
                  bgcolor: 'action.hover',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {isMachineService ? 'No machines for this service.' : 'No products for this service.'}
                </Typography>
              </Paper>
            )}
          </>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            Choose a service to continue.
          </Typography>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.default',
          gap: 1,
        }}
      >
        {initialAssignment ? (
          <Button color="error" onClick={handleRemove} sx={{ borderRadius: 2, mr: 'auto' }}>
            Clear zone
          </Button>
        ) : null}
        <Button onClick={onClose} sx={{ borderRadius: 2 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={selectedCount === 0}
          sx={{ borderRadius: 2, minWidth: 88 }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
