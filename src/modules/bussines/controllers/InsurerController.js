const {
  listInsurers,
  getInsurerById,
  createInsurer,
  updateInsurer,
  softDeleteInsurer,
} = require('../services/InsurerService');

/**
 * Mapea el modelo de base de datos a la respuesta del API
 */
const mapModelToResponse = (insurer) => {
  if (!insurer) {
    return null;
  }
  return {
    id: insurer.id,
    nombre: insurer.nombre,
    nit: insurer.nit,
    contacto: insurer.contacto,
    estado: insurer.estado,
    createdAt: insurer.createdAt,
    updatedAt: insurer.updatedAt,
  };
};

/**
 * Mapea la petición de creación al formato del modelo
 */
const mapRequestToCreate = (body) => {
  const payload = {
    nombre: body.nombre,
    nit: body.nit,
  };

  if (body.contacto !== undefined) {
    payload.contacto = body.contacto;
  }

  if (body.estado !== undefined) {
    const estadoLower = body.estado.toLowerCase();
    if (['activo', 'inactivo'].includes(estadoLower)) {
      payload.estado = estadoLower;
    }
  } else {
    payload.estado = 'activo';
  }

  return payload;
};

/**
 * Mapea la petición de actualización al formato del modelo
 */
const mapRequestToUpdate = (body) => {
  const payload = {};

  if (body.nombre !== undefined) {
    payload.nombre = body.nombre;
  }

  if (body.nit !== undefined) {
    payload.nit = body.nit;
  }

  if (body.contacto !== undefined) {
    payload.contacto = body.contacto;
  }

  if (body.estado !== undefined) {
    const estadoLower = body.estado.toLowerCase();
    if (['activo', 'inactivo'].includes(estadoLower)) {
      payload.estado = estadoLower;
    }
  }

  return payload;
};

/**
 * Handler para listar aseguradoras
 */
const listHandler = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'nombre',
      sortOrder = 'asc',
      nombre,
      nit,
      estado,
    } = req.query;

    const result = await listInsurers({
      page,
      limit,
      sortBy,
      sortOrder,
      filters: {
        nombre,
        nit,
        estado,
      },
    });

    res.json({
      data: result.rows.map(mapModelToResponse),
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handler para obtener una aseguradora por ID
 */
const getHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const insurer = await getInsurerById(id);
    
    return res.json({
      codigo: 200,
      mensaje: 'Aseguradora encontrada',
      data: mapModelToResponse(insurer),
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Handler para crear una aseguradora
 */
const createHandler = async (req, res, next) => {
  try {
    const insurerData = mapRequestToCreate(req.body);
    const insurer = await createInsurer(insurerData);
    
    return res.status(201).json({
      codigo: 201,
      mensaje: 'Aseguradora creada exitosamente',
      data: mapModelToResponse(insurer),
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Handler para actualizar una aseguradora
 */
const updateHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const insurer = await getInsurerById(id);
    const payload = mapRequestToUpdate(req.body);
    const updated = await updateInsurer(insurer, payload);
    
    return res.json({
      codigo: 200,
      mensaje: 'Aseguradora actualizada exitosamente',
      data: mapModelToResponse(updated),
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Handler para eliminar (soft delete) una aseguradora
 */
const deleteHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const insurer = await getInsurerById(id);
    await softDeleteInsurer(insurer);
    
    return res.status(200).json({
      codigo: 200,
      mensaje: 'Aseguradora eliminada exitosamente',
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

