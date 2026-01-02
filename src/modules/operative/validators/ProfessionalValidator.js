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

const validateAllowedFields = (allowedFields) => {
  return (req, res, next) => {
    const receivedFields = Object.keys(req.body);
    const unknownFields = receivedFields.filter(field => !allowedFields.includes(field));
    
    if (unknownFields.length > 0) {
      return res.status(400).json({
        codigo: 400,
        mensaje: 'Error de validación',
        errores: [`Campos no permitidos o mal escritos: ${unknownFields.join(', ')}`]
      });
    }
    next();
  };
};

const ALLOWED_SPECIALTIES = [
  'Odontología General',
  'Ortodoncia',
  'Endodoncia',
  'Periodoncia',
  'Odontopediatría',
  'Cirugía Oral y Maxilofacial',
  'Prótesis Dental',
  'Implantología',
  'Estética Dental',
  'Patología Oral'
];

const checkProfessionalRegisterUniqueness = async (value, { req }) => {
  const { Op } = require('sequelize');
  const db = require('../../../../database/models');
  const { Professional } = db.modules.operative;
  const where = {
    professionalRegister: value,
  };
  if (req.params?.id) {
    where.id = { [Op.ne]: req.params.id };
  }
  const existingProfessional = await Professional.findOne({ where });
  if (existingProfessional) {
    throw new Error('El registro profesional ya está registrado');
  }
  return true;
};

const checkEmailUniqueness = async (value, { req }) => {
  const { Op } = require('sequelize');
  const db = require('../../../../database/models');
  const { Professional } = db.modules.operative;
  const where = {
    email: value,
  };
  if (req.params?.id) {
    where.id = { [Op.ne]: req.params.id };
  }
  const existingProfessional = await Professional.findOne({ where });
  if (existingProfessional) {
    throw new Error('El correo electrónico ya está registrado');
  }
  return true;
};

// Verifica que el username (que será el registro profesional) no exista en la tabla Users
const checkUsernameUniqueness = async (value) => {
  const db = require('../../../../database/models');
  const { User } = db.modules.platform;
  const existingUser = await User.findOne({
    where: { username: value },
  });
  if (existingUser) {
    throw new Error('Este Registro Profesional ya está asociado a un Usuario existente');
  }
  return true;
};

const validateCreate = [
  validateAllowedFields(['nombres', 'apellidos', 'registroProfesional', 'especialidad', 'correo', 'telefono', 'agendaHabilitada', 'estado', 'userId', 'usuario']),
  validateNames(),
  validateSurnames(),
  
  // AHORA VALIDAMOS EL USUARIO AQUÍ (Usando el Registro Profesional)
  body('registroProfesional')
    .notEmpty().withMessage('El registro profesional es requerido')
    .isLength({ min: 3, max: 50 }).withMessage('El registro profesional debe tener entre 3 y 50 caracteres')
    .matches(/^[A-Z0-9-]+$/).withMessage('El registro profesional solo puede contener letras mayúsculas, números y guiones')
    .custom(checkProfessionalRegisterUniqueness) // Chequea tabla Professionals
    .custom(checkUsernameUniqueness),          // Chequea tabla Users (NUEVO)

  body('especialidad')
    .notEmpty().withMessage('La especialidad es requerida')
    .isIn(ALLOWED_SPECIALTIES).withMessage(`La especialidad debe ser una de las siguientes: ${ALLOWED_SPECIALTIES.join(', ')}`),
  validateEmail('correo').custom(checkEmailUniqueness),
  validatePhone('telefono'),
  body('agendaHabilitada')
    .optional()
    .isBoolean().withMessage('agendaHabilitada debe ser verdadero o falso'),
  validateStatus('estado'),
  
  // Validaciones del objeto 'usuario' (SIN VALIDAR USERNAME, porque se genera solo)
  body('usuario')
    .notEmpty().withMessage('Los datos del usuario son requeridos'),
  body('usuario.email')
    .notEmpty().withMessage('El correo del usuario es requerido')
    .isEmail().withMessage('El correo del usuario debe ser una dirección válida')
    .normalizeEmail(),
  body('usuario.password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('La contraseña debe contener al menos una letra minúscula, una mayúscula y un número'),
  body('usuario.estado')
    .optional()
    .isBoolean().withMessage('El estado del usuario debe ser verdadero o falso'),
  
  handleValidationErrors,
];

const validateUpdate = [
  validateIdParam(),
  validateAllowedFields(['nombres', 'apellidos', 'registroProfesional', 'especialidad', 'correo', 'telefono', 'agendaHabilitada', 'estado', 'userId']),
  validateNamesOptional(),
  validateSurnamesOptional(),
  body('registroProfesional')
    .optional()
    .isLength({ min: 3, max: 50 }).withMessage('El registro profesional debe tener entre 3 y 50 caracteres')
    .matches(/^[A-Z0-9-]+$/).withMessage('El registro profesional solo puede contener letras mayúsculas, números y guiones')
    .custom(checkProfessionalRegisterUniqueness),
  body('especialidad')
    .optional()
    .isIn(ALLOWED_SPECIALTIES).withMessage(`La especialidad debe ser una de las siguientes: ${ALLOWED_SPECIALTIES.join(', ')}`),
  validateEmailOptional('correo').custom(checkEmailUniqueness),
  validatePhone('telefono'),
  body('agendaHabilitada')
    .optional()
    .isBoolean().withMessage('agendaHabilitada debe ser verdadero o falso'),
  validateStatus('estado'),
  handleValidationErrors,
];

const validateId = [
  validateIdParam(),
  handleValidationErrors,
];

const validateList = [
  ...validatePagination(),
  ...validateSorting(['nombres', 'apellidos', 'especialidad', 'registro', 'createdAt']),
  query('nombre')
    .optional()
    .isLength({ min: 1, max: 100 }).withMessage('El nombre debe tener entre 1 y 100 caracteres'),
  query('especialidad')
    .optional()
    .isLength({ min: 1, max: 100 }).withMessage('La especialidad debe tener entre 1 y 100 caracteres'),
  validateStatusQuery(),
  handleValidationErrors,
];

module.exports = {
  validateCreate,
  validateUpdate,
  validateId,
  validateList,
};