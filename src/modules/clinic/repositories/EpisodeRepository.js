const { Op } = require('sequelize');
const db = require('../../../../database/models');
const { Episode } = db.modules.clinic;

const findById = async (id) => {
  return Episode.findByPk(id, {
    include: [
      { model: db.modules.operative.PeopleAttended, as: 'peopleAttended' },
      { model: db.modules.clinic.ClinicalNote, as: 'clinicalNotes' },
      { model: db.modules.clinic.Diagnosis, as: 'diagnosis' }
    ]
  });
};

const findAndCountAll = async ({ where, offset, limit, order, include }) => {
  const defaultInclude = [
    { model: db.modules.operative.PeopleAttended, as: 'peopleAttended' },
    { model: db.modules.clinic.ClinicalNote, as: 'clinicalNotes' },
    { model: db.modules.clinic.Diagnosis, as: 'diagnosis' }
  ];
  return Episode.findAndCountAll({
    where,
    offset,
    limit,
    order,
    include: include || defaultInclude,
    distinct: true,
  });
};

const create = async (payload) => {
  return Episode.create(payload);
};

const update = async (episode, payload) => {
  return episode.update(payload);
};

const save = async (episode) => {
  return episode.save();
};

module.exports = {
  findById,
  findAndCountAll,
  create,
  update,
  save,
};
