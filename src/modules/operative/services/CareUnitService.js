const { Op } = require('sequelize');
const careUnitRepository = require('../repositories/CareUnitRepository');
const { buildPaginationParams, buildPaginationResponse } = require('../../../shared/utils/paginationHelper');
const { NotFoundError, BusinessLogicError } = require('../../../shared/errors/CustomErrors');
const db = require('../../../../database/models');

const ALLOWED_TYPES = [
    'sede',
    'consultorio',
    'servicio'
];

const ALLOWED_STATUSES = [
    'activo',
    'inactivo'
];

const SORT_FIELDS = {
  nombre: 'name',
  tipo: 'type',
  estado: 'status',
  direccion: 'address',
};

const buildWhere = ({ nombre, tipo, estado, direccion }) => {
  const where = {};
  if (nombre) {
    where[Op.or] = [
      {
        name: {
          [Op.like]: `%${nombre}%`,
        },
      },
    ];
  }
  if (tipo) {
    where.type = {
      [Op.like]: `%${tipo.toLowerCase()}%`,
    };
  }
  if (direccion) {
    where.address = {
      [Op.like]: `%${direccion}%`,
    };
  }
  if (estado !== undefined) {
    if (typeof estado === 'string') {
      where.status = ['true', '1', 'activo', 'active'].includes(estado.toLowerCase());
    } else {
      where.status = Boolean(estado);
    }
  } else {
    where.status = true;
  }
  return where;
};

const listCareUnits = async ({
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
  const { count, rows } = await careUnitRepository.findAndCountAll({
    where,
    offset,
    limit: safeLimit,
    order: [[orderField, orderDirection]],
  });
  return buildPaginationResponse(rows, count, safePage, safeLimit);
};

const getCareUnitById = async (id) => {
  const careUnit = await careUnitRepository.findById(id);
  if (!careUnit) {
    throw new NotFoundError('Unidad de atención no encontrada');
  }
  return careUnit;
};

const createCareUnit = async (careUnitData) => {
  if (careUnitData.type && !ALLOWED_TYPES.includes(careUnitData.type)) {
    throw new BusinessLogicError(
      `El tipo "${careUnitData.type}" no está permitido. ` +
      `Tipos válidos: ${ALLOWED_TYPES.join(', ')}`
    );
  }
  return careUnitRepository.create(careUnitData);
};

const updateCareUnit = async (careUnit, payload) => {
  return careUnitRepository.update(careUnit, payload);
};

const softDeleteCareUnit = async (id) => {
    const careUnit = await getCareUnitById(id);
    careUnit.status = false;
    return careUnitRepository.save(careUnit);
  };
module.exports = {
  listCareUnits,
  getCareUnitById,
  createCareUnit,
  updateCareUnit,
  softDeleteCareUnit,
};
