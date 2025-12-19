const { Op } = require('sequelize');
const orderRepository = require('../repositories/OrderRepository');
const orderItemRepository = require('../repositories/OrderItemRepository');
const { buildPaginationParams, buildPaginationResponse } = require('../../../shared/utils/paginationHelper');
const { NotFoundError, BusinessLogicError, ConflictError } = require('../../../shared/errors/CustomErrors');
const db = require('../../../../database/models');

const VALID_ORDER_TYPES = ['laboratorio', 'imagen', 'procedimiento'];
const VALID_ORDER_STATUSES = ['emitida', 'autorizada', 'en curso', 'completada', 'anulada'];
const VALID_PRIORITIES = ['normal', 'urgente'];

// Flujo de estados permitido: Emitida → Autorizada → En curso → Completada
const ALLOWED_ORDER_TRANSITIONS = {
  'emitida': ['autorizada', 'anulada'],
  'autorizada': ['en curso', 'anulada'],
  'en curso': ['completada', 'anulada'],
  'completada': [],
  'anulada': [] // Una orden anulada no puede cambiar de estado
};

const SORT_FIELDS = {
  episodio: 'episodeId',
  tipo: 'type',
  prioridad: 'priority',
  estado: 'status',
  createdAt: 'createdAt',
};

const normalizeStatus = (status) => {
  if (typeof status === 'string') {
    return status.toLowerCase().trim();
  }
  return status;
};

const normalizeType = (type) => {
  if (typeof type === 'string') {
    return type.toLowerCase().trim();
  }
  return type;
};

const normalizePriority = (priority) => {
  if (typeof priority === 'string') {
    return priority.toLowerCase().trim();
  }
  return priority;
};

const validateOrderType = (type) => {
  const normalizedType = normalizeType(type);
  if (!VALID_ORDER_TYPES.includes(normalizedType)) {
    throw new BusinessLogicError(
      `Tipo de orden "${type}" no es válido. Tipos válidos: ${VALID_ORDER_TYPES.join(', ')}`
    );
  }
  return normalizedType;
};

const validatePriority = (priority) => {
  const normalizedPriority = normalizePriority(priority);
  if (!VALID_PRIORITIES.includes(normalizedPriority)) {
    throw new BusinessLogicError(
      `Prioridad "${priority}" no es válida. Prioridades válidas: ${VALID_PRIORITIES.join(', ')}`
    );
  }
  return normalizedPriority;
};

const validateOrderStatus = (status) => {
  const normalizedStatus = normalizeStatus(status);
  if (!VALID_ORDER_STATUSES.includes(normalizedStatus)) {
    throw new BusinessLogicError(
      `Estado de orden "${status}" no es válido. Estados válidos: ${VALID_ORDER_STATUSES.join(', ')}`
    );
  }
  return normalizedStatus;
};

const validateStatusTransition = (currentStatus, newStatus) => {
  const normalizedCurrentStatus = normalizeStatus(currentStatus);
  const normalizedNewStatus = normalizeStatus(newStatus);

  if (normalizedCurrentStatus === normalizedNewStatus) {
    return true;
  }

  const allowedTransitions = ALLOWED_ORDER_TRANSITIONS[normalizedCurrentStatus] || [];
  
  if (!allowedTransitions.includes(normalizedNewStatus)) {
    throw new BusinessLogicError(
      `No se puede cambiar el estado de "${currentStatus}" a "${newStatus}". ` +
      `Transiciones permitidas: ${allowedTransitions.length > 0 ? allowedTransitions.join(', ') : 'ninguna (estado final)'}`
    );
  }

  return true;
};

const validateEpisodeExists = async (episodeId) => {
  const episode = await db.modules.clinic.Episode.findByPk(episodeId);
  
  if (!episode) {
    throw new NotFoundError('Episodio no encontrado');
  }
  
  if (episode.status === 'cerrado') {
    throw new BusinessLogicError('No se pueden crear o modificar órdenes en un episodio cerrado');
  }

  return episode;
};

const buildWhere = ({ episodioId, personaId, estado, tipo, prioridad }) => {
  const where = {};

  if (episodioId) {
    where.episodeId = Number(episodioId);
  }

  if (estado) {
    if (Array.isArray(estado)) {
      where.status = { [Op.in]: estado.map(normalizeStatus) };
    } else {
      where.status = normalizeStatus(estado);
    }
  }

  if (tipo) {
    if (Array.isArray(tipo)) {
      where.type = { [Op.in]: tipo.map(normalizeType) };
    } else {
      where.type = normalizeType(tipo);
    }
  }

  if (prioridad) {
    where.priority = normalizePriority(prioridad);
  }

  return where;
};

const listOrders = async ({
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

  const { count, rows } = await orderRepository.findAndCountAll({
    where,
    offset,
    limit: safeLimit,
    order: [[orderField, orderDirection]],
  });

  return buildPaginationResponse(rows, count, safePage, safeLimit);
};

const getOrderById = async (id) => {
  const order = await orderRepository.findById(id);
  
  if (!order) {
    throw new NotFoundError('Orden no encontrada');
  }

  return order;
};

const getOrdersByEpisode = async (episodeId, { page, limit, sortBy, sortOrder }) => {
  const { safePage, safeLimit, offset } = buildPaginationParams(page, limit);
  const orderField = SORT_FIELDS[sortBy] || SORT_FIELDS.createdAt;
  const orderDirection = sortOrder === 'desc' ? 'DESC' : 'ASC';

  const { count, rows } = await orderRepository.findByEpisode(episodeId, {
    offset,
    limit: safeLimit,
    order: [[orderField, orderDirection]]
  });

  return buildPaginationResponse(rows, count, safePage, safeLimit);
};

const createOrder = async (orderData) => {
  if (!orderData.episodeId) {
    throw new BusinessLogicError('El ID del episodio es requerido');
  }

  await validateEpisodeExists(orderData.episodeId);

  if (!orderData.type) {
    throw new BusinessLogicError('El tipo de orden es requerido');
  }

  orderData.type = validateOrderType(orderData.type);

  if (orderData.priority) {
    orderData.priority = validatePriority(orderData.priority);
  } else {
    orderData.priority = 'normal';
  }

  // Estado por defecto: emitida
  if (!orderData.status) {
    orderData.status = 'emitida';
  } else {
    orderData.status = validateOrderStatus(orderData.status);
  }

  return orderRepository.create(orderData);
};

const updateOrder = async (id, payload) => {
  const order = await getOrderById(id);

  await validateEpisodeExists(order.episodeId);

  if (payload.episodeId !== undefined && payload.episodeId !== order.episodeId) {
    throw new BusinessLogicError('No se puede cambiar el episodio de una orden existente');
  }

  if (payload.type !== undefined && payload.type !== order.type) {
    payload.type = validateOrderType(payload.type);
  }

  if (payload.priority !== undefined && payload.priority !== order.priority) {
    payload.priority = validatePriority(payload.priority);
  }

  if (payload.status !== undefined) {
    payload.status = validateOrderStatus(payload.status);
    if (payload.status !== order.status) {
      validateStatusTransition(order.status, payload.status);
    }
  }

  return orderRepository.update(order, payload);
};

const deleteOrder = async (id) => {
  const order = await getOrderById(id);
  await validateEpisodeExists(order.episodeId);
  return orderRepository.remove(order);
};

// ==================== ORDER ITEMS ====================

const getItemsByOrderId = async (orderId, { page, limit, sortBy, sortOrder }) => {
  // Verificar que la orden exista
  await getOrderById(orderId);

  const { safePage, safeLimit, offset } = buildPaginationParams(page, limit);
  const orderDirection = sortOrder === 'desc' ? 'DESC' : 'ASC';

  const { count, rows } = await orderItemRepository.findByOrderId(orderId, {
    offset,
    limit: safeLimit,
    order: [['createdAt', orderDirection]]
  });

  return buildPaginationResponse(rows, count, safePage, safeLimit);
};

const createOrderItem = async (orderId, itemData) => {
  // Verificar que la orden exista
  const order = await getOrderById(orderId);

  if (order.status === 'completada' || order.status === 'anulada') {
    throw new BusinessLogicError(
      `No se pueden agregar items a una orden con estado "${order.status}"`
    );
  }

  if (!itemData.code) {
    throw new BusinessLogicError('El código del item es requerido');
  }

  if (!itemData.description) {
    throw new BusinessLogicError('La descripción del item es requerida');
  }

  itemData.orderId = orderId;

  if (itemData.priority) {
    itemData.priority = validatePriority(itemData.priority);
  } else {
    itemData.priority = 'normal';
  }

  if (!itemData.status) {
    itemData.status = 'pendiente';
  }

  return orderItemRepository.create(itemData);
};

const updateOrderItem = async (itemId, payload) => {
  const item = await orderItemRepository.findById(itemId);

  if (!item) {
    throw new NotFoundError('Item de orden no encontrado');
  }

  // Verificar que la orden no esté completada o anulada
  const order = await getOrderById(item.orderId);

  if (order.status === 'completada' || order.status === 'anulada') {
    throw new BusinessLogicError(
      `No se pueden modificar items de una orden con estado "${order.status}"`
    );
  }

  if (payload.orderId !== undefined && payload.orderId !== item.orderId) {
    throw new BusinessLogicError('No se puede cambiar la orden de un item existente');
  }

  if (payload.priority !== undefined) {
    payload.priority = validatePriority(payload.priority);
  }

  return orderItemRepository.update(item, payload);
};

const deleteOrderItem = async (itemId) => {
  const item = await orderItemRepository.findById(itemId);

  if (!item) {
    throw new NotFoundError('Item de orden no encontrado');
  }

  const order = await getOrderById(item.orderId);

  if (order.status === 'completada' || order.status === 'anulada') {
    throw new BusinessLogicError(
      `No se pueden eliminar items de una orden con estado "${order.status}"`
    );
  }

  return orderItemRepository.remove(item);
};

module.exports = {
  listOrders,
  getOrderById,
  getOrdersByEpisode,
  createOrder,
  updateOrder,
  deleteOrder,
  getItemsByOrderId,
  createOrderItem,
  updateOrderItem,
  deleteOrderItem,
  validateStatusTransition,
  validateOrderType,
  validatePriority,
  normalizeStatus,
  normalizeType,
  normalizePriority,
};

