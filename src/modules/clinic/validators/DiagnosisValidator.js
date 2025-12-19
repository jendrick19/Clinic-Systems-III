const { body, param, query } = require('express-validator');
const {
  handleValidationErrors,
  validateIdParam,
  validatePagination,
  validateSorting,
} = require('../../../shared/validators/CommonValidator');
const { validateAndNormalizeCIE10Code } = require('../../../shared/utils/CIE10Helper');
const db = require('../../../../database/models');
const { Episode } = db.modules.clinic;

const VALID_TYPES = ['presuntivo', 'definitivo'];

const normalizeType = (value) => {
  if (!value || typeof value !== 'string') {
    return value;
  }
  return value.toLowerCase().trim();
};

const checkCIE10Code = (value) => {
  validateAndNormalizeCIE10Code(value);
  return true;
};

const checkEpisodeExists = async (value) => {
  const episode = await Episode.findByPk(value);
  if (!episode) {
    throw new Error('El episodio especificado no existe');
  }
  if (episode.status === 'cerrado') {
    throw new Error('No se pueden crear o modificar diagnósticos en un episodio cerrado');
  }
  return true;
};

const validateCreate = [
  body('episodioId')
    .notEmpty().withMessage('El ID del episodio es requerido')
    .isInt({ min: 1 }).withMessage('El ID del episodio debe ser un número entero positivo')
    .custom(checkEpisodeExists),
  body('codigo')
    .notEmpty().withMessage('El código CIE-10 es requerido')
    .trim()
    .isLength({ min: 3, max: 10 }).withMessage('El código CIE-10 debe tener entre 3 y 10 caracteres')
    .toUpperCase()
    .custom(checkCIE10Code),
  body('descripcion')
    .notEmpty().withMessage('La descripción del diagnóstico es requerida')
    .isLength({ min: 5, max: 500 }).withMessage('La descripción debe tener entre 5 y 500 caracteres')
    .trim(),
  body('tipo')
    .notEmpty().withMessage('El tipo de diagnóstico es requerido')
    .customSanitizer(normalizeType)
    .isIn(VALID_TYPES).withMessage(`El tipo debe ser uno de los siguientes: ${VALID_TYPES.join(', ')}`),
  body('principal')
    .optional()
    .isBoolean().withMessage('El campo principal debe ser un valor booleano (true/false)'),
  handleValidationErrors,
];

const validateUpdate = [
  validateIdParam(),
  body('episodioId')
    .not().exists().withMessage('No se puede cambiar el episodio de un diagnóstico existente'),
  body('codigo')
    .optional()
    .trim()
    .isLength({ min: 3, max: 10 }).withMessage('El código CIE-10 debe tener entre 3 y 10 caracteres')
    .toUpperCase()
    .custom(checkCIE10Code),
  body('descripcion')
    .optional()
    .isLength({ min: 5, max: 500 }).withMessage('La descripción debe tener entre 5 y 500 caracteres')
    .trim(),
  body('tipo')
    .optional()
    .customSanitizer(normalizeType)
    .isIn(VALID_TYPES).withMessage(`El tipo debe ser uno de los siguientes: ${VALID_TYPES.join(', ')}`),
  body('principal')
    .optional()
    .isBoolean().withMessage('El campo principal debe ser un valor booleano (true/false)'),
  handleValidationErrors,
];

const validateId = [
  validateIdParam(),
  handleValidationErrors,
];

const validateEpisodeId = [
  param('episodeId')
    .notEmpty().withMessage('El ID del episodio es requerido')
    .isInt({ min: 1 }).withMessage('El ID del episodio debe ser un número entero positivo'),
  ...validatePagination(),
  ...validateSorting(['principal', 'episodio', 'codigo', 'tipo', 'createdAt']),
  handleValidationErrors,
];

const validateList = [
  ...validatePagination(),
  ...validateSorting(['episodio', 'codigo', 'tipo', 'principal', 'createdAt']),
  query('episodio')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID del episodio debe ser un número entero positivo'),
  query('codigo')
    .optional()
    .trim()
    .isLength({ min: 1, max: 10 }).withMessage('El código debe tener entre 1 y 10 caracteres'),
  query('tipo')
    .optional()
    .customSanitizer(normalizeType)
    .isIn(VALID_TYPES).withMessage(`El tipo debe ser uno de los siguientes: ${VALID_TYPES.join(', ')}`),
  query('principal')
    .optional()
    .isIn(['true', 'false']).withMessage('El campo principal debe ser "true" o "false"'),
  handleValidationErrors,
];

const validateSearchByCode = [
  ...validatePagination(),
  ...validateSorting(['codigo', 'tipo', 'createdAt']),
  query('codigo')
    .notEmpty().withMessage('El parámetro "codigo" es requerido para realizar la búsqueda')
    .trim()
    .isLength({ min: 1, max: 10 }).withMessage('El código debe tener entre 1 y 10 caracteres'),
  handleValidationErrors,
];

const validateType = [
  param('type')
    .notEmpty().withMessage('El tipo de diagnóstico es requerido')
    .customSanitizer(normalizeType)
    .isIn(VALID_TYPES).withMessage(`El tipo debe ser uno de los siguientes: ${VALID_TYPES.join(', ')}`),
  ...validatePagination(),
  ...validateSorting(['codigo', 'episodio', 'createdAt']),
  handleValidationErrors,
];

const validatePrincipalByEpisode = [
  param('episodeId')
    .notEmpty().withMessage('El ID del episodio es requerido')
    .isInt({ min: 1 }).withMessage('El ID del episodio debe ser un número entero positivo'),
  handleValidationErrors,
];

const validateChangePrincipal = [
  param('episodeId')
    .notEmpty().withMessage('El ID del episodio es requerido')
    .isInt({ min: 1 }).withMessage('El ID del episodio debe ser un número entero positivo'),
  param('diagnosisId')
    .notEmpty().withMessage('El ID del diagnóstico es requerido')
    .isInt({ min: 1 }).withMessage('El ID del diagnóstico debe ser un número entero positivo'),
  handleValidationErrors,
];

module.exports = {
  validateCreate,
  validateUpdate,
  validateId,
  validateEpisodeId,
  validateList,
  validateSearchByCode,
  validateType,
  validatePrincipalByEpisode,
  validateChangePrincipal,
};
