import React, { useCallback, useMemo, useState } from 'react';
import { Controller } from 'react-hook-form';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import ListSubheader from '@mui/material/ListSubheader';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import FormFieldLabel from '../FormFieldLabel/FormFieldLabel';
import { COUNTRY_OPTIONS, DEFAULT_COUNTRY_CODE } from '../../constants/countryPhoneOptions';
import { nationalPhoneMaxLength, nationalPhonePlaceholder, sanitizeNationalPhoneInput } from '../../utils/phoneNumber';

const COUNTRY_MENU_MAX_HEIGHT = 10;

function filterCountryOptions(query) {
  const q = query.trim().toLowerCase();
  if (!q) return COUNTRY_OPTIONS;
  const digits = q.replace(/\D/g, '');
  return COUNTRY_OPTIONS.filter(option => {
    if (option.label.toLowerCase().includes(q)) return true;
    if (option.iso.toLowerCase().includes(q)) return true;
    if (option.code.toLowerCase().includes(q)) return true;
    if (digits && option.code.replace('+', '').includes(digits)) return true;
    return false;
  });
}

function CountryCodeSelect({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = useMemo(() => filterCountryOptions(search), [search]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSearch('');
  }, []);

  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);

  return (
    <Select
      value={value || DEFAULT_COUNTRY_CODE}
      open={open}
      onOpen={handleOpen}
      onClose={handleClose}
      onChange={e => {
        onChange(e.target.value);
        handleClose();
      }}
      variant="standard"
      disableUnderline
      displayEmpty
      disabled={disabled}
      aria-label="Country code"
      renderValue={code => {
        const option = COUNTRY_OPTIONS.find(x => x.code === code);
        return option ? `${option.flag} ${option.code}` : code;
      }}
      MenuProps={{
        autoFocus: false,
        disableAutoFocusItem: true,
        PaperProps: {
          sx: {
            maxHeight: '200px !important',
            maxWidth: 'min(100vw - 32px, 380px)',
          },
        },
        MenuListProps: {
          sx: { maxHeight: '200px !important', pt: 0 },
        },
      }}
      sx={{
        minWidth: 110,
        mr: 1,
        pr: 0.5,
        borderRight: '1px solid',
        borderColor: 'divider',
        borderRadius: 0,
        '& .MuiSelect-select': {
          py: 0,
          pr: 2,
          fontWeight: 600,
          fontSize: '0.9rem',
        },
      }}
    >
      <ListSubheader sx={{ lineHeight: 1, px: 1.5, pt: 1, pb: 0.75, bgcolor: 'background.paper' }}>
        <TextField
          size="small"
          fullWidth
          autoFocus
          placeholder="Search country or code"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
          slotProps={{
            input: {
              sx: { fontSize: '0.875rem' },
            },
          }}
        />
      </ListSubheader>
      {filteredOptions.length === 0 ? (
        <MenuItem disabled dense sx={{ opacity: 0.72 }}>
          <Typography variant="body2" color="text.secondary">
            No countries found
          </Typography>
        </MenuItem>
      ) : (
        filteredOptions.map(option => (
          <MenuItem key={option.iso} value={option.code} dense>
            <span style={{ marginRight: 8 }}>{option.flag}</span>
            <span style={{ fontWeight: 600, marginRight: 8 }}>{option.code}</span>
            <span style={{ opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis' }}>{option.label}</span>
          </MenuItem>
        ))
      )}
    </Select>
  );
}

export default function PhoneNumberField({
  control,
  countryCodeName,
  numberName,
  id,
  label = 'Phone',
  required = false,
  placeholder = '100 111 2233',
  disabled = false,
  countryError,
  numberError,
}) {
  return (
    <Controller
      name={numberName}
      control={control}
      render={({ field: numberField }) => (
        <Controller
          name={countryCodeName}
          control={control}
          render={({ field: countryField }) => {
            const countryCode = countryField.value || DEFAULT_COUNTRY_CODE;
            const resolvedPlaceholder = nationalPhonePlaceholder(countryCode) || placeholder;
            const maxLength = nationalPhoneMaxLength(countryCode);

            const handleNumberChange = nextValue => {
              numberField.onChange(sanitizeNationalPhoneInput(countryCode, nextValue));
            };

            return (
              <Box>
                <FormFieldLabel htmlFor={id} required={required}>
                  {label}
                </FormFieldLabel>
                <TextField
                  {...numberField}
                  id={id}
                  hiddenLabel
                  fullWidth
                  type="tel"
                  autoComplete="tel-national"
                  placeholder={resolvedPlaceholder}
                  value={numberField.value ?? ''}
                  onChange={e => handleNumberChange(e.target.value)}
                  onPaste={e => {
                    e.preventDefault();
                    handleNumberChange(e.clipboardData?.getData('text') ?? '');
                  }}
                  error={Boolean(numberError) || Boolean(countryError)}
                  helperText={numberError?.message || countryError?.message}
                  disabled={disabled}
                  slotProps={{
                    input: {
                      inputProps: { maxLength },
                      startAdornment: (
                        <InputAdornment position="start" sx={{ mr: 0.5 }}>
                          <CountryCodeSelect
                            value={countryField.value || DEFAULT_COUNTRY_CODE}
                            disabled={disabled}
                            onChange={nextCode => {
                              countryField.onChange(nextCode);
                              handleNumberChange(numberField.value ?? '');
                            }}
                          />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    '& .MuiInputBase-root': {
                      borderRadius: 2,
                    },
                    '& .MuiInputBase-input': {
                      pl: 0.25,
                    },
                  }}
                />
              </Box>
            );
          }}
        />
      )}
    />
  );
}
