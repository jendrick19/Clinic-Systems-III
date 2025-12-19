const db = require('../../../../database/models');
const { Schedule } = db.modules.operative;

const findById = async (id) => {
    return Schedule.findByPk(id, {
        include: [
            {
                association: 'professional',
                attributes: ['id', 'names', 'surNames', 'specialty']
            },
            {
                association: 'careUnit',
                attributes: ['id', 'name', 'address']
            }
        ]
    });
};

const findAndCountAll = async ({ where, offset, limit, order, include }) => {
    const defaultInclude = [
        {
            association: 'professional',
            attributes: ['id', 'names', 'surNames', 'specialty']
        },
        {
            association: 'careUnit',
            attributes: ['id', 'name', 'address']
        }
    ];
    return Schedule.findAndCountAll({
        where,
        offset,
        limit,
        order,
        include: include || defaultInclude
    });
};

const create = async (payload) => {
    return Schedule.create(payload);
};

const update = async (schedule, payload) => {
    return schedule.update(payload);
};

const deleteSchedule = async (schedule) => {
    return schedule.destroy();
};

module.exports = {
    findById,
    findAndCountAll,
    create,
    update,
    deleteSchedule,
};
