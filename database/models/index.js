'use strict';
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const process = require('process');
const env = process.env.NODE_ENV || 'development';
const config = require(path.resolve(__dirname, '..', 'config', 'database.js'))[env];

const db = {};
let sequelize;

if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

const modelFactories = [
  require('../../src/modules/operative/models/Appointment'),
  require('../../src/modules/operative/models/AppointmentHistory'),
  require('../../src/modules/operative/models/CareUnit'),
  require('../../src/modules/operative/models/PeopleAttended'),
  require('../../src/modules/operative/models/Professional'),
  require('../../src/modules/operative/models/Schedule'),
  require('../../src/modules/clinic/models/ClinicalNote'),
  require('../../src/modules/clinic/models/ClinicalNoteVersion'),
  require('../../src/modules/clinic/models/Episode'),
  require('../../src/modules/clinic/models/Diagnosis'),
  require('../../src/modules/clinic/models/Consent'),
  require('../../src/modules/clinic/models/Order'),
  require('../../src/modules/clinic/models/orderitem'),
  require('../../src/modules/clinic/models/Result'),
  require('../../src/modules/clinic/models/ResultVersion'),
  require('../../src/modules/platform/models/User'),
  require('../../src/modules/bussines/models/Insurer'),
  require('../../src/modules/bussines/models/Plan'),
];

modelFactories.forEach(registerModel => {
  const model = registerModel(sequelize, DataTypes);
  db[model.name] = model;
});

Object.keys(db).forEach(modelName => {
  if (typeof db[modelName].associate === 'function') {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.modules = {
  operative: {
    Appointment: db.Appointment,
    AppointmentHistory: db.AppointmentHistory,
    CareUnit: db.CareUnit,
    PeopleAttended: db.PeopleAttended,
    Professional: db.Professional,
    Schedule: db.Schedule,
  },
  clinic: {
    ClinicalNote: db.ClinicalNote,
    ClinicalNoteVersion: db.ClinicalNoteVersion,
    Episode: db.Episode,
    Diagnosis: db.Diagnosis,
    Consent: db.Consent,
    Order: db.Order,
    OrderItem: db.OrderItem,
    Result: db.Result,
    ResultVersion: db.ResultVersion,
  },
  platform: {
    User: db.User,
  },
  bussines: {
    Insurer: db.Insurer,
    Plan: db.Plan,
  },
};
module.exports = db;
