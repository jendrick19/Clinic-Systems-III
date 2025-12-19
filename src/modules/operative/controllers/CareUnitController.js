const {
  listCareUnits,
  getCareUnitById,
  createCareUnit,
  updateCareUnit,
  softDeleteCareUnit,
} = require('../services/CareUnitService');

const mapModelToResponse = (careUnit) => {
  if (!careUnit) {
    return null;
  }
  return {
    id: careUnit.id,
    nombre: careUnit.name,
    tipo: careUnit.type,
    direccion: careUnit.address,
    telefono: careUnit.telephone,
    horarioAtencion: careUnit.businessHours,
    estado: careUnit.status,
  };
};

const mapRequestToCreate = (body) => {
  const payload = {
    name: body.nombre,
    type: body.tipo,
  };
  if (body.direccion !== undefined) payload.address = body.direccion;
  if (body.telefono !== undefined) payload.telephone = body.telefono;
  if (body.horarioAtencion !== undefined) payload.businessHours = body.horarioAtencion;
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
  if (body.nombre !== undefined) payload.name = body.nombre;
  if (body.tipo !== undefined) payload.type = body.tipo;
  if (body.direccion !== undefined) payload.address = body.direccion;
  if (body.telefono !== undefined) payload.telephone = body.telefono;
  if (body.horarioAtencion !== undefined) payload.businessHours = body.horarioAtencion;
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
      sortBy = 'nombre',
      sortOrder = 'asc',
      nombre,
      tipo,
      estado,
      direccion,
    } = req.query;
    const result = await listCareUnits({
      page,
      limit,
      sortBy,
      sortOrder,
      filters: {
        nombre,
        tipo,
        estado,
        direccion,
      },
    });
    res.json({
      codigo: 200,
      mensaje: 'Lista de unidades de atención obtenida exitosamente',
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
    const careUnit = await getCareUnitById(id);
    return res.json({
      codigo: 200,
      mensaje: 'Unidad de atención encontrada',
      data: mapModelToResponse(careUnit),
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
    const careUnit = await createCareUnit(payload);
    return res.status(201).json({
      codigo: 201,
      mensaje: 'Unidad de atención creada exitosamente',
      data: mapModelToResponse(careUnit),
    });
  } catch (error) {
    return next(error);
  }
};

const updateHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const careUnit = await getCareUnitById(id);
    const payload = mapRequestToUpdate(req.body);
    const updated = await updateCareUnit(careUnit, payload);
    return res.json({
      codigo: 200,
      mensaje: 'Unidad de atención actualizada exitosamente',
      data: mapModelToResponse(updated),
    });
  } catch (error) {
    return next(error);
  }
};

const deleteHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    await softDeleteCareUnit(id);
    return res.status(200).json({
      codigo: 200,
      mensaje: 'Unidad de atención eliminada exitosamente',
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