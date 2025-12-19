const { Op } = require('sequelize');
const db = require('../../../../database/models');
const { Appointment, AppointmentHistory } = db.modules.operative;

const findById = async (id) => {
  return Appointment.findByPk(id, {
    include: [
      { model: db.modules.operative.PeopleAttended, as: 'peopleAttended' },
      { model: db.modules.operative.Professional, as: 'professional' },
      { model: db.modules.operative.Schedule, as: 'schedule' },
      { model: db.modules.operative.CareUnit, as: 'careUnit' }
    ]
  });
};

const findAndCountAll = async ({ where, offset, limit, order, include }) => {
  const defaultInclude = [
    { model: db.modules.operative.PeopleAttended, as: 'peopleAttended' },
    { model: db.modules.operative.Professional, as: 'professional' },
    { model: db.modules.operative.Schedule, as: 'schedule' },
    { model: db.modules.operative.CareUnit, as: 'careUnit' }
  ];
  return Appointment.findAndCountAll({
    where,
    offset,
    limit,
    order,
    include: include || defaultInclude,
    distinct: true,
  });
};

const buildOverlapWhere = (startTime, endTime, excludeAppointmentId = null) => {
  const where = {
    status: {
      [Op.in]: ['solicitada', 'confirmada']
    },
    [Op.or]: [
      {
        startTime: { [Op.lte]: startTime },
        endTime: { [Op.gte]: startTime }
      },
      {
        startTime: { [Op.lte]: endTime },
        endTime: { [Op.gte]: endTime }
      },
      {
        startTime: { [Op.gte]: startTime },
        endTime: { [Op.lte]: endTime }
      }
    ]
  };
  if (excludeAppointmentId) {
    where.id = { [Op.ne]: excludeAppointmentId };
  }
  return where;
};

const findOverlapping = async (scheduleId, startTime, endTime, excludeAppointmentId = null) => {
  const where = buildOverlapWhere(startTime, endTime, excludeAppointmentId);
  where.scheduleId = scheduleId;
  return Appointment.findOne({ where });
};

const findOverlappingByProfessional = async (professionalId, startTime, endTime, excludeAppointmentId = null) => {
  const where = buildOverlapWhere(startTime, endTime, excludeAppointmentId);
  where.professionalId = professionalId;
  return Appointment.findOne({ where });
};

const create = async (payload) => {
  return Appointment.create(payload);
};

const update = async (appointment, payload) => {
  return appointment.update(payload);
};

const save = async (appointment) => {
  return appointment.save();
};

const createHistory = async (historyData) => {
  return AppointmentHistory.create(historyData);
};

const countConfirmedBySchedule = async (scheduleId, excludeAppointmentId = null) => {
  const where = {
    scheduleId,
    status: 'confirmada'
  };
  if (excludeAppointmentId) {
    where.id = { [Op.ne]: excludeAppointmentId };
  }
  return Appointment.count({ where });
};

module.exports = {
  findById,
  findAndCountAll,
  findOverlapping,
  findOverlappingByProfessional,
  create,
  update,
  save,
  createHistory,
  countConfirmedBySchedule
};
