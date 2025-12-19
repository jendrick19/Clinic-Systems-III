const { Op } = require('sequelize');
const db = require('../../../../database/models');
const { ClinicalNote, ClinicalNoteVersion } = db.modules.clinic;

const findById = async (id) => {
  return ClinicalNote.findByPk(id, {
    include: [
      { model: db.modules.operative.Professional, as: 'professional' },
      { model: db.modules.clinic.Episode, as: 'episode' },
      { model: db.modules.clinic.ClinicalNoteVersion, as: 'clinicalNoteVersions' }
    ]
  });
};

const findAndCountAll = async ({ where, offset, limit, order, include }) => {
  const defaultInclude = [
    { model: db.modules.operative.Professional, as: 'professional' },
    { model: db.modules.clinic.Episode, as: 'episode' },
    { model: db.modules.clinic.ClinicalNoteVersion, as: 'clinicalNoteVersions' }
  ];
  return ClinicalNote.findAndCountAll({
    where,
    offset,
    limit,
    order: order || [['noteDate', 'DESC']],
    include: include || defaultInclude,
    distinct: true,
  });
};

const createWithVersion = async (noteData, versionData, transaction = null) => {
  const note = await ClinicalNote.create(noteData, { transaction });
  await ClinicalNoteVersion.create({
    noteId: note.id,
    ...versionData
  }, { transaction });
  return findById(note.id);
};

const findVersionById = async (versionId) => {
  return ClinicalNoteVersion.findByPk(versionId, {
    include: [
      { 
        model: db.modules.clinic.ClinicalNote, 
        as: 'clinicalNote',
        include: [
          { model: db.modules.operative.Professional, as: 'professional' }
        ]
      }
    ]
  });
};

const findVersionsByNoteId = async (noteId) => {
  return ClinicalNoteVersion.findAll({
    where: { noteId },
    order: [['versionDate', 'DESC']]
  });
};

const findLatestVersion = async (noteId) => {
  return ClinicalNoteVersion.findOne({
    where: { noteId },
    order: [['versionDate', 'DESC']]
  });
};

const createVersion = async (noteId, versionData, transaction = null) => {
  return ClinicalNoteVersion.create({
    noteId,
    ...versionData
  }, { transaction });
};

module.exports = {
  findById,
  findAndCountAll,
  createWithVersion,
  findVersionById,
  findVersionsByNoteId,
  findLatestVersion,
  createVersion,
};
