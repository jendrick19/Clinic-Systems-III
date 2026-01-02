const { loginByIdentifier } = require('../services/AuthService');

/**
 * Handler para login por professionalRegister (odontólogos) o documentType + documentId (pacientes)
 */
const loginHandler = async (req, res, next) => {
  try {
    // Extraemos password junto con los otros campos
    const { tipoDocumento, numeroDocumento, professionalRegister, password } = req.body;

    // Validacion inicial de contraseña
    if (!password) {
      return res.status(400).json({
        codigo: 400,
        mensaje: 'La contraseña es obligatoria',
        tipo: 'ValidationError',
      });
    }

    // CASO 1: Si viene professionalRegister, es un odontólogo
    if (professionalRegister) {
      if (!professionalRegister.trim()) {
        return res.status(400).json({
          codigo: 400,
          mensaje: 'El registro profesional es requerido',
          tipo: 'ValidationError',
        });
      }

      // Llamamos al servicio con la contraseña
      const result = await loginByIdentifier(null, professionalRegister, password);
      
      return res.json({
        codigo: 200,
        mensaje: 'Login exitoso',
        tipo: result.type,
        data: result.data,
      });
    }

    // CASO 2: Si viene tipoDocumento y numeroDocumento, es un paciente
    if (tipoDocumento && numeroDocumento) {
      if (!tipoDocumento.trim() || !numeroDocumento.trim()) {
        return res.status(400).json({
          codigo: 400,
          mensaje: 'El tipo de documento y número de documento son requeridos',
          tipo: 'ValidationError',
        });
      }

      // Llamamos al servicio con la contraseña
      const result = await loginByIdentifier(tipoDocumento, numeroDocumento, password);
      
      return res.json({
        codigo: 200,
        mensaje: 'Login exitoso',
        tipo: result.type,
        data: result.data,
      });
    }

    // Si no cumple ninguno de los casos anteriores
    return res.status(400).json({
      codigo: 400,
      mensaje: 'Debe proporcionar: professionalRegister (odontólogo) o tipoDocumento + numeroDocumento (paciente)',
      tipo: 'ValidationError',
    });

  } catch (error) {
    // Log del error para debugging
    console.error('Error en login:', error);
    return next(error);
  }
};

module.exports = {
  loginHandler,
};