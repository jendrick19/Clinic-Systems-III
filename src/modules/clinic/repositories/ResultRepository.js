const { Op } = require('sequelize');
const db = require('../../../../database/models');
const { Result, ResultVersion } = db.modules.clinic;

const findById = async (id) => {
  return Result.findByPk(id, {
    include: [
      { model: db.modules.clinic.Order, as: 'order' },
      { model: db.modules.clinic.ResultVersion, as: 'versions' }
    ]
  });
};

const findAndCountAll = async ({ where, offset, limit, order, include }) => {
  const defaultInclude = [
    { model: db.modules.clinic.Order, as: 'order' },
    { model: db.modules.clinic.ResultVersion, as: 'versions' }
  ];
  return Result.findAndCountAll({
    where,
    offset,
    limit,
    order: order || [['createdAt', 'DESC']],
    include: include || defaultInclude,
    distinct: true,
  });
};

const findByOrderId = async (orderId) => {
  return Result.findAll({
    where: { orderId },
    include: [
      { model: db.modules.clinic.Order, as: 'order' },
      { 
        model: db.modules.clinic.ResultVersion, 
        as: 'versions',
        order: [['version', 'DESC']]
      }
    ],
    order: [['createdAt', 'DESC']]
  });
};

const createWithVersion = async (resultData, transaction = null) => {
  const result = await Result.create({
    ...resultData,
    version: 1,
    date: resultData.date || new Date()
  }, { transaction });
  
  // Crear versión inicial en el historial
  await ResultVersion.create({
    resultId: result.id,
    date: result.date,
    summary: result.summary,
    fileId: result.fileId,
    version: 1
  }, { transaction });
  
  return findById(result.id);
};

const create = async (resultData) => {
  return Result.create(resultData);
};

const update = async (result, payload) => {
  return result.update(payload);
};

const save = async (result) => {
  return result.save();
};

const remove = async (result) => {
  return result.destroy();
};

// ==================== VERSION METHODS ====================

const findVersionById = async (versionId) => {
  return ResultVersion.findByPk(versionId, {
    include: [
      { 
        model: db.modules.clinic.Result, 
        as: 'result',
        include: [
          { model: db.modules.clinic.Order, as: 'order' }
        ]
      }
    ]
  });
};

const findVersionsByResultId = async (resultId) => {
  return ResultVersion.findAll({
    where: { resultId },
    order: [['version', 'DESC'], ['date', 'DESC']]
  });
};

const findLatestVersion = async (resultId) => {
  return ResultVersion.findOne({
    where: { resultId },
    order: [['version', 'DESC'], ['date', 'DESC']]
  });
};

const getNextVersionNumber = async (resultId) => {
  const latestVersion = await ResultVersion.findOne({
    where: { resultId },
    order: [['version', 'DESC']],
    attributes: ['version']
  });
  
  return latestVersion ? latestVersion.version + 1 : 1;
};

const createVersion = async (result, versionData, transaction = null) => {
  const nextVersion = await getNextVersionNumber(result.id);
  
  // Actualizar el resultado principal
  await result.update({
    ...versionData,
    version: nextVersion,
    date: new Date()
  }, { transaction });
  
  // Crear versión en el historial
  return ResultVersion.create({
    resultId: result.id,
    date: result.date,
    summary: versionData.summary,
    fileId: versionData.fileId || result.fileId,
    version: nextVersion
  }, { transaction });
};

const compareVersions = async (versionId1, versionId2) => {
  const [version1, version2] = await Promise.all([
    findVersionById(versionId1),
    findVersionById(versionId2)
  ]);
  
  return {
    version1,
    version2
  };
};

module.exports = {
  findById,
  findAndCountAll,
  findByOrderId,
  createWithVersion,
  create,
  update,
  save,
  remove,
  findVersionById,
  findVersionsByResultId,
  findLatestVersion,
  getNextVersionNumber,
  createVersion,
  compareVersions,
};

