const express = require('express'); 
const { loginUser } = require('../controllers/auth');
const router = express.Router();

router.post('/login', loginUser)

module.exports = router;
