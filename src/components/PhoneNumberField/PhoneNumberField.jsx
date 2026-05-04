import React from 'react';
import { Controller } from 'react-hook-form';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import FormFieldLabel from '../FormFieldLabel/FormFieldLabel';
import { COUNTRY_OPTIONS, DEFAULT_COUNTRY_CODE } from '../../constants/countryPhoneOptions';

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
          render={({ field: countryField }) => (
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
                placeholder={placeholder}
                value={numberField.value ?? ''}
                onChange={e => numberField.onChange(e.target.value)}
                error={Boolean(numberError) || Boolean(countryError)}
                helperText={numberError?.message || countryError?.message}
                disabled={disabled}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start" sx={{ mr: 0.5 }}>
                        <Select
                          value={countryField.value || DEFAULT_COUNTRY_CODE}
                          onChange={e => countryField.onChange(e.target.value)}
                          variant="standard"
                          disableUnderline
                          displayEmpty
                          aria-label="Country code"
                          renderValue={code => {
                            const option = COUNTRY_OPTIONS.find(x => x.code === code);
                            return option ? `${option.flag} ${option.code}` : code;
                          }}
                          MenuProps={{
                            PaperProps: {
                              sx: { maxWidth: 'min(100vw - 32px, 380px)' },
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
                          {COUNTRY_OPTIONS.map(option => (
                            <MenuItem key={option.code} value={option.code}>
                              <span style={{ marginRight: 8 }}>{option.flag}</span>
                              <span style={{ fontWeight: 600, marginRight: 8 }}>{option.code}</span>
                              <span style={{ opacity: 0.8 }}>{option.label}</span>
                            </MenuItem>
                          ))}
                        </Select>
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
          )}
        />
      )}
    />
  );
}

