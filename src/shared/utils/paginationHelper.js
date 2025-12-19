const buildPaginationParams = (page, limit, maxLimit = 100, defaultLimit = 20) => {
  
  const safePage = Number.isNaN(Number(page)) || Number(page) < 1 ? 1 : Number(page);
  
  const safeLimit = Number.isNaN(Number(limit)) || Number(limit) < 1 
    ? defaultLimit 
    : Math.min(Number(limit), maxLimit);
  const offset = (safePage - 1) * safeLimit;
  return { safePage, safeLimit, offset };
};

const buildPaginationResponse = (rows, count, page, limit) => {
  return {
    rows,
    count,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit) || 0,
    },
  };
};

module.exports = {
  buildPaginationParams,
  buildPaginationResponse,
};
