class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Datos de entrada inválidos') {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message = 'El recurso ya existe') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

class BusinessLogicError extends AppError {
  constructor(message = 'Error en la lógica de negocio') {
    super(message, 422);
    this.name = 'BusinessLogicError';
  }
}

class InternalError extends AppError {
  constructor(message = 'Error interno del servidor') {
    super(message, 500);
    this.name = 'InternalError';
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  BusinessLogicError,
  InternalError,
};
