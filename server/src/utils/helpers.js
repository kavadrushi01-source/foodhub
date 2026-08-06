import config from '../config/index.js';

/**
 * Currency helper. Uses currency symbol from config.
 */
export const formatCurrency = (amount) => {
  const value = Number(amount || 0).toFixed(2);
  return `${config.payments.currencySymbol}${value}`;
};

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/**
 * Paginate a Mongoose query using page/limit.
 * Returns a query cursor (await later) plus pagination meta.
 */
export const paginate = async (queryBuilder, { page = 1, limit = 12 } = {}) => {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));
  const skip = (p - 1) * l;

  const [items, total] = await Promise.all([
    queryBuilder.skip(skip).limit(l).exec(),
    queryBuilder.clone().countDocuments(),
  ]);

  return {
    items,
    meta: {
      page: p,
      limit: l,
      total,
      totalPages: Math.ceil(total / l) || 0,
      hasNext: p * l < total,
      hasPrev: p > 1,
    },
  };
};

export default { formatCurrency, round2, paginate };
