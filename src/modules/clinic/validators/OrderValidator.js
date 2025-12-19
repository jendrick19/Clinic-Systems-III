const { body, param, query } = require('express-validator');
const {
  handleValidationErrors,
  validateIdParam,
  validatePagination,
  validateSorting,
} = require('../../../shared/validators/CommonValidator');
const db = require('../../../../database/models');
const { Episode } = db.modules.clinic;

const VALID_ORDER_TYPES = ['laboratorio', 'imagen', 'procedimiento'];
const VALID_ORDER_STATUSES = ['emitida', 'autorizada', 'en curso', 'completada', 'anulada'];
const VALID_PRIORITIES = ['normal', 'urgente'];

const normalizeValue = (value) => {
  if (!value || typeof value !== 'string') {
    return value;
  }
  return value.toLowerCase().trim();
};

const checkEpisodeExists = async (value) => {
  const episode = await Episode.findByPk(value);
  if (!episode) {
    throw new Error('El episodio especificado no existe');
  }
  if (episode.status === 'cerrado') {
    throw new Error('No se pueden crear o modificar órdenes en un episodio cerrado');
  }
  return true;
};

// ==================== ORDER VALIDATORS ====================

const validateCreateOrder = [
  body('episodioId')
    .notEmpty().withMessage('El ID del episodio es requerido')
    .isInt({ min: 1 }).withMessage('El ID del episodio debe ser un número entero positivo')
    .custom(checkEpisodeExists),
  body('tipo')
    .notEmpty().withMessage('El tipo de orden es requerido')
    .customSanitizer(normalizeValue)
    .isIn(VALID_ORDER_TYPES).withMessage(`El tipo debe ser uno de los siguientes: ${VALID_ORDER_TYPES.join(', ')}`),
  body('prioridad')
    .optional()
    .customSanitizer(normalizeValue)
    .isIn(VALID_PRIORITIES).withMessage(`La prioridad debe ser: ${VALID_PRIORITIES.join(', ')}`),
  body('estado')
    .optional()
    .customSanitizer(normalizeValue)
    .isIn(VALID_ORDER_STATUSES).withMessage(`El estado debe ser uno de los siguientes: ${VALID_ORDER_STATUSES.join(', ')}`),
  handleValidationErrors,
];

const validateUpdateOrder = [
  validateIdParam(),
  body('episodioId')
    .not().exists().withMessage('No se puede cambiar el episodio de una orden existente'),
  body('tipo')
    .optional()
    .customSanitizer(normalizeValue)
    .isIn(VALID_ORDER_TYPES).withMessage(`El tipo debe ser uno de los siguientes: ${VALID_ORDER_TYPES.join(', ')}`),
  body('prioridad')
    .optional()
    .customSanitizer(normalizeValue)
    .isIn(VALID_PRIORITIES).withMessage(`La prioridad debe ser: ${VALID_PRIORITIES.join(', ')}`),
  body('estado')
    .optional()
    .customSanitizer(normalizeValue)
    .isIn(VALID_ORDER_STATUSES).withMessage(`El estado debe ser uno de los siguientes: ${VALID_ORDER_STATUSES.join(', ')}`),
  handleValidationErrors,
];

const validateOrderId = [
  validateIdParam(),
  handleValidationErrors,
];

const validateListOrders = [
  ...validatePagination(),
  ...validateSorting(['episodio', 'tipo', 'prioridad', 'estado', 'createdAt']),
  query('episodioId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID del episodio debe ser un número entero positivo'),
  query('personaId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de la persona debe ser un número entero positivo'),
  query('estado')
    .optional()
    .customSanitizer((value) => {
      if (Array.isArray(value)) {
        return value.map(v => normalizeValue(v));
      }
      return normalizeValue(value);
    })
    .custom((value) => {
      const estados = Array.isArray(value) ? value : [value];
      const invalidEstados = estados.filter(estado => !VALID_ORDER_STATUSES.includes(estado));
      if (invalidEstados.length > 0) {
        throw new Error(`Estados inválidos: ${invalidEstados.join(', ')}. Estados válidos: ${VALID_ORDER_STATUSES.join(', ')}`);
      }
      return true;
    }),
  query('tipo')
    .optional()
    .customSanitizer((value) => {
      if (Array.isArray(value)) {
        return value.map(v => normalizeValue(v));
      }
      return normalizeValue(value);
    })
    .custom((value) => {
      const tipos = Array.isArray(value) ? value : [value];
      const invalidTipos = tipos.filter(tipo => !VALID_ORDER_TYPES.includes(tipo));
      if (invalidTipos.length > 0) {
        throw new Error(`Tipos inválidos: ${invalidTipos.join(', ')}. Tipos válidos: ${VALID_ORDER_TYPES.join(', ')}`);
      }
      return true;
    }),
  query('prioridad')
    .optional()
    .customSanitizer(normalizeValue)
    .isIn(VALID_PRIORITIES).withMessage(`La prioridad debe ser: ${VALID_PRIORITIES.join(', ')}`),
  handleValidationErrors,
];

// ==================== ORDER ITEM VALIDATORS ====================

const validateCreateOrderItem = [
  validateIdParam(),
  body('codigo')
    .notEmpty().withMessage('El código del item es requerido')
    .isLength({ min: 1, max: 50 }).withMessage('El código debe tener entre 1 y 50 caracteres')
    .trim(),
  body('descripcion')
    .notEmpty().withMessage('La descripción del item es requerida')
    .isLength({ min: 5, max: 500 }).withMessage('La descripción debe tener entre 5 y 500 caracteres')
    .trim(),
  body('indicaciones')
    .optional()
    .isLength({ max: 1000 }).withMessage('Las indicaciones no deben superar los 1000 caracteres')
    .trim(),
  body('prioridad')
    .optional()
    .customSanitizer(normalizeValue)
    .isIn(VALID_PRIORITIES).withMessage(`La prioridad debe ser: ${VALID_PRIORITIES.join(', ')}`),
  handleValidationErrors,
];

const validateUpdateOrderItem = [
  param('itemId')
    .notEmpty().withMessage('El ID del item es requerido')
    .isInt({ min: 1 }).withMessage('El ID del item debe ser un número entero positivo'),
  body('ordenId')
    .not().exists().withMessage('No se puede cambiar la orden de un item existente'),
  body('codigo')
    .optional()
    .isLength({ min: 1, max: 50 }).withMessage('El código debe tener entre 1 y 50 caracteres')
    .trim(),
  body('descripcion')
    .optional()
    .isLength({ min: 5, max: 500 }).withMessage('La descripción debe tener entre 5 y 500 caracteres')
    .trim(),
  body('indicaciones')
    .optional()
    .isLength({ max: 1000 }).withMessage('Las indicaciones no deben superar los 1000 caracteres')
    .trim(),
  body('prioridad')
    .optional()
    .customSanitizer(normalizeValue)
    .isIn(VALID_PRIORITIES).withMessage(`La prioridad debe ser: ${VALID_PRIORITIES.join(', ')}`),
  handleValidationErrors,
];

const validateListOrderItems = [
  validateIdParam(),
  ...validatePagination(),
  ...validateSorting(['createdAt']),
  handleValidationErrors,
];

const validateOrderItemId = [
  param('itemId')
    .notEmpty().withMessage('El ID del item es requerido')
    .isInt({ min: 1 }).withMessage('El ID del item debe ser un número entero positivo'),
  handleValidationErrors,
];

module.exports = {
  validateCreateOrder,
  validateUpdateOrder,
  validateOrderId,
  validateListOrders,
  validateCreateOrderItem,
  validateUpdateOrderItem,
  validateListOrderItems,
  validateOrderItemId,
};

