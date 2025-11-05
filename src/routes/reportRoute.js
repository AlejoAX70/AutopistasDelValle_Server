const express = require('express'); 
const { getAllDashboard, getVehicleById } = require('../controllers/reportsController');
const router = express.Router();

router.get('/dashboard', getAllDashboard)

router.get('/getVehicleById/:vehiculoId',getVehicleById )
 
module.exports = router;
