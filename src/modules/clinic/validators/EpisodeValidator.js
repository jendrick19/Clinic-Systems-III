const { body, param, query } = require('express-validator');
const {
  handleValidationErrors,
  validateIdParam,
  validatePagination,
  validateSorting,
} = require('../../../shared/validators/CommonValidator');
const db = require('../../../../database/models');
const { PeopleAttended } = db.modules.operative;

const VALID_STATUSES = ['abierto', 'cerrado'];

const VALID_TYPES = ['consulta', 'procedimiento', 'control', 'urgencia'];

const checkPeopleExists = async (value) => {
  const person = await PeopleAttended.findByPk(value);
  if (!person) {
    throw new Error('El paciente especificado no existe');
  }
  if (!person.status) {
    throw new Error('El paciente especificado está inactivo');
  }
  return true;
};

const validateCreate = [
  body('pacienteId')
    .notEmpty().withMessage('El ID del paciente es requerido')
    .isInt({ min: 1 }).withMessage('El ID del paciente debe ser un número entero positivo')
    .custom(checkPeopleExists),
  body('fechaApertura')
    .optional()
    .isISO8601().withMessage('La fecha de apertura debe ser una fecha válida (formato ISO 8601)')
    .toDate(),
  body('motivo')
    .optional()
    .isLength({ min: 5, max: 500 }).withMessage('El motivo debe tener entre 5 y 500 caracteres')
    .trim(),
  body('tipo')
    .notEmpty().withMessage('El tipo es requerido')
    .customSanitizer((value) => value ? value.toLowerCase() : value)
    .isIn(VALID_TYPES).withMessage(`El tipo debe ser uno de los siguientes: ${VALID_TYPES.join(', ')}`),
  body('estado')
    .optional()
    .customSanitizer((value) => value ? value.toLowerCase() : value)
    .isIn(VALID_STATUSES).withMessage(`El estado debe ser uno de los siguientes: ${VALID_STATUSES.join(', ')}`),
  handleValidationErrors,
];

const validateUpdate = [
  validateIdParam(),
  body('pacienteId')
    .not().exists().withMessage('No se puede cambiar el paciente de un episodio'),
  body('fechaApertura')
    .not().exists().withMessage('No se puede cambiar la fecha de apertura de un episodio'),
  body('motivo')
    .optional()
    .isLength({ min: 5, max: 500 }).withMessage('El motivo debe tener entre 5 y 500 caracteres')
    .trim(),
  body('tipo')
    .optional()
    .customSanitizer((value) => value ? value.toLowerCase() : value)
    .isIn(VALID_TYPES).withMessage(`El tipo debe ser uno de los siguientes: ${VALID_TYPES.join(', ')}`),
  body('estado')
    .optional()
    .customSanitizer((value) => value ? value.toLowerCase() : value)
    .isIn(VALID_STATUSES).withMessage(`El estado debe ser uno de los siguientes: ${VALID_STATUSES.join(', ')}`),
  handleValidationErrors,
];

const validateId = [
  validateIdParam(),
  handleValidationErrors,
];

const validateList = [
  ...validatePagination(),
  ...validateSorting(['fecha', 'estado', 'tipo', 'paciente', 'createdAt']),
  query('nombrePaciente')
    .optional()
    .isLength({ min: 1, max: 100 }).withMessage('El nombre del paciente debe tener entre 1 y 100 caracteres')
    .trim(),
  query('documentoPaciente')
    .optional()
    .isLength({ min: 1, max: 20 }).withMessage('El documento del paciente debe tener entre 1 y 20 caracteres')
    .trim(),
  query('paciente')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID del paciente debe ser un número entero positivo'),
  query('estado')
    .optional()
    .customSanitizer((value) => {
      if (Array.isArray(value)) {
        return value.map(v => v ? v.toLowerCase() : v);
      }
      return value ? value.toLowerCase() : value;
    })
    .custom((value) => {
      const estados = Array.isArray(value) ? value : [value];
      const invalidEstados = estados.filter(estado => !VALID_STATUSES.includes(estado));
      if (invalidEstados.length > 0) {
        throw new Error(`Estados inválidos: ${invalidEstados.join(', ')}. Estados válidos: ${VALID_STATUSES.join(', ')}`);
      }
      return true;
    }),
  query('tipo')
    .optional()
    .customSanitizer((value) => {
      if (Array.isArray(value)) {
        return value.map(v => v ? v.toLowerCase() : v);
      }
      return value ? value.toLowerCase() : value;
    })
    .custom((value) => {
      const tipos = Array.isArray(value) ? value : [value];
      const invalidTipos = tipos.filter(tipo => !VALID_TYPES.includes(tipo));
      if (invalidTipos.length > 0) {
        throw new Error(`Tipos inválidos: ${invalidTipos.join(', ')}. Tipos válidos: ${VALID_TYPES.join(', ')}`);
      }
      return true;
    }),
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
