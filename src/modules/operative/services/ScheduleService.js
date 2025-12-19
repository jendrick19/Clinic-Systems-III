const { Op } = require('sequelize');
const scheduleRepository = require('../repositories/ScheduleRepository');
const { buildPaginationParams, buildPaginationResponse } = require('../../../shared/utils/paginationHelper');
const { NotFoundError, BusinessLogicError } = require('../../../shared/errors/CustomErrors');
const { addDateRangeToWhere } = require('../../../shared/utils/dateRangeHelper');

const ALLOWED_STATUSES = [
    'abierta',
    'cerrada',
    'reservada'
];

const validateDates = (startTime, endTime) => {
    if (new Date(startTime) >= new Date(endTime)) {
        throw new BusinessLogicError('La fecha de inicio debe ser anterior a la fecha de fin');
    }
};

const validateStatus = (status) => {
    if (status && !ALLOWED_STATUSES.includes(status)) {
        throw new BusinessLogicError(
            `El estado "${status}" no está permitido. ` +
            `Estados válidos: ${ALLOWED_STATUSES.join(', ')}`
        );
    }
};
const validateCapacity = (capacity) => {
    if (capacity !== undefined && capacity !== null) {
        const capacityNum = Number(capacity);
        if (isNaN(capacityNum) || capacityNum < 1) {
            throw new BusinessLogicError('La capacidad debe ser un número mayor o igual a 1');
        }
    }
};

const buildWhere = ({ profesional, unidad, estado, fechaDesde, fechaHasta }) => {
    const where = {};
    if (profesional) {
        where.professionalId = Number(profesional);
    }
    if (unidad) {
        where.unitId = Number(unidad);
    }
    if (estado) {
        where.status = estado;
    }
    addDateRangeToWhere(where, 'startTime', fechaDesde, fechaHasta);
    return where;
};

const listSchedules = async ({ page, limit, filters = {} }) => {
    const { safePage, safeLimit, offset } = buildPaginationParams(page, limit);
    const where = buildWhere(filters);
    const include = [];
    if (filters.nombreProfesional) {
        include.push({
            association: 'professional',
            where: {
                [Op.or]: [
                    { names: { [Op.like]: `%${filters.nombreProfesional}%` } },
                    { surNames: { [Op.like]: `%${filters.nombreProfesional}%` } }
                ]
            },
            required: true
        });
    } else {
        include.push({ association: 'professional', required: false });
    }
    if (filters.nombreUnidad) {
        include.push({
            association: 'careUnit',
            where: {
                name: { [Op.like]: `%${filters.nombreUnidad}%` }
            },
            required: true
        });
    } else {
        include.push({ association: 'careUnit', required: false });
    }
    const { count, rows } = await scheduleRepository.findAndCountAll({
        where,
        include,
        offset,
        limit: safeLimit,
        order: [['startTime', 'ASC']],
    });
    return buildPaginationResponse(rows, count, safePage, safeLimit);
};

const getScheduleById = async (id) => {
    const schedule = await scheduleRepository.findById(id);
    if (!schedule) {
        throw new NotFoundError('Horario no encontrado');
    }
    return schedule;
};

const createSchedule = async (scheduleData) => {
    validateDates(scheduleData.startTime, scheduleData.endTime);
    validateStatus(scheduleData.status);
    validateCapacity(scheduleData.capacity);
    const payload = {
        ...scheduleData,
        status: scheduleData.status || 'abierta',
        capacity: scheduleData.capacity || 1
    };
    return scheduleRepository.create(payload);
};

const updateSchedule = async (id, updateData) => {
    const schedule = await getScheduleById(id);
    const startTime = updateData.startTime || schedule.startTime;
    const endTime = updateData.endTime || schedule.endTime;
    validateDates(startTime, endTime);
    validateStatus(updateData.status);
    validateCapacity(updateData.capacity);
    return scheduleRepository.update(schedule, updateData);
};

const deleteSchedule = async (id) => {
    const schedule = await getScheduleById(id);
    return scheduleRepository.deleteSchedule(schedule);
};
module.exports = {
    listSchedules,
    getScheduleById,
    createSchedule,
    updateSchedule,
    deleteSchedule,
};
