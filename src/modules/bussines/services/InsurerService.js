const { Op } = require('sequelize');
const insurerRepository = require('../repositories/InsurerRepository');
const { buildPaginationParams, buildPaginationResponse } = require('../../../shared/utils/paginationHelper');
const { NotFoundError, BusinessLogicError } = require('../../../shared/errors/CustomErrors');

const SORT_FIELDS = {
  nombre: 'nombre',
  nit: 'nit',
  estado: 'estado',
  createdAt: 'createdAt',
};

const buildWhere = ({ nombre, nit, estado }) => {
  const where = {};
  
  if (nombre) {
    where.nombre = {
      [Op.like]: `%${nombre}%`,
    };
  }
  
  if (nit) {
    where.nit = {
      [Op.like]: `%${nit}%`,
    };
  }
  
  if (estado) {
    const estadoLower = estado.toLowerCase();
    if (['activo', 'inactivo'].includes(estadoLower)) {
      where.estado = estadoLower;
    }
  }
  
  return where;
};

const listInsurers = async ({
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
  
  const { count, rows } = await insurerRepository.findAndCountAll({
    where,
    offset,
    limit: safeLimit,
    order: [[orderField, orderDirection]],
  });
  
  return buildPaginationResponse(rows, count, safePage, safeLimit);
};

const getInsurerById = async (id) => {
  const insurer = await insurerRepository.findById(id);
  if (!insurer) {
    throw new NotFoundError('Aseguradora no encontrada');
  }
  return insurer;
};

const createInsurer = async (data) => {
  // Verificar que el NIT no esté duplicado
  const existingInsurer = await insurerRepository.findByNit(data.nit);
  if (existingInsurer) {
    throw new BusinessLogicError('Ya existe una aseguradora registrada con este NIT');
  }
  
  return insurerRepository.create(data);
};

const updateInsurer = async (insurer, payload) => {
  // Si se actualiza el NIT, verificar que no esté duplicado
  if (payload.nit && payload.nit !== insurer.nit) {
    const existingInsurer = await insurerRepository.findByNit(payload.nit);
    if (existingInsurer) {
      throw new BusinessLogicError('Ya existe una aseguradora registrada con este NIT');
    }
  }
  
  return insurerRepository.update(insurer, payload);
};

const softDeleteInsurer = async (insurer) => {
    
  if (insurer.estado === 'inactivo') {
    throw new BusinessLogicError('La aseguradora ya está inactiva');
  }
  
  return insurerRepository.changeStatus(insurer, 'inactivo');
};

module.exports = {
  listInsurers,
  getInsurerById,
  createInsurer,
  updateInsurer,
  softDeleteInsurer,
};

