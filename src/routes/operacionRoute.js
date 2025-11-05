const express = require('express'); 
const { dinamicaCerrada, dinamicaAbierta, soloBasculaDinamica, autorizarPesajeApi, noRunt, IngresoEstatica, soloEstatica, soloNacional, automaticoApi, displayPersonalizado, borrarMensaje, sobrePesoApi } = require('../controllers/operationsController');

const router = express.Router();

router.get('/no_ingreso_dinamica', dinamicaCerrada)
router.get('/ingreso_dinamica', dinamicaAbierta)
router.get('/salida_nacional', soloBasculaDinamica)
router.get('/autorizar_pesaje', autorizarPesajeApi)
router.get('/no_runt', noRunt)
router.get('/ingreso_estatica', IngresoEstatica)
router.get('/solo_estatica', soloEstatica)
router.get('/solo_nacional', soloNacional)
router.get('/automatico', automaticoApi)
router.get('/display_personalizado', automaticoApi)
router.get('/borrar_mensaje', borrarMensaje)
router.get('/sobre_peso', sobrePesoApi)
router.post('/displayPersonalizado', displayPersonalizado)

module.exports = router;
