const { Router } = require('express');
const {
  listOrdersHandler,
  getOrderHandler,
  createOrderHandler,
  updateOrderHandler,
  deleteOrderHandler,
  listOrderItemsHandler,
  createOrderItemHandler,
  updateOrderItemHandler,
  deleteOrderItemHandler,
} = require('../controllers/OrderController');
const {
  validateCreateOrder,
  validateUpdateOrder,
  validateOrderId,
  validateListOrders,
  validateCreateOrderItem,
  validateUpdateOrderItem,
  validateListOrderItems,
  validateOrderItemId,
} = require('../validators/OrderValidator');

const router = Router();

// ==================== ORDER ROUTES ====================
router.get('/', validateListOrders, listOrdersHandler);
router.post('/', validateCreateOrder, createOrderHandler);
router.get('/:id', validateOrderId, getOrderHandler);
router.patch('/:id', validateUpdateOrder, updateOrderHandler);
router.delete('/:id', validateOrderId, deleteOrderHandler);

// ==================== ORDER ITEMS ROUTES ====================
router.get('/:id/items', validateListOrderItems, listOrderItemsHandler);
router.post('/:id/items', validateCreateOrderItem, createOrderItemHandler);
router.patch('/:id/items/:itemId', validateUpdateOrderItem, updateOrderItemHandler);
router.delete('/:id/items/:itemId', validateOrderItemId, deleteOrderItemHandler);

module.exports = router;

