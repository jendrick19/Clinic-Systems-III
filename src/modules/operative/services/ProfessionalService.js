const { Op } = require('sequelize');
const bcrypt = require('bcryptjs'); 
const professionalRepository = require('../repositories/ProfessionalRepository');
const { buildPaginationParams, buildPaginationResponse } = require('../../../shared/utils/paginationHelper');
const { NotFoundError, BusinessLogicError } = require('../../../shared/errors/CustomErrors');
const db = require('../../../../database/models');

const { Appointment } = db.modules.operative;

// Nota: La validación estricta está comentada más abajo.
// Mantenemos esta lista en minúsculas para consistencia con cómo se guarda en BD.
const ALLOWED_SPECIALTIES = [
  'odontología general',
  'ortodoncia',
  'endodoncia',
  'periodoncia',
  'odontopediatría',
  'cirugía oral y maxilofacial',
  'prótesis dental',
  'implantología',
  'estética dental',
  'patología oral',
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
    where.names = { [Op.like]: `%${nombres}%` };
  }
  if (apellidos) {
    where.surNames = { [Op.like]: `%${apellidos}%` };
  }
  if (especialidad) {
    where.specialty = { [Op.like]: `%${especialidad}%` };
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

const listProfessionals = async ({ page, limit, filters, sortBy, sortOrder }) => {
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

// --- AQUÍ ESTÁ LA CORRECCIÓN IMPORTANTE ---
const createProfessional = async (professionalData, userData) => {
  // 1. Validar especialidad (si aplica a tu negocio)
  /* Si deseas validar estrictamente las especialidades, descomenta esto:
  if (professionalData.specialty && !ALLOWED_SPECIALTIES.includes(professionalData.specialty)) {
    throw new BusinessLogicError(
      `La especialidad "${professionalData.specialty}" no está permitida.`
    );
  }
  */

  // 2. ASIGNACIÓN CRÍTICA: El Username SERÁ el Registro Profesional
  if (!professionalData.professionalRegister) {
      throw new BusinessLogicError('El Registro Profesional es obligatorio para crear el usuario.');
  }
  userData.username = professionalData.professionalRegister;

  // 3. Validar longitud mínima (para evitar error de BD "entre 3 y 50 caracteres")
  if (userData.username.length < 3) {
      throw new BusinessLogicError('El Registro Profesional debe tener al menos 3 caracteres.');
  }

  // 4. Hashear contraseña
  if (userData.password) {
     userData.passwordHash = await bcrypt.hash(userData.password, 10);
  } else {
     // Si por alguna razón no llega password, lanzamos error
     throw new BusinessLogicError('Se requiere una contraseña para registrar al profesional');
  }

  // 5. Llamar al repositorio
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
      `No se puede eliminar el profesional porque tiene ${activeAppointments} cita(s) activa(s).`
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