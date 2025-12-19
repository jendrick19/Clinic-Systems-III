const {
  listClinicalNotes,
  getClinicalNoteById,
  createClinicalNote,
  updateClinicalNote,
  getVersionHistory,
  getVersionById,
  getLatestVersion,
  compareVersions,
} = require('../services/ClinicalNoteService');

const mapVersionToResponse = (version) => {
  if (!version) return null;
  return {
    id: version.id,
    fechaVersion: version.versionDate,
    subjetivo: version.subjective,
    objetivo: version.objective,
    analisis: version.analysis,
    plan: version.plan,
    adjuntos: version.attachments,
    createdAt: version.createdAt,
    updatedAt: version.updatedAt,
  };
};

const mapModelToResponse = (note) => {
  if (!note) return null;
  return {
    id: note.id,
    episodio: note.episode
      ? {
          id: note.episode.id,
          fechaApertura: note.episode.openingDate,
          fechaCierre: note.episode.closingDate,
          estado: note.episode.status,
        }
      : undefined,
    profesional: note.professional
      ? {
          id: note.professional.id,
          nombres: note.professional.names,
          apellidos: note.professional.surNames,
          especialidad: note.professional.specialty,
        }
      : undefined,
    fechaNota: note.noteDate,
    versiones: note.clinicalNoteVersions
      ? note.clinicalNoteVersions.map(mapVersionToResponse)
      : undefined,
    totalVersiones: note.clinicalNoteVersions ? note.clinicalNoteVersions.length : 0,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
};

const mapRequestToNoteModel = (body) => {
  const payload = {
    episodeId: body.episodioId,
    professionalId: body.profesionalId,
  };
  if (body.fechaNota !== undefined) {
    const date = new Date(body.fechaNota);
    if (!Number.isNaN(date.getTime())) {
      payload.noteDate = date;
    }
  }
  return payload;
};

const mapRequestToVersionModel = (body) => {
  const payload = {
    subjective: body.subjetivo,
    objective: body.objetivo,
    analysis: body.analisis,
    plan: body.plan,
  };
  if (body.adjuntos !== undefined) payload.attachments = body.adjuntos;
  if (body.fechaVersion !== undefined) {
    const date = new Date(body.fechaVersion);
    if (!Number.isNaN(date.getTime())) {
      payload.versionDate = date;
    }
  }
  return payload;
};

const listHandler = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'fecha',
      sortOrder = 'desc',
      episodio,
      profesional,
      fechaDesde,
      fechaHasta,
    } = req.query;
    const result = await listClinicalNotes({
      page,
      limit,
      sortBy,
      sortOrder,
      filters: {
        episodio,
        profesional,
        fechaDesde,
        fechaHasta,
      },
    });
    return res.json({
      codigo: 200,
      mensaje: 'Lista de notas clínicas obtenida exitosamente',
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
    const note = await getClinicalNoteById(id);
    return res.json({
      codigo: 200,
      mensaje: 'Nota clínica encontrada',
      data: mapModelToResponse(note),
    });
  } catch (error) {
    return next(error);
  }
};
const createHandler = async (req, res, next) => {
  try {
    const noteData = mapRequestToNoteModel(req.body);
    const versionData = mapRequestToVersionModel(req.body);
    const note = await createClinicalNote(noteData, versionData);
    return res.status(201).json({
      codigo: 201,
      mensaje: 'Nota clínica creada exitosamente',
      data: mapModelToResponse(note),
    });
  } catch (error) {
    return next(error);
  }
};

const updateHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const versionData = mapRequestToVersionModel(req.body);
    const updated = await updateClinicalNote(id, versionData);
    return res.json({
      codigo: 200,
      mensaje: 'Nota clínica actualizada exitosamente (nueva versión creada)',
      data: mapModelToResponse(updated),
    });
  } catch (error) {
    return next(error);
  }
};

const getVersionHistoryHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const history = await getVersionHistory(id);
    return res.json({
      codigo: 200,
      mensaje: 'Historial de versiones obtenido exitosamente',
      data: {
        nota: mapModelToResponse(history.note),
        versiones: history.versions.map(mapVersionToResponse),
        totalVersiones: history.totalVersions,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getVersionHandler = async (req, res, next) => {
  try {
    const { versionId } = req.params;
    const version = await getVersionById(versionId);
    return res.json({
      codigo: 200,
      mensaje: 'Versión encontrada',
      data: {
        version: mapVersionToResponse(version),
        nota: version.clinicalNote ? mapModelToResponse(version.clinicalNote) : undefined,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getLatestVersionHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await getLatestVersion(id);
    return res.json({
      codigo: 200,
      mensaje: 'Última versión obtenida exitosamente',
      data: {
        nota: mapModelToResponse(result.note),
        version: mapVersionToResponse(result.version),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const compareVersionsHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { version1, version2 } = req.query;
    if (!version1 || !version2) {
      return res.status(400).json({
        codigo: 400,
        mensaje: 'Se requieren los parámetros "version1" y "version2"',
      });
    }
    const comparison = await compareVersions(id, version1, version2);
    return res.json({
      codigo: 200,
      mensaje: 'Comparación de versiones realizada exitosamente',
      data: {
        nota: mapModelToResponse(comparison.note),
        version1: mapVersionToResponse(comparison.version1),
        version2: mapVersionToResponse(comparison.version2),
        cambios: comparison.changes,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listHandler,
  getHandler,
  createHandler,
  updateHandler,
  getVersionHistoryHandler,
  getVersionHandler,
  getLatestVersionHandler,
  compareVersionsHandler,
};
