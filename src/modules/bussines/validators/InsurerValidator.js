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

const checkNitUniqueness = async (value, { req }) => {
  const { Op } = require('sequelize');
  const db = require('../../../../database/models');
  const { Insurer } = db.modules.bussines;
  
  const where = { nit: value };
  
  if (req.params?.id) {
    where.id = { [Op.ne]: req.params.id };
  }
  
  const existingInsurer = await Insurer.findOne({ where });
  if (existingInsurer) {
    throw new Error('Ya existe una aseguradora registrada con este NIT');
  }
  return true;
};


const validateCreate = [
  validateAllowedFields(['nombre', 'nit', 'contacto', 'estado']),
  
  body('nombre')
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres')
    .trim(),
  
  body('nit')
    .notEmpty().withMessage('El NIT es requerido')
    .isLength({ min: 5, max: 20 }).withMessage('El NIT debe tener entre 5 y 20 caracteres')
    .matches(/^[A-Z0-9-]+$/i).withMessage('El NIT solo puede contener letras, números y guiones')
    .trim()
    .custom(checkNitUniqueness),
  
  body('contacto')
    .optional()
    .isLength({ min: 3, max: 255 }).withMessage('El contacto debe tener entre 3 y 255 caracteres')
    .trim(),
  
  body('estado')
    .optional()
    .isIn(['activo', 'inactivo', 'Activo', 'Inactivo', 'ACTIVO', 'INACTIVO'])
    .withMessage('El estado debe ser "activo" o "inactivo"'),
  
  handleValidationErrors,
];

const validateUpdate = [
  validateIdParam(),
  validateAllowedFields(['nombre', 'nit', 'contacto', 'estado']),
  
  body('nombre')
    .optional()
    .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres')
    .trim(),
  
  body('nit')
    .optional()
    .isLength({ min: 5, max: 20 }).withMessage('El NIT debe tener entre 5 y 20 caracteres')
    .matches(/^[A-Z0-9-]+$/i).withMessage('El NIT solo puede contener letras, números y guiones')
    .trim()
    .custom(checkNitUniqueness),
  
  body('contacto')
    .optional()
    .isLength({ min: 3, max: 255 }).withMessage('El contacto debe tener entre 3 y 255 caracteres')
    .trim(),
  
  body('estado')
    .optional()
    .isIn(['activo', 'inactivo', 'Activo', 'Inactivo', 'ACTIVO', 'INACTIVO'])
    .withMessage('El estado debe ser "activo" o "inactivo"'),
  
  handleValidationErrors,
];

const validateId = [
  validateIdParam(),
  handleValidationErrors,
];

const validateList = [
  ...validatePagination(),
  ...validateSorting(['nombre', 'nit', 'estado', 'createdAt']),
  
  query('nombre')
    .optional()
    .isLength({ min: 1, max: 100 }).withMessage('El nombre debe tener entre 1 y 100 caracteres'),
  
  query('nit')
    .optional()
    .isLength({ min: 1, max: 20 }).withMessage('El NIT debe tener entre 1 y 20 caracteres'),
  
  query('estado')
    .optional()
    .isIn(['activo', 'inactivo', 'Activo', 'Inactivo', 'ACTIVO', 'INACTIVO'])
    .withMessage('El estado debe ser "activo" o "inactivo"'),
  
  handleValidationErrors,
];

module.exports = {
  validateCreate,
  validateUpdate,
  validateId,
  validateList,
};

