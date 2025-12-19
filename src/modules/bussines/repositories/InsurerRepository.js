const db = require('../../../../database/models');
const { Insurer } = db.modules.bussines;

const findById = async (id) => {
    return Insurer.findByPk(id);
};

const findByNit = async (nit) => {
    return Insurer.findOne({
        where: { nit }
    });
};

const findAndCountAll = async ({ where, offset, limit, order }) => {
    return Insurer.findAndCountAll({
        where,
        offset,
        limit,
        order,
    });
};

const create = async (data) => {
    return Insurer.create(data);
};

const update = async (insurer, payload) => {
    return insurer.update(payload);
};

const changeStatus = async (insurer, estado) => {
    return insurer.update({ estado });
};

module.exports = {
    findById,
    findByNit,
    findAndCountAll,
    create,
    update,
    changeStatus,
};

