import { z } from 'zod';
import { ValidationError } from '../utils/errors.js';

/**
 * Validate against a zod schema. source: 'body' | 'query' | 'params'.
 * On success, the validated (and coerced/transformed) data replaces req[source].
 */
export const validate = (schema, source = 'body') => (req, res, next) => {
  try {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      return next(new ValidationError('Validation failed', details));
    }
    req[source] = result.data;
    next();
  } catch (err) {
    next(err);
  }
};

export default validate;
