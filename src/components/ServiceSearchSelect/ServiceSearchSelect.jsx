import React, { useMemo } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import FormFieldLabel from '../FormFieldLabel/FormFieldLabel';

const LIST_MAX_HEIGHT = 240;

function serviceOptions(services) {
  return (Array.isArray(services) ? services : [])
    .map(service => {
      const rawId = service?.id ?? service?.uuid;
      const id = Number(rawId);
      if (!Number.isFinite(id)) return null;
      return {
        id,
        label: service?.name?.trim?.() || `Service #${id}`,
      };
    })
    .filter(Boolean);
}

/**
 * Searchable service picker with a capped, scrollable list.
 */
export default function ServiceSearchSelect({
  id,
  label = 'Service',
  services,
  value,
  onChange,
  onBlur,
  inputRef,
  disabled = false,
  error = false,
  errorMessage,
}) {
  const options = useMemo(() => serviceOptions(services), [services]);
  const selected =
    options.find(option => String(option.id) === String(value ?? '')) ?? null;

  return (
    <Box>
      <FormFieldLabel htmlFor={id} required>
        {label}
      </FormFieldLabel>
      <Autocomplete
        id={id}
        options={options}
        value={selected}
        onChange={(_, option) => onChange(option ? option.id : '')}
        onBlur={onBlur}
        getOptionLabel={option => option?.label ?? ''}
        isOptionEqualToValue={(option, current) => option.id === current.id}
        disabled={disabled}
        noOptionsText="No services found"
        slotProps={{
          listbox: {
            sx: {
              maxHeight: LIST_MAX_HEIGHT,
              overflowY: 'auto',
            },
          },
        }}
        renderInput={params => (
          <TextField
            {...params}
            inputRef={inputRef}
            placeholder="Search services"
            error={error}
            helperText={errorMessage || undefined}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        )}
      />
    </Box>
  );
}
