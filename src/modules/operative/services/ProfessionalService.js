const { Op } = require('sequelize');
const professionalRepository = require('../repositories/ProfessionalRepository');
const { buildPaginationParams, buildPaginationResponse } = require('../../../shared/utils/paginationHelper');
const { NotFoundError, BusinessLogicError } = require('../../../shared/errors/CustomErrors');
const db = require('../../../../database/models');

const { Appointment } = db.modules.operative;

const ALLOWED_SPECIALTIES = [
  'Cardiología',
  'Pediatría',
  'Traumatología',
  'Dermatología',
  'Neurología',
  'Oftalmología',
  'Ginecología',
  'Psiquiatría',
  'Medicina General',
  'Odontología',
];

const SORT_FIELDS = {
  nombres: 'names',
  apellidos: 'surNames',
  especialidad: 'specialty',
  registro: 'professionalRegister',
  createdAt: 'createdAt',
};

const buildWhere = ({ nombres, apellidos, estado, especialidad }) => {
  const where = {};
  if (nombres) {
    where.names = {
      [Op.like]: `%${nombres}%`,
    };
  }
  if (apellidos) {
    where.surNames = {
      [Op.like]: `%${apellidos}%`,
    };
  }
  if (especialidad) {
    where.specialty = {
      [Op.like]: `%${especialidad}%`,
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

const listProfessionals = async ({
  page,
  limit,
  filters,
  sortBy,
  sortOrder,
}) => {
  const { safePage, safeLimit, offset } = buildPaginationParams(page, limit);
  const orderField = SORT_FIELDS[sortBy] || SORT_FIELDS.apellidos;
  const orderDirection = sortOrder === 'desc' ? 'DESC' : 'ASC';
  const where = buildWhere(filters);
  const { count, rows } = await professionalRepository.findAndCountAll({
    where,
    offset,
    limit: safeLimit,
    order: [[orderField, orderDirection]],
  });
  return buildPaginationResponse(rows, count, safePage, safeLimit);
};

const getProfessionalById = async (id) => {
  const professional = await professionalRepository.findById(id);
  if (!professional) {
    throw new NotFoundError('Profesional no encontrado');
  }
  return professional;
};

const createProfessional = async (professionalData, userData) => {
  if (professionalData.specialty && !ALLOWED_SPECIALTIES.includes(professionalData.specialty)) {
    throw new BusinessLogicError(
      `La especialidad "${professionalData.specialty}" no está permitida. ` +
      `Especialidades válidas: ${ALLOWED_SPECIALTIES.join(', ')}`
    );
  }
  return professionalRepository.createWithUser(professionalData, userData);
};

const updateProfessional = async (professional, payload) => {
  return professionalRepository.update(professional, payload);
};

const softDeleteProfessional = async (professional) => {
  const activeAppointments = await Appointment.count({
    where: {
      professionalId: professional.id,
      status: {
        [Op.notIn]: ['cancelada', 'completada'],
      },
    },
  });
  if (activeAppointments > 0) {
    throw new BusinessLogicError(
      `No se puede eliminar el profesional porque tiene ${activeAppointments} cita(s) activa(s). ` +
      'Debe cancelar o completar todas las citas antes de eliminar el profesional.'
    );
  }
  return professionalRepository.changeStatus(professional);
};
module.exports = {
  listProfessionals,
  getProfessionalById,
  createProfessional,
  updateProfessional,
  softDeleteProfessional,
};
