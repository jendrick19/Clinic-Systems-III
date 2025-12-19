const { Op } = require('sequelize');
const episodeRepository = require('../repositories/EpisodeRepository');
const { buildPaginationParams, buildPaginationResponse } = require('../../../shared/utils/paginationHelper');
const { addDateRangeToWhere } = require('../../../shared/utils/dateRangeHelper');
const { NotFoundError, BusinessLogicError, ConflictError } = require('../../../shared/errors/CustomErrors');
const db = require('../../../../database/models');

const VALID_STATUSES = ['abierto', 'cerrado'];

const ALLOWED_TRANSITIONS = {
  'abierto': ['cerrado'],
  'cerrado': []
};

const VALID_TYPES = ['consulta', 'procedimiento', 'control', 'urgencia'];

const normalizeStatus = (status) => {
  if (typeof status === 'string') {
    return status.toLowerCase();
  }

  return status;
};

const normalizeType = (type) => {
  if (typeof type === 'string') {
    return type.toLowerCase();
  }

  return type;
};

const SORT_FIELDS = {
  fecha: 'openingDate',
  estado: 'status',
  tipo: 'type',
  paciente: 'peopleId',
  createdAt: 'createdAt',
};

const buildWhere = ({ paciente, estado, tipo, fechaDesde, fechaHasta }) => {
  
  const where = {};

  if (paciente) {
    where.peopleId = Number(paciente);
  }
  if (estado) {
    if (Array.isArray(estado)) {
      where.status = { [Op.in]: estado.map(normalizeStatus) };
    } else {
      where.status = normalizeStatus(estado);
    }
  }
  if (tipo) {
    if (Array.isArray(tipo)) {
      where.type = { [Op.in]: tipo.map(normalizeType) };
    } else {
      where.type = normalizeType(tipo);
    }
  }

  addDateRangeToWhere(where, 'openingDate', fechaDesde, fechaHasta);
  
  return where;
};

const buildInclude = ({ nombrePaciente, documentoPaciente }) => {
  
  const include = [
    { model: db.modules.operative.PeopleAttended, as: 'peopleAttended' },
    { model: db.modules.clinic.ClinicalNote, as: 'clinicalNotes' },
    { model: db.modules.clinic.Diagnosis, as: 'diagnosis' }
  ];

  if (nombrePaciente) {
    include[0].where = {
      [Op.or]: [
        { names: { [Op.like]: `%${nombrePaciente}%` } },
        { surNames: { [Op.like]: `%${nombrePaciente}%` } },
      ]
    };
  }
  if (documentoPaciente) {
    include[0].where = include[0].where || {};
    include[0].where.documentId = {
      [Op.like]: `%${documentoPaciente}%`
    };
  }

  return include;
};

const listEpisodes = async ({
  page,
  limit,
  filters,
  sortBy,
  sortOrder,
}) => {
  const { safePage, safeLimit, offset } = buildPaginationParams(page, limit);
  const { nombrePaciente, documentoPaciente, ...rawFilters } = filters || {};
  const orderField = SORT_FIELDS[sortBy] || SORT_FIELDS.fecha;
  const orderDirection = sortOrder === 'desc' ? 'DESC' : 'ASC';
  const where = buildWhere(rawFilters);
  const include = buildInclude({ nombrePaciente, documentoPaciente });
  const { count, rows } = await episodeRepository.findAndCountAll({
    where,
    offset,
    limit: safeLimit,
    order: [[orderField, orderDirection]],
    include
  });

  return buildPaginationResponse(rows, count, safePage, safeLimit);
};

const getEpisodeById = async (id) => {
  const episode = await episodeRepository.findById(id);
  if (!episode) {
    throw new NotFoundError('Episodio no encontrado');
  }

  return episode;
};

const validateStatusTransition = (oldStatus, newStatus) => {

  const normalizedOldStatus = normalizeStatus(oldStatus);

  const normalizedNewStatus = normalizeStatus(newStatus);

  if (!VALID_STATUSES.includes(normalizedNewStatus)) {
    throw new BusinessLogicError(`Estado "${newStatus}" no es válido. Estados válidos: ${VALID_STATUSES.join(', ')}`);
  }
  if (normalizedOldStatus === normalizedNewStatus) {
    return true;
  }
  const allowedNextStatuses = ALLOWED_TRANSITIONS[normalizedOldStatus] || [];
  if (!allowedNextStatuses.includes(normalizedNewStatus)) {
    throw new BusinessLogicError(
      `No se puede cambiar de "${oldStatus}" a "${newStatus}". ` +
      `Estados permitidos: ${allowedNextStatuses.join(', ') || 'ninguno (estado final)'}`
    );
  }

  return true;

};

const validateEpisodeType = (type) => {
  if (!VALID_TYPES.includes(type)) {
    throw new BusinessLogicError(`Tipo "${type}" no es válido. Tipos válidos: ${VALID_TYPES.join(', ')}`);
  }

  return true;

};

const createEpisode = async (episodeData) => {
  if (!episodeData.peopleId) {
    throw new BusinessLogicError('El ID del paciente es requerido');
  }
  const peopleAttended = await db.modules.operative.PeopleAttended.findByPk(episodeData.peopleId);
  if (!peopleAttended) {
    throw new NotFoundError('Paciente no encontrado');
  }
  if (!peopleAttended.status) {
    throw new BusinessLogicError('El paciente está inactivo');
  }
  if (!episodeData.type) {
    throw new BusinessLogicError('El tipo de episodio es requerido');
  }
  validateEpisodeType(episodeData.type);
  if (episodeData.type) {
    episodeData.type = normalizeType(episodeData.type);
  }
  if (!episodeData.status) {
    episodeData.status = 'abierto';
  } else {
    episodeData.status = normalizeStatus(episodeData.status);
  }
  if (!VALID_STATUSES.includes(episodeData.status)) {
    throw new BusinessLogicError(`Estado "${episodeData.status}" no es válido. Estados válidos: ${VALID_STATUSES.join(', ')}`);
  }
  if (!VALID_TYPES.includes(episodeData.type)) {
    throw new BusinessLogicError(`Tipo "${episodeData.type}" no es válido. Tipos válidos: ${VALID_TYPES.join(', ')}`);
  }
  if (!episodeData.openingDate) {
    episodeData.openingDate = new Date();
  }

  return episodeRepository.create(episodeData);

};

const updateEpisode = async (id, payload) => {
  const episode = await getEpisodeById(id);
  if (payload.status !== undefined) {
    payload.status = normalizeStatus(payload.status);
    if (payload.status !== episode.status) {
      validateStatusTransition(episode.status, payload.status);
    }
  }
  if (payload.type !== undefined) {
    payload.type = normalizeType(payload.type);
    if (payload.type !== episode.type) {
      validateEpisodeType(payload.type);
    }
  }
  if (payload.peopleId !== undefined && payload.peopleId !== episode.peopleId) {
    throw new BusinessLogicError('No se puede cambiar el paciente de un episodio existente');
  }
  if (payload.openingDate !== undefined && payload.openingDate !== episode.openingDate) {
    throw new BusinessLogicError('No se puede cambiar la fecha de apertura de un episodio');
  }

  return episodeRepository.update(episode, payload);
};

const closeEpisode = async (id) => {

  const episode = await getEpisodeById(id);

  const normalizedStatus = normalizeStatus(episode.status);
  
  if (normalizedStatus === 'cerrado') {
    throw new BusinessLogicError('El episodio ya está cerrado');
  }
  validateStatusTransition(episode.status, 'cerrado');
  episode.status = 'cerrado';
  return episodeRepository.save(episode);
};

module.exports = {
  listEpisodes,
  getEpisodeById,
  createEpisode,
  updateEpisode,
  closeEpisode,
  validateStatusTransition,
  validateEpisodeType,
  normalizeStatus,
  normalizeType
};
