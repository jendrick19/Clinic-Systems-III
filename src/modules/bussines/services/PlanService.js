const { Op } = require('sequelize');
const planRepository = require('../repositories/PlanRepository');
const insurerRepository = require('../repositories/InsurerRepository');
const { buildPaginationParams, buildPaginationResponse } = require('../../../shared/utils/paginationHelper');
const { NotFoundError, BusinessLogicError } = require('../../../shared/errors/CustomErrors');

const SORT_FIELDS = {
  nombre: 'nombre',
  codigo: 'codigo',
  tipo: 'tipo',
  activo: 'activo',
  createdAt: 'createdAt',
};

const buildWhere = ({ nombre, codigo, tipo, activo, aseguradoraId }) => {
  const where = {};
  
  if (nombre) {
    where.nombre = {
      [Op.like]: `%${nombre}%`,
    };
  }
  
  if (codigo) {
    where.codigo = {
      [Op.like]: `%${codigo}%`,
    };
  }
  
  if (tipo) {
    where.tipo = {
      [Op.like]: `%${tipo}%`,
    };
  }
  
  if (aseguradoraId) {
    where.aseguradoraId = aseguradoraId;
  }
  
  if (activo !== undefined) {
    if (typeof activo === 'string') {
      where.activo = ['true', '1', 'activo', 'active'].includes(activo.toLowerCase());
    } else {
      where.activo = Boolean(activo);
    }
  }
  
  return where;
};

const listPlans = async ({
  page,
  limit,
  filters,
  sortBy,
  sortOrder,
}) => {
  const { safePage, safeLimit, offset } = buildPaginationParams(page, limit);
  const orderField = SORT_FIELDS[sortBy] || SORT_FIELDS.nombre;
  const orderDirection = sortOrder === 'desc' ? 'DESC' : 'ASC';
  const where = buildWhere(filters);
  
  const { count, rows } = await planRepository.findAndCountAll({
    where,
    offset,
    limit: safeLimit,
    order: [[orderField, orderDirection]],
  });
  
  return buildPaginationResponse(rows, count, safePage, safeLimit);
};

const getPlanById = async (id) => {
  const plan = await planRepository.findById(id);
  if (!plan) {
    throw new NotFoundError('Plan no encontrado');
  }
  return plan;
};

const createPlan = async (data) => {
  // Verificar que la aseguradora existe y está activa
  const insurer = await insurerRepository.findById(data.aseguradoraId);
  if (!insurer) {
    throw new NotFoundError('La aseguradora especificada no existe');
  }
  
  if (insurer.estado !== 'activo') {
    throw new BusinessLogicError('No se puede crear un plan para una aseguradora inactiva');
  }
  
  // Verificar que el código no esté duplicado
  const existingPlan = await planRepository.findByCodigo(data.codigo);
  if (existingPlan) {
    throw new BusinessLogicError('Ya existe un plan registrado con este código');
  }
  
  return planRepository.create(data);
};

const updatePlan = async (plan, payload) => {
  // Si se actualiza la aseguradora, verificar que existe y está activa
  if (payload.aseguradoraId && payload.aseguradoraId !== plan.aseguradoraId) {
    const insurer = await insurerRepository.findById(payload.aseguradoraId);
    if (!insurer) {
      throw new NotFoundError('La aseguradora especificada no existe');
    }
    
    if (insurer.estado !== 'activo') {
      throw new BusinessLogicError('No se puede asignar un plan a una aseguradora inactiva');
    }
  }
  
  // Si se actualiza el código, verificar que no esté duplicado
  if (payload.codigo && payload.codigo !== plan.codigo) {
    const existingPlan = await planRepository.findByCodigo(payload.codigo);
    if (existingPlan) {
      throw new BusinessLogicError('Ya existe un plan registrado con este código');
    }
  }
  
  return planRepository.update(plan, payload);
};

const softDeletePlan = async (plan) => {
  if (!plan.activo) {
    throw new BusinessLogicError('El plan ya está inactivo');
  }
  
  // Futuro: validar si tiene afiliaciones activas
  
  return planRepository.changeStatus(plan, false);
};

module.exports = {
  listPlans,
  getPlanById,
  createPlan,
  updatePlan,
  softDeletePlan,
};

