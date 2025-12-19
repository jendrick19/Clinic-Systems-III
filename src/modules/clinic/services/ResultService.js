const { Op } = require('sequelize');
const resultRepository = require('../repositories/ResultRepository');
const { buildPaginationParams, buildPaginationResponse } = require('../../../shared/utils/paginationHelper');
const { NotFoundError, BusinessLogicError, ConflictError } = require('../../../shared/errors/CustomErrors');
const db = require('../../../../database/models');

const SORT_FIELDS = {
  fecha: 'createdAt',
  orden: 'orderId',
  createdAt: 'createdAt',
};

const buildWhere = ({ ordenId, pacienteId }) => {
  const where = {};
  
  if (ordenId) {
    where.orderId = Number(ordenId);
  }
  
  return where;
};

const listResults = async ({
  page,
  limit,
  filters,
  sortBy,
  sortOrder,
}) => {
  const { safePage, safeLimit, offset } = buildPaginationParams(page, limit);
  const orderField = SORT_FIELDS[sortBy] || SORT_FIELDS.createdAt;
  const orderDirection = sortOrder === 'desc' ? 'DESC' : 'ASC';
  const where = buildWhere(filters || {});

  const { count, rows } = await resultRepository.findAndCountAll({
    where,
    offset,
    limit: safeLimit,
    order: [[orderField, orderDirection]],
  });

  return buildPaginationResponse(rows, count, safePage, safeLimit);
};

const getResultById = async (id) => {
  const result = await resultRepository.findById(id);
  
  if (!result) {
    throw new NotFoundError('Resultado no encontrado');
  }

  return result;
};

const getResultsByOrderId = async (orderId) => {
  const order = await db.modules.clinic.Order.findByPk(orderId);
  
  if (!order) {
    throw new NotFoundError('Orden no encontrada');
  }

  const results = await resultRepository.findByOrderId(orderId);
  
  return {
    order,
    results,
    totalResults: results.length
  };
};

const validateOrderExists = async (orderId) => {
  const order = await db.modules.clinic.Order.findByPk(orderId);
  
  if (!order) {
    throw new NotFoundError('Orden no encontrada');
  }

  // Solo se pueden agregar resultados a órdenes en curso o completadas
  if (!['en curso', 'completada'].includes(order.status)) {
    throw new BusinessLogicError(
      `No se pueden agregar resultados a órdenes con estado "${order.status}". ` +
      'La orden debe estar en curso o completada.'
    );
  }

  return order;
};

const validateVersionData = (versionData) => {
  if (!versionData.summary || versionData.summary.trim() === '') {
    throw new BusinessLogicError('El resumen del resultado es requerido');
  }

  if (versionData.summary.length < 10) {
    throw new BusinessLogicError('El resumen debe tener al menos 10 caracteres');
  }

  return true;
};

const createResult = async (resultData) => {
  if (!resultData.orderId) {
    throw new BusinessLogicError('El ID de la orden es requerido');
  }

  if (!resultData.summary) {
    throw new BusinessLogicError('El resumen del resultado es requerido');
  }

  await validateOrderExists(resultData.orderId);
  validateVersionData(resultData);

  const transaction = await db.sequelize.transaction();

  try {
    const result = await resultRepository.createWithVersion(
      resultData,
      transaction
    );

    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const updateResult = async (id, updateData) => {
  const result = await getResultById(id);

  // Validar que la orden sigue permitiendo cambios
  const order = await db.modules.clinic.Order.findByPk(result.orderId);

  if (order.status === 'anulada') {
    throw new BusinessLogicError('No se pueden actualizar resultados de órdenes anuladas');
  }

  validateVersionData(updateData);

  const transaction = await db.sequelize.transaction();

  try {
    await resultRepository.createVersion(result, updateData, transaction);
    await transaction.commit();
    return getResultById(result.id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const deleteResult = async (id) => {
  const result = await getResultById(id);

  // Validar que la orden permite eliminar resultados
  const order = await db.modules.clinic.Order.findByPk(result.orderId);

  if (order.status === 'completada') {
    throw new BusinessLogicError('No se pueden eliminar resultados de órdenes completadas');
  }

  if (order.status === 'anulada') {
    throw new BusinessLogicError('No se pueden eliminar resultados de órdenes anuladas');
  }

  return resultRepository.remove(result);
};

// ==================== VERSION METHODS ====================

const getVersionHistory = async (resultId) => {
  const result = await getResultById(resultId);
  const versions = await resultRepository.findVersionsByResultId(resultId);

  return {
    result,
    versions,
    totalVersions: versions.length
  };
};

const getVersionById = async (versionId) => {
  const version = await resultRepository.findVersionById(versionId);

  if (!version) {
    throw new NotFoundError('Versión de resultado no encontrada');
  }

  return version;
};

const getLatestVersion = async (resultId) => {
  const result = await getResultById(resultId);
  const latestVersion = await resultRepository.findLatestVersion(resultId);

  if (!latestVersion) {
    throw new NotFoundError('No se encontró ninguna versión para este resultado');
  }

  return {
    result,
    version: latestVersion
  };
};

const compareVersions = async (resultId, versionId1, versionId2) => {
  // Convertir a números para asegurar comparación correcta
  const resultIdNum = parseInt(resultId, 10);
  const versionId1Num = parseInt(versionId1, 10);
  const versionId2Num = parseInt(versionId2, 10);

  const result = await getResultById(resultIdNum);

  const version1 = await resultRepository.findVersionById(versionId1Num);
  const version2 = await resultRepository.findVersionById(versionId2Num);

  if (!version1 || !version2) {
    throw new NotFoundError('Una o ambas versiones no fueron encontradas');
  }

  if (version1.resultId !== resultIdNum || version2.resultId !== resultIdNum) {
    throw new BusinessLogicError('Las versiones no pertenecen al mismo resultado');
  }

  return {
    result,
    version1,
    version2,
    changes: {
      summary: version1.summary !== version2.summary,
      fileId: version1.fileId !== version2.fileId,
      date: version1.date.getTime() !== version2.date.getTime()
    }
  };
};

module.exports = {
  listResults,
  getResultById,
  getResultsByOrderId,
  createResult,
  updateResult,
  deleteResult,
  getVersionHistory,
  getVersionById,
  getLatestVersion,
  compareVersions,
  validateOrderExists,
  validateVersionData
};

