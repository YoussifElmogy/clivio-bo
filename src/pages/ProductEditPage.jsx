import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import useApi from '../configs/useApi';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import CustomLoader from '../components/CustomLoader/CustomLoader';
import ProductForm from '../forms/ProductForm/ProductForm';
import { useToast } from '../context/ToastContext';
import { productDefaultValues, productSchema } from '../schemas/productSchema';
import { buildProductPayload, mergeProductFromApi } from '../payloads/productPayload';
import { parsePaginatedList } from '../utils/parsePaginatedList';
import { servicesCatalogUrl } from '../utils/servicesCatalogUrl';

function ProductEditSkeleton() {
  return (
    <Stack spacing={2.5}>
      <Skeleton variant="rounded" width="100%" height={56} />
      <Skeleton variant="rounded" width="100%" height={56} />
      <Skeleton variant="rounded" width="100%" height={56} />
      <Skeleton variant="rounded" width="100%" height={56} />
      <Skeleton variant="rounded" width={170} height={44} />
    </Stack>
  );
}

export default function ProductEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { get, patch, del } = useApi();
  const { showSuccess, showError, showWarning } = useToast();
  const [services, setServices] = useState([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const [productName, setProductName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const resolver = useMemo(
    () => (values, context, options) => yupResolver(productSchema)(values, context, options),
    []
  );

  const methods = useForm({
    resolver,
    defaultValues: productDefaultValues,
    mode: 'onTouched',
  });
  const { reset } = methods;

  useEffect(() => {
    if (!id) {
      showError('Missing injectable id.');
      navigate('/inventory', { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      setInitialLoad(true);
      try {
        const results = await Promise.allSettled([
          get(`/products/${encodeURIComponent(id)}`),
          get(servicesCatalogUrl('injectable')),
        ]);
        if (cancelled) return;

        const productRes = results[0];
        const servicesRes = results[1];
        if (servicesRes.status === 'fulfilled') {
          const { rows } = parsePaginatedList(servicesRes.value, { listKeys: ['services'] });
          setServices(rows);
        } else {
          setServices([]);
          showWarning('Could not load services.');
        }

        if (productRes.status === 'rejected') {
          const err = productRes.reason;
          const msg =
            err?.response?.data?.detail ||
            err?.response?.data?.message ||
            err?.message ||
            'Could not load injectable.';
          showError(typeof msg === 'string' ? msg : 'Could not load injectable.');
          navigate('/inventory', { replace: true });
          return;
        }

        const merged = mergeProductFromApi(productRes.value);
        reset(merged);
        setProductName(merged.name?.trim?.() || '');
      } finally {
        if (!cancelled) setInitialLoad(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onSubmit = async values => {
    if (!id) return;
    try {
      await patch(`/products/${encodeURIComponent(id)}`, buildProductPayload(values));
      showSuccess('Injectable updated.');
      navigate('/inventory', { replace: false });
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not update injectable.';
      showError(typeof msg === 'string' ? msg : 'Could not update injectable.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!id) return;
    setDeleteSubmitting(true);
    try {
      await del(`/products/${encodeURIComponent(id)}`);
      setDeleteDialogOpen(false);
      showSuccess('Injectable deleted.');
      navigate('/inventory', { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not delete injectable.';
      showError(typeof msg === 'string' ? msg : 'Could not delete injectable.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <>
      <CustomLoader active={deleteSubmitting} />
      <FormPageShell
        title="Edit injectable"
        description={productName ? `Update ${productName}.` : 'Update this injectable.'}
        headerAction={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={initialLoad || deleteSubmitting}
              sx={{ borderRadius: 2 }}
            >
              Delete injectable
            </Button>
            <Button variant="outlined" onClick={() => navigate('/inventory')} sx={{ borderRadius: 2 }}>
              Back to list
            </Button>
          </Stack>
        }
        maxWidth="md"
      >
        {initialLoad ? (
          <ProductEditSkeleton />
        ) : (
          <FormProvider {...methods}>
            <ProductForm services={services} onSubmit={onSubmit} submitLabel="Save changes" />
          </FormProvider>
        )}
      </FormPageShell>
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleteSubmitting && setDeleteDialogOpen(false)}
        aria-labelledby="delete-product-edit-dialog-title"
      >
        <DialogTitle id="delete-product-edit-dialog-title">Delete injectable?</DialogTitle>
        <DialogContent>
          This cannot be undone.{' '}
          {productName ? (
            <>
              Remove <strong>{productName}</strong> permanently?
            </>
          ) : (
            'Remove this injectable permanently?'
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteSubmitting}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDelete}
            disabled={deleteSubmitting}
            startIcon={
              deleteSubmitting ? (
                <CircularProgress size={18} thickness={5} color="inherit" aria-hidden />
              ) : null
            }
          >
            {deleteSubmitting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
