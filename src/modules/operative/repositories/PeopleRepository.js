// fileName: src/modules/operative/repositories/PeopleRepository.js
const { Op } = require('sequelize');
const db = require('../../../../database/models');
const { PeopleAttended } = db.modules.operative;
const { User } = db.modules.platform; // Importamos el modelo User

const findById = async (id) => {
  return PeopleAttended.findByPk(id);
};

const findByDocument = async (documentType, documentId, excludeId = null) => {
  const where = {
    documentType,
    documentId,
  };
  if (excludeId) {
    where.id = {
      [Op.ne]: excludeId,
    };
  }
  return PeopleAttended.findOne({ where });
};

const findAndCountAll = async ({ where, offset, limit, order }) => {
  return PeopleAttended.findAndCountAll({
    where,
    offset,
    limit,
    order,
  });
};

// Modificado: Crear Paciente Y Usuario en una transacción
const createWithUser = async (personPayload, userPayload) => {
  const transaction = await db.sequelize.transaction();
  try {
    // 1. Crear el Usuario
    const user = await User.create({
      username: userPayload.username,
      email: userPayload.email,
      passwordHash: userPayload.passwordHash,
      status: true,
      creationDate: new Date()
    }, { transaction });

    // 2. Crear la Persona (Paciente)
    // Nota: Como no existe 'userId' en PeopleAttended, la relación es lógica por documento/username
    const person = await PeopleAttended.create(personPayload, { transaction });

    await transaction.commit();
    return { person, user };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const update = async (person, payload) => {
  return person.update(payload);
};

const save = async (person) => {
  return person.save();
};

module.exports = {
  findById,
  findAndCountAll,
  findByDocument,
  createWithUser, // Exportamos la nueva función
  update,
  save,
};