import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import useApi from '../configs/useApi';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import ProductForm from '../forms/ProductForm/ProductForm';
import { useToast } from '../context/ToastContext';
import { productDefaultValues, productSchema } from '../schemas/productSchema';
import { buildProductPayload } from '../payloads/productPayload';
import { parsePaginatedList } from '../utils/parsePaginatedList';
import { servicesCatalogUrl } from '../utils/servicesCatalogUrl';

function ProductFormSkeleton() {
  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
        <Skeleton variant="rounded" width="100%" height={56} />
        <Skeleton variant="rounded" width="100%" height={56} />
      </Stack>
      <Skeleton variant="rounded" width="100%" height={56} />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
        <Skeleton variant="rounded" width="100%" height={56} />
        <Skeleton variant="rounded" width="100%" height={56} />
        <Skeleton variant="rounded" width="100%" height={56} />
      </Stack>
      <Skeleton variant="rounded" width={170} height={44} />
    </Stack>
  );
}

export default function ProductCreatePage() {
  const navigate = useNavigate();
  const { get, post } = useApi();
  const { showSuccess, showError, showWarning } = useToast();
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  const resolver = useMemo(
    () => (values, context, options) => yupResolver(productSchema)(values, context, options),
    []
  );

  const methods = useForm({
    resolver,
    defaultValues: productDefaultValues,
    mode: 'onTouched',
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setServicesLoading(true);
      try {
        const data = await get(servicesCatalogUrl('injectable'));
        if (cancelled) return;
        const { rows } = parsePaginatedList(data, { listKeys: ['services'] });
        setServices(rows);
      } catch {
        if (!cancelled) {
          setServices([]);
          showWarning('Could not load services.');
        }
      } finally {
        if (!cancelled) setServicesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async values => {
    try {
      await post('/products', buildProductPayload(values));
      showSuccess('Injectable created.');
      navigate('/inventory', { replace: false });
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not create injectable.';
      showError(typeof msg === 'string' ? msg : 'Could not create injectable.');
    }
  };

  return (
    <FormPageShell
      title="Add injectable"
      description="Create an injectable product and assign it to a service."
      headerAction={
        <Button variant="outlined" onClick={() => navigate('/inventory')} sx={{ borderRadius: 2 }}>
          Back to list
        </Button>
      }
      maxWidth="md"
    >
      {servicesLoading ? (
        <ProductFormSkeleton />
      ) : (
        <FormProvider {...methods}>
          <ProductForm services={services} onSubmit={onSubmit} submitLabel="Create injectable" />
        </FormProvider>
      )}
    </FormPageShell>
  );
}
