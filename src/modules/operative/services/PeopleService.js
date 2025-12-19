const { Op } = require('sequelize');
const peopleRepository = require('../repositories/PeopleRepository');
const { buildPaginationParams, buildPaginationResponse } = require('../../../shared/utils/paginationHelper');
const { NotFoundError, ConflictError, BusinessLogicError } = require('../../../shared/errors/CustomErrors');

const SORT_FIELDS = {
  nombres: 'names',
  apellidos: 'surNames',
  fechaNacimiento: 'dateOfBirth',
  createdAt: 'createdAt',
};

const buildAgeFilter = (age) => {
  if (Number.isNaN(age)) {
    return null;
  }
  const today = new Date();
  const start = new Date(today);
  start.setFullYear(today.getFullYear() - (age + 1));
  start.setDate(start.getDate() + 1);
  const end = new Date(today);
  end.setFullYear(today.getFullYear() - age);
  return {
    [Op.between]: [start, end],
  };
};

const buildWhere = ({ tipoDocumento, numeroDocumento, edad, sexo, nombres, apellidos, estado }) => {
  const where = {};
  if (tipoDocumento) {
    where.documentType = tipoDocumento.toLowerCase();
  }
  if (numeroDocumento) {
    where.documentId = {
      [Op.like]: `%${numeroDocumento}%`,
    };
  }
  if (sexo) {
    where.gender = sexo;
  }
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
  if (edad !== undefined) {
    const ageNumber = Number(edad);
    const dateFilter = buildAgeFilter(ageNumber);
    if (dateFilter) {
      where.dateOfBirth = dateFilter;
    }
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

const listPeople = async ({
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
  const { count, rows } = await peopleRepository.findAndCountAll({
    where,
    offset,
    limit: safeLimit,
    order: [[orderField, orderDirection]],
  });
  return buildPaginationResponse(rows, count, safePage, safeLimit);
};

const getPersonById = async (id) => {
  const person = await peopleRepository.findById(id);
  if (!person) {
    throw new NotFoundError('Persona no encontrada');
  }
  return person;
};

const createPerson = async (payload) => {
  if (payload.documentId) {
    const existingPerson = await peopleRepository.findByDocument(
      payload.documentType,
      payload.documentId
    );
    if (existingPerson) {
      throw new ConflictError(
        `Ya existe una persona registrada con el documento ${payload.documentType}: ${payload.documentId}`
      );
    }
  }
  return peopleRepository.create(payload);
};

const updatePerson = async (id, payload) => {
  const person = await getPersonById(id);
  if (payload.documentId && (payload.documentId !== person.documentId || payload.documentType !== person.documentType)) {
    const existingPerson = await peopleRepository.findByDocument(
      payload.documentType || person.documentType,
      payload.documentId,
      person.id
    );
    if (existingPerson) {
      throw new ConflictError(
        `Ya existe otra persona registrada con el documento ${payload.documentType || person.documentType}: ${payload.documentId}`
      );
    }
  }
  return peopleRepository.update(person, payload);
};

const softDeletePerson = async (id) => {
  const person = await getPersonById(id);
  person.status = false;
  return peopleRepository.save(person);
};
module.exports = {
  listPeople,
  getPersonById,
  createPerson,
  updatePerson,
  softDeletePerson,
};
