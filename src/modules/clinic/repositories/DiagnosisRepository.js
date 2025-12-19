const { Op } = require('sequelize');
const db = require('../../../../database/models');
const { Diagnosis } = db.modules.clinic;

const findById = async (id) => {
  return Diagnosis.findByPk(id, {
    include: [
      { model: db.modules.clinic.Episode, as: 'episode' }
    ]
  });
};

const findAndCountAll = async ({ where, offset, limit, order, include }) => {
  const defaultInclude = [
    { model: db.modules.clinic.Episode, as: 'episode' }
  ];
  return Diagnosis.findAndCountAll({
    where,
    offset,
    limit,
    order: order || [['createdAt', 'DESC']],
    include: include || defaultInclude,
    distinct: true,
  });
};

const findByEpisode = async (episodeId, { offset, limit, order } = {}) => {
  return Diagnosis.findAndCountAll({
    where: { episodeId },
    include: [
      { model: db.modules.clinic.Episode, as: 'episode' }
    ],
    offset,
    limit,
    order: order || [['isPrimary', 'DESC'], ['createdAt', 'DESC']],
    distinct: true,
  });
};

const findPrincipalByEpisode = async (episodeId) => {
  return Diagnosis.findOne({
    where: {
      episodeId,
      isPrimary: true
    },
    include: [
      { model: db.modules.clinic.Episode, as: 'episode' }
    ]
  });
};

const hasPrincipalDiagnosis = async (episodeId, excludeDiagnosisId = null) => {
  const where = {
    episodeId,
    isPrimary: true
  };
  if (excludeDiagnosisId) {
    where.id = { [Op.ne]: excludeDiagnosisId };
  }
  const count = await Diagnosis.count({ where });
  return count > 0;
};

const create = async (payload) => {
  return Diagnosis.create(payload);
};

const update = async (diagnosis, payload) => {
  return diagnosis.update(payload);
};

const save = async (diagnosis) => {
  return diagnosis.save();
};

const remove = async (diagnosis) => {
  return diagnosis.destroy();
};

module.exports = {
  findById,
  findAndCountAll,
  findByEpisode,
  findPrincipalByEpisode,
  hasPrincipalDiagnosis,
  create,
  update,
  save,
  remove,
};
