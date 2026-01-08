const {
  listAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  softDeleteAppointment,
} = require('../services/AppointmentService');

const { initializeIAContext } = require('../../intelligence/services/IAContextService');

const mapModelToResponse = (appointment) => {
  if (!appointment) return null;
  return {
    id: appointment.id,
    paciente: appointment.peopleAttended
      ? {
        id: appointment.peopleAttended.id,
        nombres: appointment.peopleAttended.names,
        apellidos: appointment.peopleAttended.surNames,
      }
      : undefined,
    profesional: appointment.professional
      ? {
        id: appointment.professional.id,
        nombres: appointment.professional.names,
        apellidos: appointment.professional.surNames,
      }
      : undefined,
    agendaId: appointment.scheduleId,
    unidad: appointment.careUnit
      ? {
        id: appointment.careUnit.id,
        nombre: appointment.careUnit.name,
      }
      : undefined,
    inicio: appointment.startTime,
    fin: appointment.endTime,
    canal: appointment.channel,
    estado: appointment.status,
    motivo: appointment.reason,
    observaciones: appointment.observations,
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt,
  };
};

const mapRequestToCreate = (body) => {
  const payload = {
    peopleId: body.pacienteId,
    professionalId: body.profesionalId,
    unitId: body.unidadId,
    startTime: body.inicio,
    endTime: body.fin,
    reason: body.motivo,
  };
  if (body.agendaId !== undefined) payload.scheduleId = body.agendaId;
  if (body.canal !== undefined) payload.channel = body.canal;
  if (body.estado !== undefined) payload.status = body.estado;
  if (body.observaciones !== undefined) payload.observations = body.observaciones;

  return payload;
};

const mapRequestToUpdate = (body) => {

  const payload = {};

  if (body.pacienteId !== undefined) payload.peopleId = body.pacienteId;
  if (body.profesionalId !== undefined) payload.professionalId = body.profesionalId;
  if (body.unidadId !== undefined) payload.unitId = body.unidadId;
  if (body.agendaId !== undefined) payload.scheduleId = body.agendaId;
  if (body.inicio !== undefined) payload.startTime = body.inicio;
  if (body.fin !== undefined) payload.endTime = body.fin;
  if (body.canal !== undefined) payload.channel = body.canal;
  if (body.estado !== undefined) payload.status = body.estado;
  if (body.motivo !== undefined) payload.reason = body.motivo;
  if (body.observaciones !== undefined) payload.observations = body.observaciones;

  return payload;
};

const listHandler = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'fecha',
      sortOrder = 'asc',
      nombrePersona,
      nombreProfesional,
      paciente,
      profesional,
      agendaId,
      unidadId,
      estado,
      fechaDesde,
      fechaHasta,
    } = req.query;

    const result = await listAppointments({
      page,
      limit,
      sortBy,
      sortOrder,
      filters: {
        nombrePersona,
        nombreProfesional,
        paciente,
        profesional,
        agendaId,
        unidadId,
        estado,
        fechaDesde,
        fechaHasta,
      },
    });
    return res.json({
      codigo: 200,
      mensaje: 'Lista de citas obtenida exitosamente',
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
    const appointment = await getAppointmentById(id);
    return res.json({
      codigo: 200,
      mensaje: 'Cita encontrada',
      data: mapModelToResponse(appointment),
    });
  } catch (error) {
    return next(error);
  }
};

const createHandler = async (req, res, next) => {
  try {
    const payload = mapRequestToCreate(req.body);
    const appointment = await createAppointment(payload);
    if (appointment.peopleId) {
      // Pasamos null en userId porque tenemos el patientId (peopleId)
      initializeIAContext(null, appointment.peopleId).catch(e => console.error('[IA Sync] Error:', e));
    }
    return res.status(201).json({
      codigo: 201,
      mensaje: 'Cita creada exitosamente',
      data: mapModelToResponse(appointment),
    });
  } catch (error) {
    return next(error);
  }
};

const updateHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const appointment = await getAppointmentById(id);
    const payload = mapRequestToUpdate(req.body);
    const razonCambio = req.body.razonCambio || null;
    const updated = await updateAppointment(appointment, payload, razonCambio);
    if (updated.peopleId) {
      initializeIAContext(null, updated.peopleId).catch(e => console.error('[IA Sync] Error:', e));
    }
    return res.json({
      codigo: 200,
      mensaje: 'Cita actualizada exitosamente',
      data: mapModelToResponse(updated),
    });
  } catch (error) {
    return next(error);
  }
};

const deleteHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    await softDeleteAppointment(id);
    if (deletedAppt && deletedAppt.peopleId) {
      initializeIAContext(null, deletedAppt.peopleId).catch(e => console.error('[IA Sync] Error:', e));
    }
    return res.status(200).json({
      codigo: 200,
      mensaje: 'Cita eliminada exitosamente',
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
  deleteHandler,
};
