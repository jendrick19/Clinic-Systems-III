const {
  listPlans,
  getPlanById,
  createPlan,
  updatePlan,
  softDeletePlan,
} = require('../services/PlanService');

const mapModelToResponse = (plan) => {
  if (!plan) {
    return null;
  }
  return {
    id: plan.id,
    aseguradoraId: plan.aseguradoraId,
    aseguradora: plan.aseguradora ? {
      id: plan.aseguradora.id,
      nombre: plan.aseguradora.nombre,
      nit: plan.aseguradora.nit,
      estado: plan.aseguradora.estado,
    } : null,
    nombre: plan.nombre,
    codigo: plan.codigo,
    tipo: plan.tipo,
    condicionesGenerales: plan.condicionesGenerales,
    activo: plan.activo,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
};

const mapRequestToCreate = (body) => {
  const payload = {
    aseguradoraId: body.aseguradoraId,
    nombre: body.nombre,
    codigo: body.codigo,
  };

  if (body.tipo !== undefined) {
    payload.tipo = body.tipo;
  }

  if (body.condicionesGenerales !== undefined) {
    payload.condicionesGenerales = body.condicionesGenerales;
  }

  if (body.activo !== undefined) {
    if (typeof body.activo === 'string') {
      payload.activo = ['true', '1', 'activo', 'active'].includes(body.activo.toLowerCase());
    } else {
      payload.activo = Boolean(body.activo);
    }
  } else {
    payload.activo = true;
  }

  return payload;
};

const mapRequestToUpdate = (body) => {
  const payload = {};

  if (body.aseguradoraId !== undefined) {
    payload.aseguradoraId = body.aseguradoraId;
  }

  if (body.nombre !== undefined) {
    payload.nombre = body.nombre;
  }

  if (body.codigo !== undefined) {
    payload.codigo = body.codigo;
  }

  if (body.tipo !== undefined) {
    payload.tipo = body.tipo;
  }

  if (body.condicionesGenerales !== undefined) {
    payload.condicionesGenerales = body.condicionesGenerales;
  }

  if (body.activo !== undefined) {
    if (typeof body.activo === 'string') {
      payload.activo = ['true', '1', 'activo', 'active'].includes(body.activo.toLowerCase());
    } else {
      payload.activo = Boolean(body.activo);
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
      codigo,
      tipo,
      activo,
      aseguradoraId,
    } = req.query;

    const result = await listPlans({
      page,
      limit,
      sortBy,
      sortOrder,
      filters: {
        nombre,
        codigo,
        tipo,
        activo,
        aseguradoraId,
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

const getHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const plan = await getPlanById(id);
    
    return res.json({
      codigo: 200,
      mensaje: 'Plan encontrado',
      data: mapModelToResponse(plan),
    });
  } catch (error) {
    return next(error);
  }
};

const createHandler = async (req, res, next) => {
  try {
    const planData = mapRequestToCreate(req.body);
    const plan = await createPlan(planData);
    
    // Recargar con las relaciones
    const planWithRelations = await getPlanById(plan.id);
    
    return res.status(201).json({
      codigo: 201,
      mensaje: 'Plan creado exitosamente',
      data: mapModelToResponse(planWithRelations),
    });
  } catch (error) {
    return next(error);
  }
};

const updateHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const plan = await getPlanById(id);
    const payload = mapRequestToUpdate(req.body);
    await updatePlan(plan, payload);
    
    // Recargar con las relaciones
    const updated = await getPlanById(id);
    
    return res.json({
      codigo: 200,
      mensaje: 'Plan actualizado exitosamente',
      data: mapModelToResponse(updated),
    });
  } catch (error) {
    return next(error);
  }
};

const deleteHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const plan = await getPlanById(id);
    await softDeletePlan(plan);
    
    return res.status(200).json({
      codigo: 200,
      mensaje: 'Plan eliminado exitosamente',
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

