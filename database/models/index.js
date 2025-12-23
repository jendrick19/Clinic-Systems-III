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
  require('../../src/modules/operative/models/appointment'),        // antes Appointment
  require('../../src/modules/operative/models/appointmenthistory'), // antes AppointmentHistory
  require('../../src/modules/operative/models/careunit'),           // antes CareUnit
  require('../../src/modules/operative/models/peopleattended'),     // antes PeopleAttended
  require('../../src/modules/operative/models/professional'),       // antes Professional
  require('../../src/modules/operative/models/schedule'),           // antes Schedule
  require('../../src/modules/clinic/models/clinicalnote'),          // antes ClinicalNote
  require('../../src/modules/clinic/models/clinicalnoteversion'),   // antes ClinicalNoteVersion
  require('../../src/modules/clinic/models/episode'),               // antes Episode
  require('../../src/modules/clinic/models/diagnosis'),             // antes Diagnosis
  require('../../src/modules/clinic/models/consent'),               // antes Consent
  require('../../src/modules/clinic/models/order'),                 // antes Order
  require('../../src/modules/clinic/models/orderItem'),             // OJO: Este parece ser camelCase (orderItem.js)
  require('../../src/modules/clinic/models/result'),                // antes Result
  require('../../src/modules/clinic/models/resultversion'),         // antes ResultVersion
  require('../../src/modules/platform/models/user'),                // antes User
  require('../../src/modules/bussines/models/insurer'),             // antes Insurer
  require('../../src/modules/bussines/models/plan'),                // antes Plan
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