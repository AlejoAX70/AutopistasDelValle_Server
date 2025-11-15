const express = require('express')
const router = express.Router();

const reportsRouter = require('./reportRoute')
const operacionRouter = require('./operacionRoute')
const configuracionRoute = require('./configuracionesRoute')
const authRoute = require('./authRoute')
const rangosRoute = require('./rangosRoute')

const baseURL = "api/v4"

router.use(`/${baseURL}/reports`, reportsRouter)
router.use(`/${baseURL}/operacion`, operacionRouter)
router.use(`/${baseURL}/config`, configuracionRoute)
router.use(`/${baseURL}/auth`, authRoute)
router.use(`/${baseURL}/rangos`, rangosRoute)


module.exports = router;