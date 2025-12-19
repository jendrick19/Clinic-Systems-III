const { Op } = require('sequelize');
const db = require('../../../../database/models');
const { PeopleAttended } = db.modules.operative;

const findById = async (id) => {
  return PeopleAttended.findByPk(id);
};

const findByDocument = async (documentType, documentId, excludeId = null) => {
  const where = {
    documentType,
    documentId,
  };
  if (excludeId) {
    where.id = {
      [Op.ne]: excludeId,
    };
  }
  return PeopleAttended.findOne({ where });
};

const findAndCountAll = async ({ where, offset, limit, order }) => {
  return PeopleAttended.findAndCountAll({
    where,
    offset,
    limit,
    order,
  });
};

const create = async (payload) => {
  return PeopleAttended.create(payload);
};

const update = async (person, payload) => {
  return person.update(payload);
};

const save = async (person) => {
  return person.save();
};

module.exports = {
  findById,
  findAndCountAll,
  findByDocument,
  create,
  update,
  save,
};
