const { body, param, query } = require('express-validator');
const {
  handleValidationErrors,
  validateIdParam,
  validatePagination,
  validateSorting,
} = require('../../../shared/validators/CommonValidator');

const validateCreate = [
  body('ordenId')
    .notEmpty().withMessage('El ID de la orden es requerido')
    .isInt({ min: 1 }).withMessage('El ID de la orden debe ser un número entero positivo'),
  body('fecha')
    .optional()
    .isISO8601().withMessage('La fecha debe ser una fecha válida (formato ISO 8601)')
    .toDate(),
  body('resumen')
    .notEmpty().withMessage('El resumen es requerido')
    .isLength({ min: 10, max: 5000 }).withMessage('El resumen debe tener entre 10 y 5000 caracteres')
    .trim(),
  body('archivoId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID del archivo debe ser un número entero positivo'),
  handleValidationErrors,
];

const validateUpdate = [
  validateIdParam(),
  body('resumen')
    .notEmpty().withMessage('El resumen es requerido')
    .isLength({ min: 10, max: 5000 }).withMessage('El resumen debe tener entre 10 y 5000 caracteres')
    .trim(),
  body('archivoId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID del archivo debe ser un número entero positivo'),
  handleValidationErrors,
];

const validateId = [
  validateIdParam(),
  handleValidationErrors,
];

const validateOrderId = [
  param('ordenId')
    .notEmpty().withMessage('El ID de la orden es requerido')
    .isInt({ min: 1 }).withMessage('El ID de la orden debe ser un número entero positivo'),
  handleValidationErrors,
];

const validateList = [
  ...validatePagination(),
  ...validateSorting(['fecha', 'orden', 'createdAt']),
  query('ordenId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de la orden debe ser un número entero positivo'),
  query('pacienteId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID del paciente debe ser un número entero positivo'),
  handleValidationErrors,
];

const validateVersionId = [
  param('versionId')
    .notEmpty().withMessage('El ID de la versión es requerido')
    .isInt({ min: 1 }).withMessage('El ID de la versión debe ser un número entero positivo'),
  handleValidationErrors,
];

const validateCompareVersions = [
  validateIdParam(),
  query('version1')
    .notEmpty().withMessage('El ID de la primera versión es requerido')
    .isInt({ min: 1 }).withMessage('El ID de la primera versión debe ser un número entero positivo'),
  query('version2')
    .notEmpty().withMessage('El ID de la segunda versión es requerido')
    .isInt({ min: 1 }).withMessage('El ID de la segunda versión debe ser un número entero positivo')
    .custom((value, { req }) => {
      if (req.query.version1 && value && req.query.version1 === value) {
        throw new Error('Las versiones a comparar deben ser diferentes');
      }
      return true;
    }),
  handleValidationErrors,
];

module.exports = {
  validateCreate,
  validateUpdate,
  validateId,
  validateOrderId,
  validateList,
  validateVersionId,
  validateCompareVersions,
};

