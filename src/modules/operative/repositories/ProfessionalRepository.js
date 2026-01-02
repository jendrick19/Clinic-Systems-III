const { Op } = require('sequelize');
const db = require('../../../../database/models');
const { Professional } = db.modules.operative;
const { User } = db.modules.platform;

const findById = async (id) => {
    return Professional.findByPk(id);
};

const findByProfessionalRegister = async (professionalRegister) => {
    return Professional.findOne({
        where: { professionalRegister }
    });
};

const findAndCountAll = async ({ where, offset, limit, order }) => {
    return Professional.findAndCountAll({
        where,
        offset,
        limit,
        order,
    });
};

// --- FUNCIÓN MEJORADA CON TRANSACCIÓN ---
const createWithUser = async (professionalData, userData) => {
    const transaction = await db.sequelize.transaction();
    try {
        console.log('[ProfessionalRepository] Iniciando creación de Profesional + Usuario...');

        // 1. Crear Usuario
        const user = await User.create({
            username: userData.username,
            email: userData.email,
            passwordHash: userData.passwordHash,
            status: userData.status !== undefined ? userData.status : true,
            creationDate: new Date()
        }, { transaction });

        console.log(`[ProfessionalRepository] Usuario creado con ID: ${user.id}`);

        // 2. Crear Profesional vinculado
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
        }, { transaction });

        console.log(`[ProfessionalRepository] Profesional creado con ID: ${professional.id}`);

        // 3. Confirmar transacción
        await transaction.commit();
        
        return { user, professional };

    } catch (error) {
        // Si algo falla, deshacer todo
        await transaction.rollback();
        console.error('[ProfessionalRepository] Error en transacción, haciendo rollback:', error);
        throw error;
    }
};

const update = async (professional, payload) => {
    return professional.update(payload);
};

const changeStatus = async (professional) => {
    return professional.update({ status: false });
};

module.exports = {
    findById,
    findByProfessionalRegister,
    findAndCountAll,
    createWithUser,
    update,
    changeStatus,
};