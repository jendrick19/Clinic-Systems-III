const db = require('../../../../database/models');
const { Plan, Insurer } = db.modules.bussines;

const findById = async (id) => {
    return Plan.findByPk(id, {
        include: [{
            model: Insurer,
            as: 'aseguradora',
            attributes: ['id', 'nombre', 'nit', 'estado']
        }]
    });
};

const findByCodigo = async (codigo) => {
    return Plan.findOne({
        where: { codigo }
    });
};

const findAndCountAll = async ({ where, offset, limit, order }) => {
    return Plan.findAndCountAll({
        where,
        offset,
        limit,
        order,
        include: [{
            model: Insurer,
            as: 'aseguradora',
            attributes: ['id', 'nombre', 'nit', 'estado']
        }]
    });
};

const create = async (data) => {
    return Plan.create(data);
};

const update = async (plan, payload) => {
    return plan.update(payload);
};

const changeStatus = async (plan, activo) => {
    return plan.update({ activo });
};

module.exports = {
    findById,
    findByCodigo,
    findAndCountAll,
    create,
    update,
    changeStatus,
};

