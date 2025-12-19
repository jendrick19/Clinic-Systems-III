const { Op } = require('sequelize');
const buildDateRangeFilter = (fieldName, fechaDesde, fechaHasta) => {
  if (!fechaDesde && !fechaHasta) {
    return null;
  }
  const filter = {};
  if (fechaDesde) {
    filter[Op.gte] = new Date(fechaDesde);
  }
  if (fechaHasta) {
    const endDate = new Date(fechaHasta);
    endDate.setDate(endDate.getDate() + 1);
    filter[Op.lt] = endDate;
  }
  return filter;
};

const addDateRangeToWhere = (where, fieldName, fechaDesde, fechaHasta) => {
  const dateFilter = buildDateRangeFilter(fieldName, fechaDesde, fechaHasta);
  if (dateFilter) {
    where[fieldName] = dateFilter;
  }
};

module.exports = {
  buildDateRangeFilter,
  addDateRangeToWhere,
};
