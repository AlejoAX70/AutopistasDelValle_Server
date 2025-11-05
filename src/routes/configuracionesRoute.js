const express = require('express'); 
const { getInitialData, createCategoria, editCategoria, createLimite, editLimite, editGlobalConfig, createUser, EditUser, restartServer } = require('../controllers/configuracionesController');
const router = express.Router();

router.get('/', getInitialData)
router.post('/categoria', createCategoria)
router.put('/categoria', editCategoria)
router.post('/limite', createLimite)
router.put('/limite', editLimite)

router.put('/globalConfig', editGlobalConfig)
router.post('/user', createUser)
router.put('/user', EditUser)
router.post('/restartServer', restartServer)

 
module.exports = router;
