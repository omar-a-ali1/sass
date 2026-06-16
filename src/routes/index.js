const express = require('express');
const healthRoutes = require('./health');
const swaggerUi = require('swagger-ui-express');
const swaggerDocuemnt = require('./swagger')
const routeV1 = require('./v1/index');
const fallback = require('./defaults/fallback');
const router = express.Router();

// change it !!
router.get('/', (req, res) =>
{
  return res.json(
    {
      message:"SASS work !"
    }
  )
})
router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocuemnt));
router.use('/health', healthRoutes);
router.use('/api/v1', routeV1);
router.use(fallback);
module.exports = router;