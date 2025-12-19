const { body, param, query } = require('express-validator');
const {
  handleValidationErrors,
  validatePhone,
  validateStatus,
  validateIdParam,
  validatePagination,
  validateSorting,
  validateStatusQuery,
} = require('../../../shared/validators/CommonValidator');

const ALLOWED_TYPES = ['sede', 'consultorio', 'servicio'];

const checkNameUniqueness = async (value, { req }) => {
  const { Op } = require('sequelize');
  const db = require('../../../../database/models');
  const { CareUnit } = db.modules.operative;
  const where = {
    name: value,
  };
  if (req.params?.id) {
    where.id = { [Op.ne]: req.params.id };
  }
  const existingCareUnit = await CareUnit.findOne({ where });
  if (existingCareUnit) {
    throw new Error('El nombre de la unidad de atención ya está registrado');
  }
  return true;
};

const validateCreate = [
  body('nombre')
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .trim()
    .custom(checkNameUniqueness),
  body('tipo')
    .notEmpty().withMessage('El tipo es requerido')
    .isIn(ALLOWED_TYPES).withMessage(`El tipo debe ser uno de los siguientes: ${ALLOWED_TYPES.join(', ')}`),
  body('direccion')
    .optional()
    .isLength({ min: 5, max: 200 }).withMessage('La dirección debe tener entre 5 y 200 caracteres')
    .trim(),
  validatePhone('telefono'),
  body('horarioAtencion')
    .optional()
    .isLength({ max: 100 }).withMessage('El horario de atención no puede superar los 100 caracteres')
    .trim(),
  validateStatus('estado'),
  handleValidationErrors,
];

const validateUpdate = [
  validateIdParam(),
  body('nombre')
    .optional()
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .trim()
    .custom(checkNameUniqueness),
  body('tipo')
    .optional()
    .isIn(ALLOWED_TYPES).withMessage(`El tipo debe ser uno de los siguientes: ${ALLOWED_TYPES.join(', ')}`),
  body('direccion')
    .optional()
    .isLength({ min: 5, max: 200 }).withMessage('La dirección debe tener entre 5 y 200 caracteres')
    .trim(),
  validatePhone('telefono'),
  body('horarioAtencion')
    .optional()
    .isLength({ max: 100 }).withMessage('El horario de atención no puede superar los 100 caracteres')
    .trim(),
  validateStatus('estado'),
  handleValidationErrors,
];

const validateId = [
  validateIdParam(),
  handleValidationErrors,
];

const validateList = [
  ...validatePagination(),
  ...validateSorting(['nombre', 'tipo', 'estado', 'direccion']),
  query('nombre')
    .optional()
    .isLength({ min: 1, max: 100 }).withMessage('El nombre debe tener entre 1 y 100 caracteres'),
  query('tipo')
    .optional()
    .isIn(ALLOWED_TYPES).withMessage(`El tipo debe ser uno de los siguientes: ${ALLOWED_TYPES.join(', ')}`),
  query('direccion')
    .optional()
    .isLength({ min: 1, max: 200 }).withMessage('La dirección debe tener entre 1 y 200 caracteres'),
  validateStatusQuery(),
  handleValidationErrors,
];
module.exports = {
  validateCreate,
  validateUpdate,
  validateId,
  validateList,
};
