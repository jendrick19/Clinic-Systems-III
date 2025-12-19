const { Router } = require('express');
const peopleRoutes = require('./PeopleRoutes');
const professionalRoutes = require('./ProfessionalRoutes');
const careUnitRoutes = require('./CareUnitRoutes');
const scheduleRoutes = require('./ScheduleRoutes');
const appointmentRoutes = require('./AppointmentRoutes');
const router = Router();

router.get('/health', (req, res) => {
  res.json({
    module: 'operative-agenda',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

router.use('/personas', peopleRoutes);
router.use('/profesionales', professionalRoutes);
router.use('/unid-atencion', careUnitRoutes);
router.use('/agendas', scheduleRoutes);
router.use('/citas', appointmentRoutes);

module.exports = router;
