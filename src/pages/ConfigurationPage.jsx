import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import useApi from '../configs/useApi';
import FormPageShell from '../components/FormPageShell/FormPageShell';
import ConfigurationForm from '../forms/ConfigurationForm/ConfigurationForm';
import ConfigurationFormSkeleton from '../forms/ConfigurationForm/ConfigurationFormSkeleton';
import { useToast } from '../context/ToastContext';
import {
  configurationSchema,
  configurationDefaultValues,
} from '../schemas/configurationSchema';
import {
  buildConfigurationFormData,
  mergeConfigFromApi,
} from '../payloads/configurationPayload';

export default function ConfigurationPage() {
  const { get, patch } = useApi();
  const { showSuccess, showError, showWarning } = useToast();
  const [loadingConfig, setLoadingConfig] = React.useState(true);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(configurationSchema),
    defaultValues: configurationDefaultValues,
    mode: 'onTouched',
  });

  // Intentionally run once on mount. Do not add `get` (or other request helpers) to the dependency array.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingConfig(true);
      try {
        const data = await get('/configuration');
        if (!cancelled) {
          reset(mergeConfigFromApi(data));
        }
      } catch {
        if (!cancelled) {
          showWarning(
            'Could not load current configuration. You can still edit and save.'
          );
          reset(configurationDefaultValues);
        }
      } finally {
        if (!cancelled) setLoadingConfig(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async values => {
    try {
      await patch('/configuration', buildConfigurationFormData(values));
      showSuccess('Configuration saved.');
    } catch (err) {
      const msg =
        (typeof err === 'object' && err !== null && err.error) ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Unable to save configuration.';
      showError(typeof msg === 'string' ? msg : 'Unable to save configuration.');
    }
  };

  return (
    <FormPageShell
      title="Configurations"
      description="Clinic website identity, images, colors, and public links."
      maxWidth="lg"
    >
      {loadingConfig ? (
        <ConfigurationFormSkeleton />
      ) : (
        <ConfigurationForm
          control={control}
          errors={errors}
          isSubmitting={isSubmitting}
          handleSubmit={handleSubmit}
          onSubmit={onSubmit}
        />
      )}
    </FormPageShell>
  );
}
