const { body, param, query } = require('express-validator');
const {
  handleValidationErrors,
  validateNames,
  validateNamesOptional,
  validateSurnames,
  validateSurnamesOptional,
  validateEmail,
  validateEmailOptional,
  validatePhone,
  validateStatus,
  validateIdParam,
  validatePagination,
  validateSorting,
  validateStatusQuery,
} = require('../../../shared/validators/CommonValidator');

const checkDocumentUniqueness = async (value, { req }) => {
  const { Op } = require('sequelize');
  const db = require('../../../../database/models');
  const { PeopleAttended } = db.modules.operative;
  const where = {
    documentId: value,
  };
  if (req.params?.id) {
    where.id = { [Op.ne]: req.params.id };
  }
  const existingPerson = await PeopleAttended.findOne({ where });
  if (existingPerson) {
    throw new Error('El número de documento ya está registrado');
  }
  return true;
};

const validateCreate = [
  // El ID no se valida en creación, se genera automáticamente
  body('tipoDocumento')
    .notEmpty().withMessage('El tipo de documento es requerido')
    .customSanitizer((value) => value ? value.toLowerCase() : value)
    .isIn(['cedula', 'rif', 'pasaporte', 'extranjero', 'otro']).withMessage('Tipo de documento inválido'),
  body('numeroDocumento')
    .notEmpty().withMessage('El número de documento es requerido')
    .isLength({ min: 5, max: 20 }).withMessage('El número de documento debe tener entre 5 y 20 caracteres')
    .matches(/^[0-9A-Za-z]+$/).withMessage('El número de documento solo puede contener letras y números')
    .custom(checkDocumentUniqueness),
  validateNames(),
  validateSurnames(),
  body('fechaNacimiento')
    .optional()
    .isISO8601().withMessage('La fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD)')
    .custom((value) => {
      if (!value) return true; // Es opcional
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 0 || age > 120) {
        throw new Error('La edad debe estar entre 0 y 120 años');
      }
      return true;
    }),
  body('sexo')
    .optional()
    .isIn(['m', 'f', 'o', 'M', 'F', 'O']).withMessage('El sexo debe ser M (Masculino), F (Femenino) u O (Otro)'),
  validatePhone('telefono'),
  validateEmail('correo'),
  body('direccion')
    .optional()
    .isLength({ min: 5, max: 200 }).withMessage('La dirección debe tener entre 5 y 200 caracteres'),
  body('contactoEmergencia')
    .optional()
    .isLength({ min: 5, max: 200 }).withMessage('El contacto de emergencia debe tener entre 5 y 200 caracteres'),
  body('alergias')
    .optional()
    .isLength({ max: 500 }).withMessage('Las alergias no pueden superar los 500 caracteres'),
  validateStatus('estado'),
  handleValidationErrors,
];

const validateUpdate = [
  validateIdParam(),
  body('tipoDocumento')
    .optional()
    .customSanitizer((value) => value ? value.toLowerCase() : value)
    .isIn(['cedula', 'rif', 'pasaporte', 'extranjero', 'otro']).withMessage('Tipo de documento inválido'),
  body('numeroDocumento')
    .optional()
    .isLength({ min: 5, max: 20 }).withMessage('El número de documento debe tener entre 5 y 20 caracteres')
    .matches(/^[0-9A-Za-z]+$/).withMessage('El número de documento solo puede contener letras y números')
    .custom(checkDocumentUniqueness),
  validateNamesOptional(),
  validateSurnamesOptional(),
  body('fechaNacimiento')
    .optional()
    .isISO8601().withMessage('La fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD)')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 0 || age > 120) {
        throw new Error('La edad debe estar entre 0 y 120 años');
      }
      return true;
    }),
  body('sexo')
    .optional()
    .isIn(['M', 'F', 'O']).withMessage('El sexo debe ser M (Masculino), F (Femenino) u O (Otro)'),
  validatePhone('telefono'),
  validateEmailOptional('correo'),
  body('direccion')
    .optional()
    .isLength({ min: 5, max: 200 }).withMessage('La dirección debe tener entre 5 y 200 caracteres'),
  body('contactoEmergencia')
    .optional()
    .isLength({ min: 5, max: 200 }).withMessage('El contacto de emergencia debe tener entre 5 y 200 caracteres'),
  body('alergias')
    .optional()
    .isLength({ max: 500 }).withMessage('Las alergias no pueden superar los 500 caracteres'),
  validateStatus('estado'),
  handleValidationErrors,
];

const validateId = [
  validateIdParam(),
  handleValidationErrors,
];

const validateList = [
  ...validatePagination(),
  ...validateSorting(['nombres', 'apellidos', 'fechaNacimiento', 'createdAt']),
  query('tipoDocumento')
    .optional()
    .customSanitizer((value) => value ? value.toLowerCase() : value)
    .isIn(['cedula', 'rif', 'pasaporte', 'extranjero', 'otro']).withMessage('Tipo de documento inválido'),
  query('numeroDocumento')
    .optional()
    .isLength({ min: 1, max: 20 }).withMessage('El número de documento debe tener entre 1 y 20 caracteres'),
  query('edad')
    .optional()
    .isInt({ min: 0, max: 120 }).withMessage('La edad debe ser un número entre 0 y 120'),
  query('sexo')
    .optional()
    .isIn(['M', 'F', 'O']).withMessage('El sexo debe ser M, F u O'),
  query('nombres')
    .optional()
    .isLength({ min: 1, max: 100 }).withMessage('Los nombres deben tener entre 1 y 100 caracteres'),
  query('apellidos')
    .optional()
    .isLength({ min: 1, max: 100 }).withMessage('Los apellidos deben tener entre 1 y 100 caracteres'),
  validateStatusQuery(),
  handleValidationErrors,
];

module.exports = {
  validateCreate,
  validateUpdate,
  validateId,
  validateList,
};
