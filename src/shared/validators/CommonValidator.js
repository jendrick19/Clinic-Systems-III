const { body, param, query, validationResult } = require('express-validator');
const crypto = require('crypto');

const pendingErrors = new Map();
const ERROR_BATCH_SIZE = 2;
const ERROR_STORAGE_TTL = 5 * 60 * 1000;

const generateRequestKey = (req) => {
  const method = req.method;
  const path = req.path;
  const bodyHash = crypto.createHash('md5').update(JSON.stringify(req.body || {})).digest('hex');
  return `${method}:${path}:${bodyHash}`;
};

const cleanupOldErrors = () => {
  const now = Date.now();
  for (const [key, data] of pendingErrors.entries()) {
    if (now - data.timestamp > ERROR_STORAGE_TTL) {
      pendingErrors.delete(key);
    }
  }
};

const handleValidationErrors = (req, res, next) => {
  cleanupOldErrors();

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorArray = errors.array();
    const hasDuplicateError = errorArray.some(err => 
      err.msg.includes('ya está registrado') || 
      err.msg.includes('ya existe')
    );
    
    const requestKey = generateRequestKey(req);
    const errorOffset = parseInt(req.headers['x-error-offset'] || '0', 10);
    
    let storedErrors = pendingErrors.get(requestKey);
    if (!storedErrors || storedErrors.errors.length !== errorArray.length) {
      storedErrors = {
        errors: errorArray,
        timestamp: Date.now()
      };
      pendingErrors.set(requestKey, storedErrors);
    }

    const totalErrors = storedErrors.errors.length;
    const startIndex = errorOffset;
    const endIndex = Math.min(startIndex + ERROR_BATCH_SIZE, totalErrors);
    const errorsToShow = storedErrors.errors.slice(startIndex, endIndex);
    const remainingErrors = totalErrors - endIndex;

    if (hasDuplicateError) {
      const response = {
        codigo: 409,
        mensaje: 'Conflicto: recurso duplicado',
        tipo: 'ConflictError',
        errores: errorsToShow.map(err => ({
          campo: err.path,
          mensaje: err.msg,
          valor: err.value,
        })),
        totalErrores: totalErrors,
        erroresMostrados: errorsToShow.length,
        erroresRestantes: remainingErrors,
      };

      if (remainingErrors > 0) {
        response.mensaje = `Conflicto: recurso duplicado (mostrando ${errorsToShow.length} de ${totalErrors})`;
        response.siguienteOffset = endIndex;
      }

      return res.status(409).json(response);
    }

    const response = {
      codigo: 400,
      mensaje: 'Errores de validación',
      tipo: 'ValidationError',
      errores: errorsToShow.map(err => ({
        campo: err.path,
        mensaje: err.msg,
        valor: err.value,
      })),
      totalErrores: totalErrors,
      erroresMostrados: errorsToShow.length,
      erroresRestantes: remainingErrors,
    };

    if (remainingErrors > 0) {
      response.mensaje = `Errores de validación (mostrando ${errorsToShow.length} de ${totalErrors})`;
      response.siguienteOffset = endIndex;
    }

    return res.status(400).json(response);
  }

  const requestKey = generateRequestKey(req);
  pendingErrors.delete(requestKey);

  return next();
};

const validateNames = () => 
  body('nombres')
    .notEmpty().withMessage('Los nombres son requeridos')
    .isLength({ min: 2, max: 100 }).withMessage('Los nombres deben tener entre 2 y 100 caracteres')
    .matches(/^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]+$/).withMessage('Los nombres solo pueden contener letras');
    
const validateNamesOptional = () => 
  body('nombres')
    .optional()
    .isLength({ min: 2, max: 100 }).withMessage('Los nombres deben tener entre 2 y 100 caracteres')
    .matches(/^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]+$/).withMessage('Los nombres solo pueden contener letras');

const validateSurnames = () => 
  body('apellidos')
    .notEmpty().withMessage('Los apellidos son requeridos')
    .isLength({ min: 2, max: 100 }).withMessage('Los apellidos deben tener entre 2 y 100 caracteres')
    .matches(/^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]+$/).withMessage('Los apellidos solo pueden contener letras');

const validateSurnamesOptional = () => 
  body('apellidos')
    .optional()
    .isLength({ min: 2, max: 100 }).withMessage('Los apellidos deben tener entre 2 y 100 caracteres')
    .matches(/^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]+$/).withMessage('Los apellidos solo pueden contener letras');

const validateEmail = (fieldName = 'correo') => 
  body(fieldName)
    .notEmpty().withMessage('El correo es requerido')
    .isEmail().withMessage('El correo debe ser una dirección válida')
    .normalizeEmail();

const validateEmailOptional = (fieldName = 'correo') => 
  body(fieldName)
    .optional()
    .isEmail().withMessage('El correo debe ser una dirección válida')
    .normalizeEmail();

const validatePhone = (fieldName = 'telefono') => 
  body(fieldName)
    .optional()
    .matches(/^\+?[0-9]{7,15}$/).withMessage('El teléfono debe contener entre 7 y 15 dígitos');

const validateStatus = (fieldName = 'estado') => 
  body(fieldName)
    .optional()
    .isBoolean().withMessage('El estado debe ser verdadero o falso');

const validateIdParam = () => 
  param('id')
    .notEmpty().withMessage('El ID es requerido')
    .isInt({ min: 1 }).withMessage('El ID debe ser un número entero positivo');

const validatePagination = () => [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('La página debe ser un número entero positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('El límite debe ser un número entre 1 y 100'),
];

const validateSorting = (allowedFields) => [
  query('sortBy')
    .optional()
    .isIn(allowedFields).withMessage(`Campo de ordenamiento inválido. Campos permitidos: ${allowedFields.join(', ')}`),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc']).withMessage('El orden debe ser "asc" o "desc"'),
];

const validateStatusQuery = () => 
  query('estado')
    .optional()
    .isIn(['true', 'false', '1', '0', 'activo', 'inactive', 'active']).withMessage('Estado inválido');

module.exports = {
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
};
