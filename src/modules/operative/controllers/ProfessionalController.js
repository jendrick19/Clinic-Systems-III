const {
  listProfessionals,
  getProfessionalById,
  createProfessional,
  updateProfessional,
  softDeleteProfessional,
} = require('../services/ProfessionalService');

// Mapea el modelo de BD a la respuesta JSON que ve el usuario
const mapModelToResponse = (professional) => {
  if (!professional) {
    return null;
  }
  return {
    id: professional.id,
    userId: professional.userId,
    nombres: professional.names,
    apellidos: professional.surNames,
    registroProfesional: professional.professionalRegister,
    especialidad: professional.specialty,
    correo: professional.email,
    telefono: professional.phone,
    agendaHabilitada: professional.scheduleEnabled,
    estado: professional.status,
  };
};

// Mapea el body del request a los datos del Profesional
const mapRequestToCreate = (body) => {
  const payload = {
    names: body.nombres,
    surNames: body.apellidos,
    professionalRegister: body.registroProfesional, // Importante: Este campo se usará como Username
    specialty: body.especialidad ? body.especialidad.toString().trim().toLowerCase() : body.especialidad,
    email: body.correo,
  };

  if (body.userId !== undefined) payload.userId = Number(body.userId);
  if (body.telefono !== undefined) payload.phone = body.telefono;
  
  if (body.agendaHabilitada !== undefined) {
    if (typeof body.agendaHabilitada === 'string') {
      payload.scheduleEnabled = ['true', '1', 'activo', 'active'].includes(body.agendaHabilitada.toLowerCase());
    } else {
      payload.scheduleEnabled = Boolean(body.agendaHabilitada);
    }
  }

  if (body.estado !== undefined) {
    if (typeof body.estado === 'string') {
      payload.status = ['true', '1', 'activo', 'active'].includes(body.estado.toLowerCase());
    } else {
      payload.status = Boolean(body.estado);
    }
  }

  return payload;
};

const mapRequestToUpdate = (body) => {
  const payload = {};
  
  if (body.userId !== undefined) payload.userId = Number(body.userId);
  if (body.nombres !== undefined) payload.names = body.nombres;
  if (body.apellidos !== undefined) payload.surNames = body.apellidos;
  if (body.registroProfesional !== undefined) payload.professionalRegister = body.registroProfesional;
  if (body.especialidad !== undefined) payload.specialty = body.especialidad ? body.especialidad.toString().trim().toLowerCase() : body.especialidad;
  if (body.correo !== undefined) payload.email = body.correo;
  if (body.telefono !== undefined) payload.phone = body.telefono;
  
  if (body.agendaHabilitada !== undefined) {
    if (typeof body.agendaHabilitada === 'string') {
      payload.scheduleEnabled = ['true', '1', 'activo', 'active'].includes(body.agendaHabilitada.toLowerCase());
    } else {
      payload.scheduleEnabled = Boolean(body.agendaHabilitada);
    }
  }
  if (body.estado !== undefined) {
    if (typeof body.estado === 'string') {
      payload.status = ['true', '1', 'activo', 'active'].includes(body.estado.toLowerCase());
    } else {
      payload.status = Boolean(body.estado);
    }
  }
  return payload;
};

// Mapea los datos del Usuario (Login) desde el request
const mapUserFromRequest = (body) => {
  const userData = {};
  
  // El frontend envía la estructura "usuario": { password: "...", email: "..." }
  if (body.usuario) {
    if (body.usuario.username !== undefined) userData.username = body.usuario.username;
    if (body.usuario.email !== undefined) userData.email = body.usuario.email;
    
    // CORRECCIÓN CLAVE: Mapeamos 'password' correctamente para que el servicio lo reciba
    if (body.usuario.password !== undefined) {
      userData.password = body.usuario.password;
    }
    
    if (body.usuario.estado !== undefined) {
      if (typeof body.usuario.estado === 'string') {
        userData.status = ['true', '1', 'activo', 'active'].includes(body.usuario.estado.toLowerCase());
      } else {
        userData.status = Boolean(body.usuario.estado);
      }
    }
  }

  return userData;
};

// Handlers

const listHandler = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'apellidos',
      sortOrder = 'asc',
      nombres,
      apellidos,
      especialidad,
      estado,
    } = req.query;
    const result = await listProfessionals({
      page,
      limit,
      sortBy,
      sortOrder,
      filters: {
        nombres,
        apellidos,
        especialidad,
        estado,
      },
    });
    res.json({
      codigo: 200,
      mensaje: 'Lista de profesionales obtenida exitosamente',
      data: result.rows.map(mapModelToResponse),
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const professional = await getProfessionalById(id);
    return res.json({
      codigo: 200,
      mensaje: 'Profesional encontrado',
      data: mapModelToResponse(professional),
    });
  } catch (error) {
    return next(error);
  }
};

const createHandler = async (req, res, next) => {
  try {
    const professionalData = mapRequestToCreate(req.body);
    const userData = mapUserFromRequest(req.body);
    
    // Valores por defecto
    if (professionalData.status === undefined) {
      professionalData.status = true;
    }
    if (professionalData.scheduleEnabled === undefined) {
      professionalData.scheduleEnabled = false;
    }

    // Llamada al servicio (que creará Usuario y Profesional)
    const result = await createProfessional(professionalData, userData);
    
    return res.status(201).json({
      codigo: 201,
      mensaje: 'Profesional creado exitosamente',
      data: {
        user: {
          id: result.user.id,
          username: result.user.username,
          email: result.user.email,
          estado: result.user.status,
        },
        professional: mapModelToResponse(result.professional),
      },
    });
  } catch (error) {
    console.error('Error creando profesional:', error); // Log para depuración
    return next(error);
  }
};

const updateHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const professional = await getProfessionalById(id);
    const payload = mapRequestToUpdate(req.body);
    const updated = await updateProfessional(professional, payload);
    return res.json({
      codigo: 200,
      mensaje: 'Profesional actualizado exitosamente',
      data: mapModelToResponse(updated),
    });
  } catch (error) {
    return next(error);
  }
};

const deleteHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const professional = await getProfessionalById(id);
    await softDeleteProfessional(professional);
    return res.status(200).json({
      codigo: 200,
      mensaje: 'Profesional eliminado exitosamente',
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listHandler,
  getHandler,
  createHandler,
  updateHandler,
  deleteHandler,
};