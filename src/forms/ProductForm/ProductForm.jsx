import React, { useEffect } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import FormFieldLabel from '../../components/FormFieldLabel/FormFieldLabel';
import FormTextField from '../../components/FormTextField/FormTextField';
import { useToast } from '../../context/ToastContext';
import { PRODUCT_TYPE_OPTIONS, productPriceFieldLabel } from '../../schemas/productSchema';

export default function ProductForm({ services, onSubmit, submitLabel = 'Save product' }) {
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useFormContext();
  const { showError: showValidationToast } = useToast();
  const selectedType = useWatch({ control, name: 'type' });

  useEffect(() => {
    if (selectedType !== 'veil') {
      setValue('volume', '', { shouldDirty: true, shouldValidate: true });
    }
  }, [selectedType, setValue]);

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit(onSubmit, () =>
        showValidationToast('Please fix the errors highlighted below.')
      )}
    >
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="service"
            control={control}
            render={({ field, fieldState }) => (
              <Box>
                <FormFieldLabel htmlFor="product-service" required>
                  Service
                </FormFieldLabel>
                <FormControl fullWidth error={Boolean(fieldState.error)} variant="outlined">
                  <Select
                    id="product-service"
                    value={field.value === '' || field.value === undefined ? '' : field.value}
                    onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                    disabled={isSubmitting}
                    inputProps={{ 'aria-label': 'Service' }}
                  >
                    <MenuItem value="">
                      <em>Select service</em>
                    </MenuItem>
                    {services.map(s => {
                      const sid = s.id ?? s.uuid;
                      if (sid == null) return null;
                      return (
                        <MenuItem key={String(sid)} value={Number(sid)}>
                          {s.name?.trim?.() || `Service #${sid}`}
                        </MenuItem>
                      );
                    })}
                  </Select>
                  {fieldState.error?.message ? (
                    <FormHelperText>{fieldState.error.message}</FormHelperText>
                  ) : null}
                </FormControl>
              </Box>
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="type"
            control={control}
            render={({ field, fieldState }) => (
              <Box>
                <FormFieldLabel htmlFor="product-type" required>
                  Type
                </FormFieldLabel>
                <FormControl fullWidth error={Boolean(fieldState.error)} variant="outlined">
                  <Select
                    id="product-type"
                    value={field.value ?? 'veil'}
                    onChange={e => field.onChange(String(e.target.value))}
                    disabled={isSubmitting}
                    inputProps={{ 'aria-label': 'Type' }}
                  >
                    {PRODUCT_TYPE_OPTIONS.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {fieldState.error?.message ? (
                    <FormHelperText>{fieldState.error.message}</FormHelperText>
                  ) : null}
                </FormControl>
              </Box>
            )}
          />
        </Grid>

        <Grid size={12}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <FormTextField
                field={field}
                id="product-name"
                label="Product name"
                required
                placeholder="e.g. Botox 50u"
                invalid={Boolean(errors.name)}
                errorMessage={errors.name?.message}
                disabled={isSubmitting}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name="quantity"
            control={control}
            render={({ field }) => (
              <FormTextField
                field={field}
                id="product-quantity"
                label="Quantity"
                required
                type="number"
                placeholder="0"
                invalid={Boolean(errors.quantity)}
                errorMessage={errors.quantity?.message}
                disabled={isSubmitting}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name="price"
            control={control}
            render={({ field }) => (
              <FormTextField
                field={field}
                id="product-price"
                label={productPriceFieldLabel(selectedType)}
                required
                type="number"
                placeholder="0.00"
                invalid={Boolean(errors.price)}
                errorMessage={errors.price?.message}
                disabled={isSubmitting}
              />
            )}
          />
        </Grid>

        {selectedType === 'veil' ? (
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              name="volume"
              control={control}
              render={({ field }) => (
                <FormTextField
                  field={field}
                  id="product-volume"
                  label="Volume"
                  required
                  type="number"
                  placeholder="e.g. 2.5"
                  invalid={Boolean(errors.volume)}
                  errorMessage={errors.volume?.message}
                  disabled={isSubmitting}
                />
              )}
            />
          </Grid>
        ) : (
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 4.5 }}>
              Volume is not required for syringe products.
            </Typography>
          </Grid>
        )}
      </Grid>

      <Button
        type="submit"
        variant="contained"
        size="large"
        sx={{ mt: 3, borderRadius: 2, minWidth: 170 }}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Saving…' : submitLabel}
      </Button>
    </Box>
  );
}
