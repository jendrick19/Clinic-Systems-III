const { Op } = require('sequelize');
const db = require('../../../../database/models');
const { Consent } = db.modules.clinic;

const findById = async (id) => {
  return Consent.findByPk(id, {
    include: [
      { model: db.modules.operative.PeopleAttended, as: 'peopleAttended' }
    ]
  });
};

const findAndCountAll = async ({ where, offset, limit, order, include }) => {
  const defaultInclude = [
    { model: db.modules.operative.PeopleAttended, as: 'peopleAttended' }
  ];
  return Consent.findAndCountAll({
    where,
    offset,
    limit,
    order: order || [['consentDate', 'DESC']],
    include: include || defaultInclude,
    distinct: true,
  });
};

const create = async (payload) => {
  return Consent.create(payload);
};

const update = async (consent, payload) => {
  return consent.update(payload);
};

const remove = async (consent) => {
  return consent.destroy();
};

module.exports = {
  findById,
  findAndCountAll,
  create,
  update,
  remove,
};
