import * as yup from 'yup';

export const generalServiceDefaultValues = {
  doctor: '',
  name: '',
  clinicFees: '',
};

function optionalMoneyField(label) {
  return yup
    .mixed()
    .transform((value, originalValue) => {
      if (originalValue === '' || originalValue == null) return undefined;
      return value;
    })
    .test('number', `${label} must be a number`, v => {
      if (v === undefined) return true;
      return typeof v === 'number' && !Number.isNaN(v);
    })
    .test('positive', `${label} must be greater than 0`, v => {
      if (v === undefined) return true;
      return v > 0;
    });
}

export const generalServiceSchema = yup.object({
  doctor: yup
    .mixed()
    .required('Doctor is required')
    .test('doctor-id', 'Doctor is required', v => v !== '' && v != null && !Number.isNaN(Number(v))),
  name: yup.string().trim().required('Name is required'),
  clinicFees: optionalMoneyField('Clinic fees'),
});

/** Edit screen does not change doctor; doctor_id is omitted from PATCH. */
export const generalServiceEditSchema = yup.object({
  doctor: yup.mixed().optional(),
  name: yup.string().trim().required('Name is required'),
  clinicFees: optionalMoneyField('Clinic fees'),
});
