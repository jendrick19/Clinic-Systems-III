const { Op } = require('sequelize');
const clinicalNoteRepository = require('../repositories/ClinicalNoteRepository');
const { buildPaginationParams, buildPaginationResponse } = require('../../../shared/utils/paginationHelper');
const { addDateRangeToWhere } = require('../../../shared/utils/dateRangeHelper');
const { NotFoundError, BusinessLogicError, ConflictError } = require('../../../shared/errors/CustomErrors');
const db = require('../../../../database/models');

const SORT_FIELDS = {
  fecha: 'noteDate',
  episodio: 'episodeId',
  profesional: 'professionalId',
  createdAt: 'createdAt',
};

const buildWhere = ({ episodio, profesional, fechaDesde, fechaHasta }) => {
  const where = {};
  if (episodio) {
    where.episodeId = Number(episodio);
  }
  if (profesional) {
    where.professionalId = Number(profesional);
  }
  addDateRangeToWhere(where, 'noteDate', fechaDesde, fechaHasta);
  return where;
};

const listClinicalNotes = async ({
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
  const { count, rows } = await clinicalNoteRepository.findAndCountAll({
    where,
    offset,
    limit: safeLimit,
    order: [[orderField, orderDirection]],
  });
  return buildPaginationResponse(rows, count, safePage, safeLimit);
};

const getClinicalNoteById = async (id) => {
  const note = await clinicalNoteRepository.findById(id);
  if (!note) {
    throw new NotFoundError('Nota clínica no encontrada');
  }
  return note;
};

const validateEpisodeExists = async (episodeId) => {
  const episode = await db.modules.clinic.Episode.findByPk(episodeId);
  if (!episode) {
    throw new NotFoundError('Episodio no encontrado');
  }
  if (episode.status === 'cerrado') {
    throw new BusinessLogicError('No se pueden crear notas clínicas en un episodio cerrado');
  }
  return episode;
};

const validateProfessionalExists = async (professionalId) => {
  const professional = await db.modules.operative.Professional.findByPk(professionalId);

  if (!professional) {
    throw new NotFoundError('Profesional no encontrado');
  }
  if (!professional.status) {
    throw new BusinessLogicError('El profesional está inactivo');
  }
  return professional;
};

const validateVersionData = (versionData) => {
  
  const requiredFields = ['subjective', 'objective', 'analysis', 'plan'];
  
  const missingFields = [];
  
  for (const field of requiredFields) {
    if (!versionData[field] || versionData[field].trim() === '') {
      missingFields.push(field);
    }
  }
  if (missingFields.length > 0) {
    throw new BusinessLogicError(
      `Los siguientes campos son requeridos en la nota clínica: ${missingFields.join(', ')}`
    );
  }
  return true;
};

const createClinicalNote = async (noteData, versionData) => {
  if (!noteData.episodeId) {
    throw new BusinessLogicError('El ID del episodio es requerido');
  }
  if (!noteData.professionalId) {
    throw new BusinessLogicError('El ID del profesional es requerido');
  }
  await validateEpisodeExists(noteData.episodeId);
  await validateProfessionalExists(noteData.professionalId);
  validateVersionData(versionData);
  if (!noteData.noteDate) {
    noteData.noteDate = new Date();
  }
  if (!versionData.versionDate) {
    versionData.versionDate = new Date();
  }

  const transaction = await db.sequelize.transaction();

  try {
    const note = await clinicalNoteRepository.createWithVersion(
      noteData,
      versionData,
      transaction
    );
    await transaction.commit();
    return note;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const updateClinicalNote = async (id, versionData) => {
  
  const note = await getClinicalNoteById(id);

  const episode = await db.modules.clinic.Episode.findByPk(note.episodeId);

  if (episode && episode.status === 'Cerrado') {
    throw new BusinessLogicError('No se pueden editar notas clínicas de un episodio cerrado');
  }
  validateVersionData(versionData);
  if (!versionData.versionDate) {
    versionData.versionDate = new Date();
  }

  const transaction = await db.sequelize.transaction();

  try {
    await clinicalNoteRepository.createVersion(note.id, versionData, transaction);
    await transaction.commit();
    return getClinicalNoteById(note.id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getVersionHistory = async (noteId) => {

  const note = await getClinicalNoteById(noteId);

  const versions = await clinicalNoteRepository.findVersionsByNoteId(noteId);

  return {
    note,
    versions,
    totalVersions: versions.length
  };
};

const getVersionById = async (versionId) => {

  const version = await clinicalNoteRepository.findVersionById(versionId);

  if (!version) {
    throw new NotFoundError('Versión de nota clínica no encontrada');
  }
  return version;
};

const getLatestVersion = async (noteId) => {

  const note = await getClinicalNoteById(noteId);

  const latestVersion = await clinicalNoteRepository.findLatestVersion(noteId);

  if (!latestVersion) {
    throw new NotFoundError('No se encontró ninguna versión para esta nota clínica');
  }
  return {
    note,
    version: latestVersion
  };
};

const compareVersions = async (noteId, versionId1, versionId2) => {

  const note = await getClinicalNoteById(noteId);

  const version1 = await clinicalNoteRepository.findVersionById(versionId1);

  const version2 = await clinicalNoteRepository.findVersionById(versionId2);

  if (!version1 || !version2) {
    throw new NotFoundError('Una o ambas versiones no fueron encontradas');
  }
  if (version1.noteId !== noteId || version2.noteId !== noteId) {
    throw new BusinessLogicError('Las versiones no pertenecen a la misma nota clínica');
  }
  return {
    note,
    version1,
    version2,
    changes: {
      subjective: version1.subjective !== version2.subjective,
      objective: version1.objective !== version2.objective,
      analysis: version1.analysis !== version2.analysis,
      plan: version1.plan !== version2.plan,
      attachments: version1.attachments !== version2.attachments
    }
  };
};

module.exports = {
  listClinicalNotes,
  getClinicalNoteById,
  createClinicalNote,
  updateClinicalNote,
  getVersionHistory,
  getVersionById,
  getLatestVersion,
  compareVersions,
  validateEpisodeExists,
  validateProfessionalExists,
  validateVersionData
};
