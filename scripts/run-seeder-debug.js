(async ()=>{
  try {
    const db = require('./database/models');
    const seeder = require('./database/seeders/20251125000000-demo-orders.js');
    await seeder.up(db.sequelize.getQueryInterface(), require('sequelize'));
    console.log('Seeder ejecutado OK');
    process.exit(0);
  } catch (e) {
    console.error('ERROR STACK:');
    console.error(e && e.stack ? e.stack : e);
    process.exit(1);
  }
})();
