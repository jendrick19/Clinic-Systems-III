const { body, param, query } = require('express-validator');
const {
  handleValidationErrors,
  validateIdParam,
  validatePagination,
  validateSorting,
} = require('../../../shared/validators/CommonValidator');

const validateSOAPField = (fieldName, displayName) => 
  body(fieldName)
    .notEmpty().withMessage(`${displayName} es requerido`)
    .isLength({ min: 10, max: 5000 }).withMessage(`${displayName} debe tener entre 10 y 5000 caracteres`)
    .trim();

const validateCreate = [
  body('episodioId')
    .notEmpty().withMessage('El ID del episodio es requerido')
    .isInt({ min: 1 }).withMessage('El ID del episodio debe ser un número entero positivo'),
  body('profesionalId')
    .notEmpty().withMessage('El ID del profesional es requerido')
    .isInt({ min: 1 }).withMessage('El ID del profesional debe ser un número entero positivo'),
  body('fechaNota')
    .optional()
    .isISO8601().withMessage('La fecha de la nota debe ser una fecha válida (formato ISO 8601)')
    .toDate(),
  validateSOAPField('subjetivo', 'El campo subjetivo'),
  validateSOAPField('objetivo', 'El campo objetivo'),
  validateSOAPField('analisis', 'El campo de análisis'),
  validateSOAPField('plan', 'El plan de tratamiento'),
  body('adjuntos')
    .optional()
    .isLength({ max: 500 }).withMessage('Los adjuntos no pueden superar los 500 caracteres')
    .trim(),
  body('fechaVersion')
    .optional()
    .isISO8601().withMessage('La fecha de versión debe ser una fecha válida (formato ISO 8601)')
    .toDate(),
  handleValidationErrors,
];

const validateUpdate = [
  validateIdParam(),
  validateSOAPField('subjetivo', 'El campo subjetivo'),
  validateSOAPField('objetivo', 'El campo objetivo'),
  validateSOAPField('analisis', 'El campo de análisis'),
  validateSOAPField('plan', 'El plan de tratamiento'),
  body('adjuntos')
    .optional()
    .isLength({ max: 500 }).withMessage('Los adjuntos no pueden superar los 500 caracteres')
    .trim(),
  body('fechaVersion')
    .optional()
    .isISO8601().withMessage('La fecha de versión debe ser una fecha válida (formato ISO 8601)')
    .toDate(),
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
  ...validateSorting(['fecha', 'profesional', 'createdAt']),
  handleValidationErrors,
];

const validateProfessionalId = [
  param('professionalId')
    .notEmpty().withMessage('El ID del profesional es requerido')
    .isInt({ min: 1 }).withMessage('El ID del profesional debe ser un número entero positivo'),
  ...validatePagination(),
  ...validateSorting(['fecha', 'episodio', 'createdAt']),
  handleValidationErrors,
];

const validateList = [
  ...validatePagination(),
  ...validateSorting(['fecha', 'episodio', 'profesional', 'createdAt']),
  query('episodio')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID del episodio debe ser un número entero positivo'),
  query('profesional')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID del profesional debe ser un número entero positivo'),
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

const validateDateRange = [
  ...validatePagination(),
  ...validateSorting(['fecha', 'episodio', 'profesional', 'createdAt']),
  query('fechaDesde')
    .notEmpty().withMessage('La fecha desde es requerida')
    .isISO8601().withMessage('La fecha desde debe ser una fecha válida (formato ISO 8601)'),
  query('fechaHasta')
    .notEmpty().withMessage('La fecha hasta es requerida')
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
  validateEpisodeId,
  validateProfessionalId,
  validateList,
  validateDateRange,
  validateVersionId,
  validateCompareVersions,
};
