const { Op } = require('sequelize');
const diagnosisRepository = require('../repositories/DiagnosisRepository');
const { buildPaginationParams, buildPaginationResponse } = require('../../../shared/utils/paginationHelper');
const { NotFoundError, BusinessLogicError, ConflictError } = require('../../../shared/errors/CustomErrors');
const db = require('../../../../database/models');

const VALID_TYPES = ['presuntivo', 'definitivo'];

const SORT_FIELDS = {
  episodio: 'episodeId',
  codigo: 'code',
  tipo: 'type',
  principal: 'isPrimary',
  createdAt: 'createdAt',
};

const normalizeType = (type) => {
  if (!type || typeof type !== 'string') {
    return null;
  }

  return type.toLowerCase().trim();

};

const validateDiagnosisType = (type) => {
  if (!type) {
    throw new BusinessLogicError('El tipo de diagnóstico es requerido');
  }
  const normalizedType = normalizeType(type);
  if (!VALID_TYPES.includes(normalizedType)) {
    throw new BusinessLogicError(
      `Tipo de diagnóstico "${type}" no es válido. Tipos válidos: ${VALID_TYPES.join(', ')}`
    );
  }

  return normalizedType;
};

const validateEpisodeExists = async (episodeId) => {
  
  const episode = await db.modules.clinic.Episode.findByPk(episodeId);
  
  if (!episode) {
    throw new NotFoundError('Episodio no encontrado');
  }
  if (episode.status === 'cerrado') {
    throw new BusinessLogicError('No se pueden crear o modificar diagnósticos en un episodio cerrado');
  }

  return episode;
};

const buildWhere = ({ episodio, codigo, tipo, principal }) => {
  const where = {};
  if (episodio) {
    where.episodeId = Number(episodio);
  }
  if (codigo) {
    where.code = {
      [Op.like]: `%${codigo}%`
    };
  }
  if (tipo) {
    where.type = normalizeType(tipo);
  }
  if (principal !== undefined) {
    where.isPrimary = principal === 'true' || principal === true;
  }

  return where;
};

const listDiagnosis = async ({
  page,
  limit,
  filters,
  sortBy,
  sortOrder,
}) => {
  
  const { safePage, safeLimit, offset } = buildPaginationParams(page, limit);
  
  const orderField = SORT_FIELDS[sortBy] || SORT_FIELDS.createdAt;
  
  const orderDirection = sortOrder === 'desc' ? 'DESC' : 'ASC';
  
  const where = buildWhere(filters || {});

  const { count, rows } = await diagnosisRepository.findAndCountAll({
    where,
    offset,
    limit: safeLimit,
    order: [[orderField, orderDirection]],
  });

  return buildPaginationResponse(rows, count, safePage, safeLimit);
};

const getDiagnosisById = async (id) => {

  const diagnosis = await diagnosisRepository.findById(id);

  if (!diagnosis) {
    throw new NotFoundError('Diagnóstico no encontrado');
  }

  return diagnosis;
};

const getDiagnosisByEpisode = async (episodeId, { page, limit, sortBy, sortOrder }) => {
  const { safePage, safeLimit, offset } = buildPaginationParams(page, limit);

  const orderField = SORT_FIELDS[sortBy] || 'isPrimary';

  const orderDirection = sortOrder === 'desc' ? 'DESC' : 'ASC';

  const { count, rows } = await diagnosisRepository.findByEpisode(episodeId, {
    offset,
    limit: safeLimit,
    order: [[orderField, orderDirection], ['createdAt', 'DESC']]
  });

  return buildPaginationResponse(rows, count, safePage, safeLimit);
};

const getPrincipalDiagnosisByEpisode = async (episodeId) => {

  const diagnosis = await diagnosisRepository.findPrincipalByEpisode(episodeId);

  if (!diagnosis) {
    throw new NotFoundError('No se encontró diagnóstico principal para este episodio');
  }

  return diagnosis;
};

const createDiagnosis = async (diagnosisData) => {

  await validateEpisodeExists(diagnosisData.episodeId);

  if (diagnosisData.type) {
    diagnosisData.type = validateDiagnosisType(diagnosisData.type);
  }
  if (diagnosisData.isPrimary === undefined) {
    diagnosisData.isPrimary = false;
  }
  if (diagnosisData.isPrimary) {

    const hasPrincipal = await diagnosisRepository.hasPrincipalDiagnosis(diagnosisData.episodeId);

    if (hasPrincipal) {
      throw new ConflictError(
        'Ya existe un diagnóstico principal para este episodio. ' +
        'Primero debe cambiar el diagnóstico principal actual a secundario.'
      );
    }
  }
  return diagnosisRepository.create(diagnosisData);
};

const updateDiagnosis = async (id, payload) => {

  const diagnosis = await getDiagnosisById(id);

  await validateEpisodeExists(diagnosis.episodeId);

  if (payload.episodeId !== undefined && payload.episodeId !== diagnosis.episodeId) {
    throw new BusinessLogicError('No se puede cambiar el episodio de un diagnóstico existente');
  }
  if (payload.type !== undefined && payload.type !== diagnosis.type) {
    payload.type = validateDiagnosisType(payload.type);
  }
  if (payload.isPrimary !== undefined && payload.isPrimary !== diagnosis.isPrimary) {
    if (payload.isPrimary) {
      const hasPrincipal = await diagnosisRepository.hasPrincipalDiagnosis(
        diagnosis.episodeId,
        diagnosis.id
      );
      if (hasPrincipal) {
        throw new ConflictError(
          'Ya existe un diagnóstico principal para este episodio. ' +
          'Primero debe cambiar el diagnóstico principal actual a secundario.'
        );
      }
    }
  }
  return diagnosisRepository.update(diagnosis, payload);

};

const changePrincipalDiagnosis = async (episodeId, newPrincipalId) => {
  
  await validateEpisodeExists(episodeId);
  
  const newPrincipal = await getDiagnosisById(newPrincipalId);
  
  if (newPrincipal.episodeId !== episodeId) {
    throw new BusinessLogicError('El diagnóstico no pertenece al episodio especificado');
  }
  if (newPrincipal.isPrimary) {
    return newPrincipal;
  }

  const transaction = await db.sequelize.transaction();

  try {
    const currentPrincipal = await diagnosisRepository.findPrincipalByEpisode(episodeId);

    if (currentPrincipal) {
      currentPrincipal.isPrimary = false;
      await diagnosisRepository.save(currentPrincipal);
    }

    newPrincipal.isPrimary = true;

    await diagnosisRepository.save(newPrincipal);
    await transaction.commit();

    return {
      previousPrincipal: currentPrincipal,
      newPrincipal: newPrincipal,
      message: 'Diagnóstico principal actualizado exitosamente'
    };

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const deleteDiagnosis = async (id) => {

  const diagnosis = await getDiagnosisById(id);

  await validateEpisodeExists(diagnosis.episodeId);
  return diagnosisRepository.remove(diagnosis);
};

module.exports = {
  listDiagnosis,
  getDiagnosisById,
  getDiagnosisByEpisode,
  getPrincipalDiagnosisByEpisode,
  createDiagnosis,
  updateDiagnosis,
  changePrincipalDiagnosis,
  deleteDiagnosis,
};
