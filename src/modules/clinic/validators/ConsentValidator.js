const { body, param, query } = require('express-validator');
const {
  handleValidationErrors,
  validateIdParam,
  validatePagination,
  validateSorting,
} = require('../../../shared/validators/CommonValidator');
const db = require('../../../../database/models');
const { PeopleAttended } = db.modules.operative;

const VALID_METHODS = ['firma digital', 'aceptación verbal con registro'];

const normalizeMethod = (value) => {
  if (!value || typeof value !== 'string') {
    return value;
  }
  return value.toLowerCase().trim();
};

const checkPeopleExists = async (value) => {
  const people = await PeopleAttended.findByPk(value);
  if (!people) {
    throw new Error('La persona especificada no existe');
  }
  return true;
};

const validateCreate = [
  body('personaId')
    .notEmpty().withMessage('El ID de la persona es requerido')
    .isInt({ min: 1 }).withMessage('El ID de la persona debe ser un número entero positivo')
    .custom(checkPeopleExists),
  body('tipoProcedimiento')
    .notEmpty().withMessage('El tipo de procedimiento es requerido')
    .isLength({ min: 3, max: 255 }).withMessage('El tipo de procedimiento debe tener entre 3 y 255 caracteres')
    .trim(),
  body('metodo')
    .notEmpty().withMessage('El método de consentimiento es requerido')
    .customSanitizer(normalizeMethod)
    .isIn(VALID_METHODS).withMessage(`El método debe ser uno de los siguientes: ${VALID_METHODS.join(', ')}`),
  body('fechaConsentimiento')
    .optional()
    .isISO8601().withMessage('La fecha de consentimiento debe ser una fecha válida (formato ISO 8601)')
    .toDate(),
  body('archivoId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID del archivo debe ser un número entero positivo'),
  handleValidationErrors,
];

const validateUpdate = [
  validateIdParam(),
  body('personaId')
    .not().exists().withMessage('No se puede cambiar la persona de un consentimiento existente'),
  body('tipoProcedimiento')
    .optional()
    .isLength({ min: 3, max: 255 }).withMessage('El tipo de procedimiento debe tener entre 3 y 255 caracteres')
    .trim(),
  body('metodo')
    .optional()
    .customSanitizer(normalizeMethod)
    .isIn(VALID_METHODS).withMessage(`El método debe ser uno de los siguientes: ${VALID_METHODS.join(', ')}`),
  body('fechaConsentimiento')
    .optional()
    .isISO8601().withMessage('La fecha de consentimiento debe ser una fecha válida (formato ISO 8601)')
    .toDate(),
  body('archivoId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID del archivo debe ser un número entero positivo'),
  handleValidationErrors,
];

const validateId = [
  validateIdParam(),
  handleValidationErrors,
];

const validateList = [
  ...validatePagination(),
  ...validateSorting(['fecha', 'persona', 'procedimiento', 'metodo', 'createdAt']),
  query('persona')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de la persona debe ser un número entero positivo'),
  query('documento')
    .optional()
    .trim()
    .isLength({ min: 5, max: 20 }).withMessage('El documento debe tener entre 5 y 20 caracteres'),
  query('procedimiento')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 }).withMessage('El procedimiento debe tener entre 1 y 255 caracteres'),
  query('metodo')
    .optional()
    .customSanitizer(normalizeMethod)
    .isIn(VALID_METHODS).withMessage(`El método debe ser uno de los siguientes: ${VALID_METHODS.join(', ')}`),
  query('fechaDesde')
    .optional()
    .isISO8601().withMessage('La fecha desde debe ser una fecha válida (formato ISO 8601)'),
  query('fechaHasta')
    .optional()
    .isISO8601().withMessage('La fecha hasta debe ser una fecha válida (formato ISO 8601)')
    .custom((value, { req }) => {
      if (req.query.fechaDesde && value) {
        const desde = new Date(req.query.fechaDesde);
        const hasta = new Date(value);
        if (desde > hasta) {
          throw new Error('La fecha desde debe ser anterior a la fecha hasta');
        }
      }
      return true;
    }),
  handleValidationErrors,
];

module.exports = {
  validateCreate,
  validateUpdate,
  validateId,
  validateList,
};
