const { AppError } = require('../errors/CustomErrors');

const errorHandler = (err, req, res, next) => {
  
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      codigo: err.statusCode,
      mensaje: err.message,
      tipo: err.name,
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'campo';
    const value = err.errors[0]?.value || '';
    return res.status(409).json({
      codigo: 409,
      mensaje: `El ${field} '${value}' ya está registrado`,
      tipo: 'ConflictError',
      campo: field,
    });
  }

  if (err.name === 'SequelizeValidationError') {
    const errores = err.errors.map(e => ({
      campo: e.path,
      mensaje: e.message,
      tipo: e.type,
    }));
    return res.status(400).json({
      codigo: 400,
      mensaje: 'Errores de validación en la base de datos',
      tipo: 'ValidationError',
      errores,
    });
  }
  
  if (err.name === 'SequelizeDatabaseError') {
    return res.status(400).json({
      codigo: 400,
      mensaje: 'Error en la consulta a la base de datos',
      tipo: 'DatabaseError',
      detalle: err.parent?.message || err.message,
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(409).json({
      codigo: 409,
      mensaje: 'Violación de restricción de clave foránea',
      tipo: 'ForeignKeyConstraintError',
    });
  }
  console.error('ERROR NO MANEJADO:', err);
  return res.status(500).json({
    codigo: 500,
    mensaje: 'Error interno del servidor',
    tipo: 'InternalError',
    ...(process.env.NODE_ENV === 'development' && {
      detalle: err.message,
      stack: err.stack,
    }),
  });
};

module.exports = errorHandler;
