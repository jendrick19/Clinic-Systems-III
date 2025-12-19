const { body, param, query } = require('express-validator');
const {
  handleValidationErrors,
  validateIdParam,
  validatePagination,
  validateSorting,
} = require('../../../shared/validators/CommonValidator');

const db = require('../../../../database/models');
const { PeopleAttended, Professional, CareUnit, Schedule } = db.modules.operative;
const VALID_STATUSES = ['solicitada', 'confirmada', 'cumplida', 'cancelada', 'no asistio'];
const VALID_CHANNELS = ['Presencial', 'Virtual'];

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

const checkProfessionalExists = async (value) => {
  const professional = await Professional.findByPk(value);
  if (!professional) {
    throw new Error('El profesional especificado no existe');
  }
  if (!professional.status) {
    throw new Error('El profesional especificado está inactivo');
  }
  return true;
};

const checkCareUnitExists = async (value) => {
  const careUnit = await CareUnit.findByPk(value);
  if (!careUnit) {
    throw new Error('La unidad de atención especificada no existe');
  }
  if (!careUnit.status) {
    throw new Error('La unidad de atención especificada está inactiva');
  }
  return true;
};

const checkScheduleExists = async (value) => {
  const schedule = await Schedule.findByPk(value);
  if (!schedule) {
    throw new Error('La agenda especificada no existe');
  }
  if (schedule.status !== 'abierta') {
    throw new Error('Solo se pueden crear citas en agendas con estado "abierta"');
  }
  return true;
};

const validateDateRange = (value, { req }) => {
  const startTime = req.body.inicio;
  const endTime = req.body.fin;
  if (startTime && endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) {
      throw new Error('La fecha de inicio debe ser anterior a la fecha de fin');
    }
  }
  return true;
};

const validateCreate = [
  body('pacienteId')
    .notEmpty().withMessage('El ID del paciente es requerido')
    .isInt({ min: 1 }).withMessage('El ID del paciente debe ser un número entero positivo')
    .custom(checkPeopleExists),
  body('profesionalId')
    .notEmpty().withMessage('El ID del profesional es requerido')
    .isInt({ min: 1 }).withMessage('El ID del profesional debe ser un número entero positivo')
    .custom(checkProfessionalExists),
  body('unidadId')
    .notEmpty().withMessage('El ID de la unidad es requerido')
    .isInt({ min: 1 }).withMessage('El ID de la unidad debe ser un número entero positivo')
    .custom(checkCareUnitExists),
  body('agendaId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de la agenda debe ser un número entero positivo')
    .custom(checkScheduleExists),
  body('inicio')
    .notEmpty().withMessage('La fecha de inicio es requerida')
    .isISO8601().withMessage('La fecha de inicio debe ser una fecha válida (formato ISO 8601)')
    .toDate(),
  body('fin')
    .notEmpty().withMessage('La fecha de fin es requerida')
    .isISO8601().withMessage('La fecha de fin debe ser una fecha válida (formato ISO 8601)')
    .toDate()
    .custom(validateDateRange),
  body('canal')
    .optional()
    .isIn(VALID_CHANNELS).withMessage(`El canal debe ser uno de los siguientes: ${VALID_CHANNELS.join(', ')}`),
  body('estado')
    .optional()
    .customSanitizer((value) => value ? value.toLowerCase() : value)
    .isIn(VALID_STATUSES).withMessage(`El estado debe ser uno de los siguientes: ${VALID_STATUSES.join(', ')}`),
  body('motivo')
    .notEmpty().withMessage('El motivo es requerido')
    .isLength({ min: 5, max: 500 }).withMessage('El motivo debe tener entre 5 y 500 caracteres')
    .trim(),
  body('observaciones')
    .optional()
    .isLength({ max: 1000 }).withMessage('Las observaciones no pueden superar los 1000 caracteres')
    .trim(),
  handleValidationErrors,
];

const validateUpdate = [
  validateIdParam(),
  body('pacienteId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID del paciente debe ser un número entero positivo')
    .custom(checkPeopleExists),
  body('profesionalId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID del profesional debe ser un número entero positivo')
    .custom(checkProfessionalExists),
  body('unidadId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de la unidad debe ser un número entero positivo')
    .custom(checkCareUnitExists),
  body('agendaId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de la agenda debe ser un número entero positivo')
    .custom(checkScheduleExists),
  body('inicio')
    .optional()
    .isISO8601().withMessage('La fecha de inicio debe ser una fecha válida (formato ISO 8601)')
    .toDate(),
  body('fin')
    .optional()
    .isISO8601().withMessage('La fecha de fin debe ser una fecha válida (formato ISO 8601)')
    .toDate()
    .custom(validateDateRange),
  body('canal')
    .optional()
    .isIn(VALID_CHANNELS).withMessage(`El canal debe ser uno de los siguientes: ${VALID_CHANNELS.join(', ')}`),
  body('estado')
    .optional()
    .customSanitizer((value) => value ? value.toLowerCase() : value)
    .isIn(VALID_STATUSES).withMessage(`El estado debe ser uno de los siguientes: ${VALID_STATUSES.join(', ')}`),
  body('motivo')
    .optional()
    .isLength({ min: 5, max: 500 }).withMessage('El motivo debe tener entre 5 y 500 caracteres')
    .trim(),
  body('observaciones')
    .optional()
    .isLength({ max: 1000 }).withMessage('Las observaciones no pueden superar los 1000 caracteres')
    .trim(),
  body('razonCambio')
    .optional()
    .isLength({ min: 5, max: 500 }).withMessage('La razón del cambio debe tener entre 5 y 500 caracteres')
    .trim(),
  handleValidationErrors,
];

const validateId = [
  validateIdParam(),
  handleValidationErrors,
];

const validateList = [
  ...validatePagination(),
  ...validateSorting(['fecha', 'estado', 'paciente', 'profesional', 'createdAt']),
  query('nombrePersona')
    .optional()
    .isLength({ min: 1, max: 100 }).withMessage('El nombre de la persona debe tener entre 1 y 100 caracteres')
    .trim(),
  query('nombreProfesional')
    .optional()
    .isLength({ min: 1, max: 100 }).withMessage('El nombre del profesional debe tener entre 1 y 100 caracteres')
    .trim(),
  query('paciente')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID del paciente debe ser un número entero positivo'),
  query('profesional')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID del profesional debe ser un número entero positivo'),
  query('agendaId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de la agenda debe ser un número entero positivo'),
  query('unidadId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de la unidad debe ser un número entero positivo'),
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
