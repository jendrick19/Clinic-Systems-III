const db = require('../../../../database/models');
const { CareUnit } = db.modules.operative;

const findById = async (id) => {
    return CareUnit.findByPk(id);
};

const findAndCountAll = async ({ where, offset, limit, order }) => {
    return CareUnit.findAndCountAll({
        where,
        offset,
        limit,
        order,
    });
};

const create = async (payload) => {
    return CareUnit.create(payload);
};

const update = async (careUnit, payload) => {
    return careUnit.update(payload);
};

const save = async (careUnit) => {
    return careUnit.save();
};

module.exports = {
    findById,
    findAndCountAll,
    create,
    update,
    save,
};
