const { Op } = require('sequelize');
const consentRepository = require('../repositories/ConsentRepository');
const { buildPaginationParams, buildPaginationResponse } = require('../../../shared/utils/paginationHelper');
const { addDateRangeToWhere } = require('../../../shared/utils/dateRangeHelper');
const { NotFoundError, BusinessLogicError } = require('../../../shared/errors/CustomErrors');
const db = require('../../../../database/models');

const VALID_METHODS = ['firma digital', 'aceptación verbal con registro'];

const SORT_FIELDS = {
  fecha: 'consentDate',
  persona: 'peopleId',
  procedimiento: 'procedureType',
  metodo: 'method',
  createdAt: 'createdAt',
};

const normalizeMethod = (method) => {
  if (!method || typeof method !== 'string') {
    return null;
  }
  return method.toLowerCase().trim();
};

const validateConsentMethod = (method) => {
  if (!method) {
    throw new BusinessLogicError('El método de consentimiento es requerido');
  }

  const normalizedMethod = normalizeMethod(method);

  if (!VALID_METHODS.includes(normalizedMethod)) {
    throw new BusinessLogicError(
      `Método de consentimiento "${method}" no es válido. Métodos válidos: ${VALID_METHODS.join(', ')}`
    );
  }
  return normalizedMethod;
};

const validatePeopleExists = async (peopleId) => {
  
  const people = await db.modules.operative.PeopleAttended.findByPk(peopleId);
  
  if (!people) {
    throw new NotFoundError('Persona no encontrada');
  }
  return people;
};

const buildWhere = ({ persona, documento, procedimiento, metodo, fechaDesde, fechaHasta }) => {
  
  const where = {};

  if (persona) {
    where.peopleId = Number(persona);
  }
  if (procedimiento) {
    where.procedureType = {
      [Op.like]: `%${procedimiento}%`
    };
  }
  if (metodo) {
    where.method = normalizeMethod(metodo);
  }

  addDateRangeToWhere(where, 'consentDate', fechaDesde, fechaHasta);

  return where;
};

const listConsents = async ({
  page,
  limit,
  filters,
  sortBy,
  sortOrder,
}) => {
  const { safePage, safeLimit, offset } = buildPaginationParams(page, limit);

  const orderField = SORT_FIELDS[sortBy] || SORT_FIELDS.fecha;

  const orderDirection = sortOrder === 'desc' ? 'DESC' : 'ASC';

  const where = buildWhere(filters || {});

  const include = [];

  if (filters && filters.documento) {
    include.push({
      model: db.modules.operative.PeopleAttended,
      as: 'peopleAttended',
      where: {
        documentId: {
          [Op.like]: `%${filters.documento}%`
        }
      },
      required: true
    });
  } else {
    include.push({
      model: db.modules.operative.PeopleAttended,
      as: 'peopleAttended'
    });
  }
  const { count, rows } = await consentRepository.findAndCountAll({
    where,
    offset,
    limit: safeLimit,
    order: [[orderField, orderDirection]],
    include,
  });

  return buildPaginationResponse(rows, count, safePage, safeLimit);
};

const getConsentById = async (id) => {
  
  const consent = await consentRepository.findById(id);
 
  if (!consent) {
    throw new NotFoundError('Consentimiento no encontrado');
  }

  return consent;
};

const createConsent = async (consentData) => {
  if (!consentData.peopleId) {
    throw new BusinessLogicError('El ID de la persona es requerido');
  }
  if (!consentData.procedureType) {
    throw new BusinessLogicError('El tipo de procedimiento es requerido');
  }
  await validatePeopleExists(consentData.peopleId);
  if (consentData.method) {
    consentData.method = validateConsentMethod(consentData.method);
  }
  if (!consentData.consentDate) {
    consentData.consentDate = new Date();
  }
  return consentRepository.create(consentData);
};

const updateConsent = async (id, payload) => {

  const consent = await getConsentById(id);

  if (payload.peopleId !== undefined && payload.peopleId !== consent.peopleId) {
    throw new BusinessLogicError('No se puede cambiar la persona de un consentimiento existente');
  }
  if (payload.method !== undefined && payload.method !== consent.method) {
    payload.method = validateConsentMethod(payload.method);
  }

  return consentRepository.update(consent, payload);
};

const deleteConsent = async (id) => {
  
  const consent = await getConsentById(id);

  return consentRepository.remove(consent);
};

module.exports = {
  listConsents,
  getConsentById,
  createConsent,
  updateConsent,
  deleteConsent,
};
