export const SMS_SEND_URL = '/sms/send';

export function buildSmsSendPayload(patientIds, message) {
  const ids = (Array.isArray(patientIds) ? patientIds : [])
    .map(id => Number(id))
    .filter(n => Number.isFinite(n) && n > 0);

  const text = String(message ?? '').trim();
  if (!ids.length) {
    const err = new Error('Select at least one patient.');
    err.validationMessage = 'Select at least one patient.';
    throw err;
  }
  if (!text) {
    const err = new Error('Enter a message.');
    err.validationMessage = 'Enter a message.';
    throw err;
  }

  return { patient_ids: ids, message: text };
}
