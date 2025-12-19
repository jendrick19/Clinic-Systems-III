const { body, query } = require('express-validator');
const {
  handleValidationErrors,
  validateIdParam,
  validatePagination,
  validateSorting,
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

const checkCodigoUniqueness = async (value, { req }) => {
  const { Op } = require('sequelize');
  const db = require('../../../../database/models');
  const { Plan } = db.modules.bussines;
  
  const where = { codigo: value };
  
  if (req.params?.id) {
    where.id = { [Op.ne]: req.params.id };
  }
  
  const existingPlan = await Plan.findOne({ where });
  if (existingPlan) {
    throw new Error('Ya existe un plan registrado con este código');
  }
  return true;
};

const checkAseguradoraExists = async (value) => {
  const db = require('../../../../database/models');
  const { Insurer } = db.modules.bussines;
  
  const insurer = await Insurer.findByPk(value);
  if (!insurer) {
    throw new Error('La aseguradora especificada no existe');
  }
  
  if (insurer.estado !== 'activo') {
    throw new Error('La aseguradora no está activa');
  }
  
  return true;
};

const validateCreate = [
  validateAllowedFields(['aseguradoraId', 'nombre', 'codigo', 'tipo', 'condicionesGenerales', 'activo']),
  
  body('aseguradoraId')
    .notEmpty().withMessage('El ID de la aseguradora es requerido')
    .isInt({ min: 1 }).withMessage('El ID de la aseguradora debe ser un número entero positivo')
    .custom(checkAseguradoraExists),
  
  body('nombre')
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres')
    .trim(),
  
  body('codigo')
    .notEmpty().withMessage('El código es requerido')
    .isLength({ min: 3, max: 50 }).withMessage('El código debe tener entre 3 y 50 caracteres')
    .matches(/^[A-Z0-9-]+$/i).withMessage('El código solo puede contener letras, números y guiones')
    .trim()
    .custom(checkCodigoUniqueness),
  
  body('tipo')
    .optional()
    .isLength({ min: 3, max: 100 }).withMessage('El tipo debe tener entre 3 y 100 caracteres')
    .trim(),
  
  body('condicionesGenerales')
    .optional()
    .isLength({ min: 10, max: 5000 }).withMessage('Las condiciones generales deben tener entre 10 y 5000 caracteres')
    .trim(),
  
  body('activo')
    .optional()
    .isBoolean().withMessage('El campo activo debe ser verdadero o falso'),
  
  handleValidationErrors,
];

const validateUpdate = [
  validateIdParam(),
  validateAllowedFields(['aseguradoraId', 'nombre', 'codigo', 'tipo', 'condicionesGenerales', 'activo']),
  
  body('aseguradoraId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de la aseguradora debe ser un número entero positivo')
    .custom(checkAseguradoraExists),
  
  body('nombre')
    .optional()
    .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres')
    .trim(),
  
  body('codigo')
    .optional()
    .isLength({ min: 3, max: 50 }).withMessage('El código debe tener entre 3 y 50 caracteres')
    .matches(/^[A-Z0-9-]+$/i).withMessage('El código solo puede contener letras, números y guiones')
    .trim()
    .custom(checkCodigoUniqueness),
  
  body('tipo')
    .optional()
    .isLength({ min: 3, max: 100 }).withMessage('El tipo debe tener entre 3 y 100 caracteres')
    .trim(),
  
  body('condicionesGenerales')
    .optional()
    .isLength({ min: 10, max: 5000 }).withMessage('Las condiciones generales deben tener entre 10 y 5000 caracteres')
    .trim(),
  
  body('activo')
    .optional()
    .isBoolean().withMessage('El campo activo debe ser verdadero o falso'),
  
  handleValidationErrors,
];

const validateId = [
  validateIdParam(),
  handleValidationErrors,
];

const validateList = [
  ...validatePagination(),
  ...validateSorting(['nombre', 'codigo', 'tipo', 'activo', 'createdAt']),
  
  query('nombre')
    .optional()
    .isLength({ min: 1, max: 100 }).withMessage('El nombre debe tener entre 1 y 100 caracteres'),
  
  query('codigo')
    .optional()
    .isLength({ min: 1, max: 50 }).withMessage('El código debe tener entre 1 y 50 caracteres'),
  
  query('tipo')
    .optional()
    .isLength({ min: 1, max: 100 }).withMessage('El tipo debe tener entre 1 y 100 caracteres'),
  
  query('aseguradoraId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de la aseguradora debe ser un número entero positivo'),
  
  query('activo')
    .optional()
    .isBoolean().withMessage('El campo activo debe ser verdadero o falso'),
  
  handleValidationErrors,
];

module.exports = {
  validateCreate,
  validateUpdate,
  validateId,
  validateList,
};

