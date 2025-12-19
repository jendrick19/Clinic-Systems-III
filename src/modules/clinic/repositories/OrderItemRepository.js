const { Op } = require('sequelize');
const db = require('../../../../database/models');
const { OrderItem } = db.modules.clinic;

const findById = async (id) => {
  return OrderItem.findByPk(id, {
    include: [
      { model: db.modules.clinic.Order, as: 'order' }
    ]
  });
};

const findAndCountAll = async ({ where, offset, limit, order, include }) => {
  const defaultInclude = [
    { model: db.modules.clinic.Order, as: 'order' }
  ];
  return OrderItem.findAndCountAll({
    where,
    offset,
    limit,
    order: order || [['createdAt', 'DESC']],
    include: include || defaultInclude,
    distinct: true,
  });
};

const findByOrderId = async (orderId, { offset, limit, order } = {}) => {
  return OrderItem.findAndCountAll({
    where: { orderId },
    offset,
    limit,
    order: order || [['createdAt', 'DESC']],
    distinct: true,
  });
};

const create = async (payload) => {
  return OrderItem.create(payload);
};

const update = async (orderItem, payload) => {
  return orderItem.update(payload);
};

const save = async (orderItem) => {
  return orderItem.save();
};

const remove = async (orderItem) => {
  return orderItem.destroy();
};

module.exports = {
  findById,
  findAndCountAll,
  findByOrderId,
  create,
  update,
  save,
  remove,
};

