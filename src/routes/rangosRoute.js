const express = require('express'); 
const { editRango, createRango } = require('../controllers/rangosController');
const router = express.Router();

router.put('/', editRango)
router.post('/', createRango)

module.exports = router;