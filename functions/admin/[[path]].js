import { handleAdminRequest } from './_shared.js';

export function onRequest(context) {
  return handleAdminRequest(context);
}
