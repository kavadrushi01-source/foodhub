/**
 * Standardized API response helpers attached to res via middleware,
 * but also usable directly. Usage: res.success(data, message, status)
 */
export class ApiResponse {
  constructor({ status = 200, message = 'Success', data = null, meta = null }) {
    this.success = status < 400;
    this.status = status;
    this.message = message;
    if (data !== null) this.data = data;
    if (meta !== null) this.meta = meta;
  }
}

export const sendSuccess = (res, data = null, message = 'Success', status = 200, meta = null) => {
  const body = { success: true, status, message };
  if (data !== null) body.data = data;
  if (meta !== null) body.meta = meta;
  return res.status(status).json(body);
};

export const sendError = (res, message = 'Something went wrong', status = 500, code = 'ERROR', details = null) => {
  const body = { success: false, status, code, message };
  if (details !== null) body.details = details;
  return res.status(status).json(body);
};
