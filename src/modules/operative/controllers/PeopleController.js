const {
  listPeople,
  getPersonById,
  createPerson,
  updatePerson,
  softDeletePerson,
} = require('../services/PeopleService');

const mapModelToResponse = (person) => {
  if (!person) {
    return null;
  }
  return {
    id: person.id,
    tipoDocumento: person.documentType,
    numeroDocumento: person.documentId,
    nombres: person.names,
    apellidos: person.surNames,
    fechaNacimiento: person.dateOfBirth ? person.dateOfBirth.toISOString() : null,
    sexo: person.gender,
    telefono: person.phone,
    correo: person.email,
    direccion: person.address,
    contactoEmergencia: person.emergencyContact,
    patologias: person.patologias,
    estado: person.status,
  };
};

const mapRequestToCreate = (body) => {
  // El ID no se incluye en creación, se genera automáticamente por la BD
  const payload = {
    documentType: body.tipoDocumento,
    documentId: body.numeroDocumento,
    names: body.nombres,
    surNames: body.apellidos,
  };

  // Campos opcionales
  if (body.fechaNacimiento) {
    payload.dateOfBirth = new Date(body.fechaNacimiento);
  }
  if (body.sexo) {
    payload.gender = body.sexo.toLowerCase();
  }
  if (body.telefono !== undefined && body.telefono !== null && body.telefono !== '') {
    payload.phone = body.telefono;
  }
  if (body.correo !== undefined && body.correo !== null && body.correo !== '') {
    payload.email = body.correo;
  }
  if (body.direccion !== undefined && body.direccion !== null && body.direccion !== '') {
    payload.address = body.direccion;
  }
  if (body.contactoEmergencia !== undefined && body.contactoEmergencia !== null && body.contactoEmergencia !== '') {
    payload.emergencyContact = body.contactoEmergencia;
  }
  if (body.patologias !== undefined && body.patologias !== null && body.patologias !== '') {
    payload.patologias = body.patologias;
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

  if (body.tipoDocumento !== undefined) payload.documentType = body.tipoDocumento;
  if (body.numeroDocumento !== undefined) payload.documentId = body.numeroDocumento;
  if (body.nombres !== undefined) payload.names = body.nombres;
  if (body.apellidos !== undefined) payload.surNames = body.apellidos;
  if (body.fechaNacimiento !== undefined) {
    const date = new Date(body.fechaNacimiento);
    if (!Number.isNaN(date.getTime())) {
      payload.dateOfBirth = date;
    }
  }

  if (body.sexo !== undefined) payload.gender = body.sexo;
  if (body.telefono !== undefined) payload.phone = body.telefono;
  if (body.correo !== undefined) payload.email = body.correo;
  if (body.direccion !== undefined) payload.address = body.direccion;
  if (body.contactoEmergencia !== undefined) payload.emergencyContact = body.contactoEmergencia;
  if (body.patologias !== undefined) payload.patologias = body.patologias;
  if (body.estado !== undefined) {
    if (typeof body.estado === 'string') {
      payload.status = ['true', '1', 'activo', 'active'].includes(body.estado.toLowerCase());
    } else {
      payload.status = Boolean(body.estado);
    }
  }
  return payload;
};

const listHandler = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'apellidos',
      sortOrder = 'asc',
      tipoDocumento,
      numeroDocumento,
      edad,
      sexo,
      nombres,
      apellidos,
      estado,
    } = req.query;
    const result = await listPeople({
      page,
      limit,
      sortBy,
      sortOrder,
      filters: {
        tipoDocumento,
        numeroDocumento,
        edad,
        sexo,
        nombres,
        apellidos,
        estado,
      },
    });
    res.json({
      codigo: 200,
      mensaje: 'Lista de personas obtenida exitosamente',
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
    const person = await getPersonById(id);
    return res.json({
      codigo: 200,
      mensaje: 'Persona encontrada',
      data: mapModelToResponse(person),
    });
  } catch (error) {
    return next(error);
  }
};

const createHandler = async (req, res, next) => {
  try {
    const payload = mapRequestToCreate(req.body);
    if (payload.status === undefined) {
      payload.status = true;
    }
    const person = await createPerson(payload);
    return res.status(201).json({
      codigo: 201,
      mensaje: 'Persona creada exitosamente',
      data: mapModelToResponse(person),
    });
  } catch (error) {
    return next(error);
  }
};

const updateHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = mapRequestToUpdate(req.body);
    const updated = await updatePerson(id, payload);
    return res.json({
      codigo: 200,
      mensaje: 'Persona actualizada exitosamente',
      data: mapModelToResponse(updated),
    });
  } catch (error) {
    return next(error);
  }
};

const deleteHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    await softDeletePerson(id);
    return res.status(200).json({
      codigo: 200,
      mensaje: 'Persona eliminada exitosamente',
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
