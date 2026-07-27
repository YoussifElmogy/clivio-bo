import React, { useMemo, useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';

/**
 * @param {{
 *   rows: Array<{ id: string, general_service_id: number, name: string, price: string }>,
 *   onRowsChange: (rows: Array) => void,
 *   catalog: Array<{ id: number, name: string, clinic_fees?: number|null, price?: number|null }>,
 *   catalogLoading?: boolean,
 *   disabled?: boolean,
 *   emptyMessage?: string,
 * }} props
 */
export default function GeneralServicesEditor({
  rows,
  onRowsChange,
  catalog,
  catalogLoading = false,
  disabled = false,
  emptyMessage = 'No general services added yet.',
}) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [searchInput, setSearchInput] = useState('');

  const availableOptions = useMemo(() => {
    const selectedIds = new Set(rows.map(row => Number(row.general_service_id)));
    return catalog
      .filter(service => !selectedIds.has(Number(service.id)))
      .map(service => ({
        id: service.id,
        label: service.name,
        clinic_fees: service.clinic_fees,
        price: service.price,
      }));
  }, [catalog, rows]);

  const handleAdd = () => {
    const service = selectedOption;
    if (!service?.id) return;
    const defaultPrice = service.clinic_fees ?? service.price ?? '';
    onRowsChange([
      ...rows,
      {
        id: `svc-${service.id}-${Date.now()}`,
        general_service_id: service.id,
        name: service.label,
        price:
          defaultPrice !== '' && defaultPrice != null && !Number.isNaN(Number(defaultPrice))
            ? String(defaultPrice)
            : '',
      },
    ]);
    setSelectedOption(null);
    setSearchInput('');
  };

  const handleUpdatePrice = (rowId, nextPrice) => {
    onRowsChange(rows.map(row => (row.id === rowId ? { ...row, price: nextPrice } : row)));
  };

  const handleRemove = rowId => {
    onRowsChange(rows.filter(row => row.id !== rowId));
  };

  return (
    <Stack spacing={2}>
      {!disabled ? (
        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.25 }}>
            Add service
          </Typography>
          <Stack spacing={1.25}>
            <Autocomplete
              disabled={disabled || catalogLoading}
              options={availableOptions}
              value={selectedOption}
              onChange={(_, next) => setSelectedOption(next)}
              inputValue={searchInput}
              onInputChange={(_, next) => setSearchInput(next)}
              getOptionLabel={option => option?.label ?? ''}
              isOptionEqualToValue={(a, b) => Number(a?.id) === Number(b?.id)}
              noOptionsText={
                catalogLoading
                  ? 'Loading services…'
                  : catalog.length === 0
                    ? 'No general services found'
                    : 'No matching services'
              }
              renderInput={params => (
                <TextField
                  {...params}
                  size="small"
                  label="Search service"
                  placeholder="Type to search"
                  slotProps={{
                    ...params.slotProps,
                    input: {
                      ...params.slotProps?.input,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <SearchOutlined fontSize="small" color="action" />
                          </InputAdornment>
                          {params.slotProps?.input?.startAdornment}
                        </>
                      ),
                    },
                  }}
                />
              )}
            />
            <Button
              variant="contained"
              onClick={handleAdd}
              disabled={catalogLoading || !selectedOption}
              startIcon={<AddOutlined />}
              sx={{ borderRadius: 2, alignSelf: 'flex-start' }}
            >
              Add to appointment
            </Button>
          </Stack>
        </Paper>
      ) : null}

      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          Selected services {rows.length ? `(${rows.length})` : ''}
        </Typography>
        {rows.length ? (
          <Stack spacing={1} divider={<Divider flexItem />}>
            {rows.map(row => (
              <Paper key={row.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                      {row.name || 'General service'}
                    </Typography>
                  </Box>
                  <TextField
                    size="small"
                    label="Price"
                    type="number"
                    value={row.price}
                    onChange={e => handleUpdatePrice(row.id, e.target.value)}
                    disabled={disabled}
                    placeholder="0"
                    inputProps={{ min: 0, step: '0.01' }}
                    sx={{ width: 120, flexShrink: 0 }}
                  />
                  {!disabled ? (
                    <IconButton
                      size="small"
                      color="error"
                      aria-label="Remove service"
                      onClick={() => handleRemove(row.id)}
                      sx={{ flexShrink: 0 }}
                    >
                      <DeleteOutlineOutlined fontSize="small" />
                    </IconButton>
                  ) : null}
                </Stack>
              </Paper>
            ))}
          </Stack>
        ) : (
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: 2,
              textAlign: 'center',
              bgcolor: theme => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'grey.50'),
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {emptyMessage}
            </Typography>
          </Paper>
        )}
      </Box>
    </Stack>
  );
}
