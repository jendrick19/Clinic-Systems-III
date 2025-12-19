const {
  listDiagnosis,
  getDiagnosisById,
  getDiagnosisByEpisode,
  getPrincipalDiagnosisByEpisode,
  createDiagnosis,
  updateDiagnosis,
  changePrincipalDiagnosis,
  deleteDiagnosis,
} = require('../services/DiagnosisService');

const mapModelToResponse = (diagnosis) => {
  if (!diagnosis) return null;
  return {
    id: diagnosis.id,
    episodio: diagnosis.episode
      ? {
          id: diagnosis.episode.id,
          fechaApertura: diagnosis.episode.openingDate,
          fechaCierre: diagnosis.episode.closingDate,
          estado: diagnosis.episode.status,
          tipo: diagnosis.episode.type,
        }
      : undefined,
    codigo: diagnosis.code,
    descripcion: diagnosis.description,
    tipo: diagnosis.type,
    principal: diagnosis.isPrimary,
    createdAt: diagnosis.createdAt,
    updatedAt: diagnosis.updatedAt,
  };
};

const mapRequestToCreate = (body) => {
  const payload = {
    episodeId: body.episodioId,
    code: body.codigo,
    description: body.descripcion,
    type: body.tipo,
  };
  if (body.principal !== undefined) payload.isPrimary = body.principal;
  return payload;
};

const mapRequestToUpdate = (body) => {
  const payload = {};
  if (body.codigo !== undefined) payload.code = body.codigo;
  if (body.descripcion !== undefined) payload.description = body.descripcion;
  if (body.tipo !== undefined) payload.type = body.tipo;
  if (body.principal !== undefined) payload.isPrimary = body.principal;
  return payload;
};

const listHandler = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      episodio,
      codigo,
      tipo,
      principal,
    } = req.query;
    const result = await listDiagnosis({
      page,
      limit,
      sortBy,
      sortOrder,
      filters: {
        episodio,
        codigo,
        tipo,
        principal,
      },
    });
    return res.json({
      codigo: 200,
      mensaje: 'Lista de diagnósticos obtenida exitosamente',
      data: result.rows.map(mapModelToResponse),
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
};

const getHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const diagnosis = await getDiagnosisById(id);
    return res.json({
      codigo: 200,
      mensaje: 'Diagnóstico encontrado',
      data: mapModelToResponse(diagnosis),
    });
  } catch (error) {
    return next(error);
  }
};
const getByEpisodeHandler = async (req, res, next) => {
  try {
    const { episodeId } = req.params;
    const {
      page = 1,
      limit = 20,
      sortBy = 'principal',
      sortOrder = 'desc',
    } = req.query;
    const result = await getDiagnosisByEpisode(episodeId, {
      page,
      limit,
      sortBy,
      sortOrder,
    });
    return res.json({
      codigo: 200,
      mensaje: 'Diagnósticos del episodio obtenidos exitosamente',
      data: result.rows.map(mapModelToResponse),
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
};
const getPrincipalHandler = async (req, res, next) => {
  try {
    const { episodeId } = req.params;
    const diagnosis = await getPrincipalDiagnosisByEpisode(episodeId);
    return res.json({
      codigo: 200,
      mensaje: 'Diagnóstico principal del episodio obtenido exitosamente',
      data: mapModelToResponse(diagnosis),
    });
  } catch (error) {
    return next(error);
  }
};

const createHandler = async (req, res, next) => {
  try {
    const payload = mapRequestToCreate(req.body);
    const diagnosis = await createDiagnosis(payload);
    return res.status(201).json({
      codigo: 201,
      mensaje: 'Diagnóstico creado exitosamente',
      data: mapModelToResponse(diagnosis),
    });
  } catch (error) {
    return next(error);
  }
};

const updateHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = mapRequestToUpdate(req.body);
    const updated = await updateDiagnosis(id, payload);
    return res.json({
      codigo: 200,
      mensaje: 'Diagnóstico actualizado exitosamente',
      data: mapModelToResponse(updated),
    });
  } catch (error) {
    return next(error);
  }
};

const changePrincipalHandler = async (req, res, next) => {
  try {
    const { episodeId, diagnosisId } = req.params;
    const result = await changePrincipalDiagnosis(
      Number(episodeId),
      Number(diagnosisId)
    );
    return res.json({
      codigo: 200,
      mensaje: result.message,
      data: {
        anterior: result.previousPrincipal
          ? mapModelToResponse(result.previousPrincipal)
          : null,
        nuevo: mapModelToResponse(result.newPrincipal),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const deleteHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteDiagnosis(id);
    return res.json({
      codigo: 200,
      mensaje: 'Diagnóstico eliminado exitosamente',
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listHandler,
  getHandler,
  getByEpisodeHandler,
  getPrincipalHandler,
  createHandler,
  updateHandler,
  changePrincipalHandler,
  deleteHandler,
};
