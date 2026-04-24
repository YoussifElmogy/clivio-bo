import * as yup from 'yup';

export const PRODUCT_TYPE_OPTIONS = [
  { value: 'veil', label: 'Vial' },
  { value: 'syringe', label: 'Syringe' },
];

/** API type remains `veil` for vial products. */
export function productPriceFieldLabel(type) {
  if (type === 'syringe') return 'Price per syringe';
  return 'Price per ml';
}

export const productDefaultValues = {
  service: '',
  name: '',
  type: 'veil',
  quantity: '',
  volume: '',
  price: '',
};

export const productSchema = yup.object({
  service: yup
    .mixed()
    .required('Select a service')
    .test('service', 'Select a service', v => v !== '' && v != null && !Number.isNaN(Number(v))),
  name: yup.string().trim().required('Name is required'),
  type: yup.string().oneOf(['veil', 'syringe']).required('Type is required'),
  quantity: yup
    .number()
    .typeError('Quantity must be a number')
    .integer('Quantity must be an integer')
    .min(0, 'Quantity must be at least 0')
    .required('Quantity is required'),
  volume: yup
    .number()
    .transform((value, originalValue) => {
      if (originalValue === '' || originalValue == null) return undefined;
      return value;
    })
    .when('type', {
      is: 'veil',
      then: schema =>
        schema
          .typeError('Volume must be a number')
          .moreThan(0, 'Volume must be greater than 0')
          .required('Volume is required for vial'),
      otherwise: schema => schema.notRequired(),
    }),
  price: yup
    .number()
    .typeError('Price must be a number')
    .moreThan(0, 'Price must be greater than 0')
    .required('Price is required'),
});
