const db = require('../../../../database/models');
const { Professional } = db.modules.operative;
const { User } = db.modules.platform;

const findById = async (id) => {
    return Professional.findByPk(id);
};

const findAndCountAll = async ({ where, offset, limit, order }) => {
    return Professional.findAndCountAll({
        where,
        offset,
        limit,
        order,
    });
};

const createWithUser = async (professionalData, userData) => {
    const user = await User.create({
        username: userData.username,
        email: userData.email,
        passwordHash: userData.passwordHash,
        status: userData.status !== undefined ? userData.status : true,
        creationDate: new Date()
    });
    const professional = await Professional.create({
        userId: user.id,
        names: professionalData.names,
        surNames: professionalData.surNames,
        professionalRegister: professionalData.professionalRegister,
        specialty: professionalData.specialty,
        email: professionalData.email,
        phone: professionalData.phone,
        scheduleEnabled: professionalData.scheduleEnabled !== undefined ? professionalData.scheduleEnabled : false,
        status: professionalData.status !== undefined ? professionalData.status : true
    });
    return { user, professional };
};

const update = async (professional, payload) => {
    return professional.update(payload);
};

const changeStatus = async (professional) => {
    return professional.update({ status: false });
};

module.exports = {
    findById,
    findAndCountAll,
    createWithUser,
    update,
    changeStatus,
};