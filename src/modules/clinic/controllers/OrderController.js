const {
  listOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  getItemsByOrderId,
  createOrderItem,
  updateOrderItem,
  deleteOrderItem,
} = require('../services/OrderService');

// ==================== MAPPERS ====================

const mapOrderModelToResponse = (order) => {
  if (!order) return null;
  return {
    id: order.id,
    episodio: order.episode
      ? {
          id: order.episode.id,
          tipo: order.episode.type,
          paciente: order.episode.peopleAttended
            ? {
                id: order.episode.peopleAttended.id,
                nombres: order.episode.peopleAttended.names,
                apellidos: order.episode.peopleAttended.surNames,
              }
            : undefined,
        }
      : undefined,
    tipo: order.type,
    prioridad: order.priority,
    estado: order.status,
    items: order.items
      ? order.items.map(item => ({
          id: item.id,
          codigo: item.code,
          descripcion: item.description,
          indicaciones: item.indications,
          prioridad: item.priority,
          estado: item.status,
          createdAt: item.createdAt,
        }))
      : undefined,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
};

const mapOrderItemModelToResponse = (item) => {
  if (!item) return null;
  return {
    id: item.id,
    ordenId: item.orderId,
    codigo: item.code,
    descripcion: item.description,
    indicaciones: item.indications,
    prioridad: item.priority,
    estado: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

const mapRequestToCreateOrder = (body) => {
  const payload = {
    episodeId: body.episodioId,
    type: body.tipo,
  };
  if (body.prioridad !== undefined) payload.priority = body.prioridad;
  if (body.estado !== undefined) payload.status = body.estado;
  return payload;
};

const mapRequestToUpdateOrder = (body) => {
  const payload = {};
  if (body.tipo !== undefined) payload.type = body.tipo;
  if (body.prioridad !== undefined) payload.priority = body.prioridad;
  if (body.estado !== undefined) payload.status = body.estado;
  return payload;
};

const mapRequestToCreateOrderItem = (body) => {
  const payload = {
    code: body.codigo,
    description: body.descripcion,
  };
  if (body.indicaciones !== undefined) payload.indications = body.indicaciones;
  if (body.prioridad !== undefined) payload.priority = body.prioridad;
  return payload;
};

const mapRequestToUpdateOrderItem = (body) => {
  const payload = {};
  if (body.codigo !== undefined) payload.code = body.codigo;
  if (body.descripcion !== undefined) payload.description = body.descripcion;
  if (body.indicaciones !== undefined) payload.indications = body.indicaciones;
  if (body.prioridad !== undefined) payload.priority = body.prioridad;
  if (body.estado !== undefined) payload.status = body.estado;
  return payload;
};

// ==================== ORDER HANDLERS ====================

const listOrdersHandler = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      episodioId,
      personaId,
      estado,
      tipo,
      prioridad,
    } = req.query;
    const result = await listOrders({
      page,
      limit,
      sortBy,
      sortOrder,
      filters: {
        episodioId,
        personaId,
        estado,
        tipo,
        prioridad,
      },
    });
    return res.json({
      codigo: 200,
      mensaje: 'Lista de órdenes obtenida exitosamente',
      data: result.rows.map(mapOrderModelToResponse),
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
};

const getOrderHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await getOrderById(id);
    return res.json({
      codigo: 200,
      mensaje: 'Orden encontrada',
      data: mapOrderModelToResponse(order),
    });
  } catch (error) {
    return next(error);
  }
};

const createOrderHandler = async (req, res, next) => {
  try {
    const payload = mapRequestToCreateOrder(req.body);
    const order = await createOrder(payload);
    return res.status(201).json({
      codigo: 201,
      mensaje: 'Orden creada exitosamente',
      data: mapOrderModelToResponse(order),
    });
  } catch (error) {
    return next(error);
  }
};

const updateOrderHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = mapRequestToUpdateOrder(req.body);
    const updated = await updateOrder(id, payload);
    return res.json({
      codigo: 200,
      mensaje: 'Orden actualizada exitosamente',
      data: mapOrderModelToResponse(updated),
    });
  } catch (error) {
    return next(error);
  }
};

const deleteOrderHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteOrder(id);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

// ==================== ORDER ITEM HANDLERS ====================

const listOrderItemsHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;
    const result = await getItemsByOrderId(id, {
      page,
      limit,
      sortBy,
      sortOrder,
    });
    return res.json({
      codigo: 200,
      mensaje: 'Lista de items obtenida exitosamente',
      data: result.rows.map(mapOrderItemModelToResponse),
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
};

const createOrderItemHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = mapRequestToCreateOrderItem(req.body);
    const item = await createOrderItem(id, payload);
    return res.status(201).json({
      codigo: 201,
      mensaje: 'Item agregado exitosamente',
      data: mapOrderItemModelToResponse(item),
    });
  } catch (error) {
    return next(error);
  }
};

const updateOrderItemHandler = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const payload = mapRequestToUpdateOrderItem(req.body);
    const updated = await updateOrderItem(itemId, payload);
    return res.json({
      codigo: 200,
      mensaje: 'Item actualizado exitosamente',
      data: mapOrderItemModelToResponse(updated),
    });
  } catch (error) {
    return next(error);
  }
};

const deleteOrderItemHandler = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    await deleteOrderItem(itemId);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listOrdersHandler,
  getOrderHandler,
  createOrderHandler,
  updateOrderHandler,
  deleteOrderHandler,
  listOrderItemsHandler,
  createOrderItemHandler,
  updateOrderItemHandler,
  deleteOrderItemHandler,
};

