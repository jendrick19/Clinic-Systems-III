const {
  listResults,
  getResultById,
  getResultsByOrderId,
  createResult,
  updateResult,
  deleteResult,
  getVersionHistory,
  getVersionById,
  getLatestVersion,
  compareVersions,
} = require('../services/ResultService');

const mapVersionToResponse = (version) => {
  if (!version) return null;
  return {
    id: version.id,
    fecha: version.date,
    resumen: version.summary,
    archivoId: version.fileId,
    version: version.version,
    createdAt: version.createdAt,
    updatedAt: version.updatedAt,
  };
};

const mapModelToResponse = (result) => {
  if (!result) return null;
  return {
    id: result.id,
    orden: result.order
      ? {
          id: result.order.id,
          tipo: result.order.type,
          estado: result.order.status,
        }
      : undefined,
    fecha: result.date,
    resumen: result.summary,
    archivoId: result.fileId,
    version: result.version,
    versiones: result.versions
      ? result.versions.map(mapVersionToResponse)
      : undefined,
    totalVersiones: result.versions ? result.versions.length : 0,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  };
};

const mapRequestToCreate = (body) => {
  const payload = {
    orderId: body.ordenId,
    summary: body.resumen,
  };
  if (body.fecha !== undefined) {
    const date = new Date(body.fecha);
    if (!Number.isNaN(date.getTime())) {
      payload.date = date;
    }
  }
  if (body.archivoId !== undefined) payload.fileId = body.archivoId;
  return payload;
};

const mapRequestToUpdate = (body) => {
  const payload = {
    summary: body.resumen,
  };
  if (body.archivoId !== undefined) payload.fileId = body.archivoId;
  return payload;
};

const listHandler = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      ordenId,
      pacienteId,
    } = req.query;
    const result = await listResults({
      page,
      limit,
      sortBy,
      sortOrder,
      filters: {
        ordenId,
        pacienteId,
      },
    });
    return res.json({
      codigo: 200,
      mensaje: 'Lista de resultados obtenida exitosamente',
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
    const result = await getResultById(id);
    return res.json({
      codigo: 200,
      mensaje: 'Resultado encontrado',
      data: mapModelToResponse(result),
    });
  } catch (error) {
    return next(error);
  }
};

const getByOrderHandler = async (req, res, next) => {
  try {
    const { ordenId } = req.params;
    const data = await getResultsByOrderId(ordenId);
    return res.json({
      codigo: 200,
      mensaje: 'Resultados de la orden obtenidos exitosamente',
      data: {
        orden: data.order,
        resultados: data.results.map(mapModelToResponse),
        totalResultados: data.totalResults,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const createHandler = async (req, res, next) => {
  try {
    const resultData = mapRequestToCreate(req.body);
    const result = await createResult(resultData);
    return res.status(201).json({
      codigo: 201,
      mensaje: 'Resultado creado exitosamente',
      data: mapModelToResponse(result),
    });
  } catch (error) {
    return next(error);
  }
};

const updateHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = mapRequestToUpdate(req.body);
    const updated = await updateResult(id, updateData);
    return res.json({
      codigo: 200,
      mensaje: 'Resultado actualizado exitosamente (nueva versión creada)',
      data: mapModelToResponse(updated),
    });
  } catch (error) {
    return next(error);
  }
};

const deleteHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteResult(id);
    return res.status(204).send();
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
        resultado: mapModelToResponse(history.result),
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
        resultado: version.result ? mapModelToResponse(version.result) : undefined,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getLatestVersionHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await getLatestVersion(id);
    return res.json({
      codigo: 200,
      mensaje: 'Última versión obtenida exitosamente',
      data: {
        resultado: mapModelToResponse(data.result),
        version: mapVersionToResponse(data.version),
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
    const comparison = await compareVersions(id, version1, version2);
    return res.json({
      codigo: 200,
      mensaje: 'Comparación de versiones realizada exitosamente',
      data: {
        resultadoId: comparison.result.id,
        ordenId: comparison.result.orderId,
        versionActual: comparison.result.version,
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
  getByOrderHandler,
  createHandler,
  updateHandler,
  deleteHandler,
  getVersionHistoryHandler,
  getVersionHandler,
  getLatestVersionHandler,
  compareVersionsHandler,
};

