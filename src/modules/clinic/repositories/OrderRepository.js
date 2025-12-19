const { Op } = require('sequelize');
const db = require('../../../../database/models');
const { Order, OrderItem } = db.modules.clinic;

const findById = async (id) => {
  return Order.findByPk(id, {
    include: [
      { model: db.modules.clinic.Episode, as: 'episode' },
      { model: db.modules.clinic.OrderItem, as: 'items' },
      { model: db.modules.clinic.Result, as: 'results' }
    ]
  });
};

const findAndCountAll = async ({ where, offset, limit, order, include }) => {
  const defaultInclude = [
    { model: db.modules.clinic.Episode, as: 'episode' },
    { model: db.modules.clinic.OrderItem, as: 'items' },
    { model: db.modules.clinic.Result, as: 'results' }
  ];
  return Order.findAndCountAll({
    where,
    offset,
    limit,
    order: order || [['createdAt', 'DESC']],
    include: include || defaultInclude,
    distinct: true,
  });
};

const findByEpisode = async (episodeId, { offset, limit, order } = {}) => {
  return Order.findAndCountAll({
    where: { episodeId },
    include: [
      { model: db.modules.clinic.Episode, as: 'episode' },
      { model: db.modules.clinic.OrderItem, as: 'items' },
      { model: db.modules.clinic.Result, as: 'results' }
    ],
    offset,
    limit,
    order: order || [['createdAt', 'DESC']],
    distinct: true,
  });
};

const findItemsByOrderId = async (orderId, { offset, limit, order } = {}) => {
  return OrderItem.findAndCountAll({
    where: { orderId },
    offset,
    limit,
    order: order || [['createdAt', 'DESC']],
    distinct: true,
  });
};

const create = async (payload) => {
  return Order.create(payload);
};

const createItem = async (payload) => {
  return OrderItem.create(payload);
};

const update = async (order, payload) => {
  return order.update(payload);
};

const save = async (order) => {
  return order.save();
};

const remove = async (order) => {
  return order.destroy();
};

module.exports = {
  findById,
  findAndCountAll,
  findByEpisode,
  findItemsByOrderId,
  create,
  createItem,
  update,
  save,
  remove,
};

