const express = require('express');
const healthRoutes = require('./health');
const routeV1 = require('./v1/index');
const fallback = require('./defaults/fallback');
const router = express.Router();

router.get('/', (req, res) =>
{
  return res.json(
    {
      message:"SASS work !"
    }
  )
})

router.use('/health', healthRoutes);
router.use('/api/v1', routeV1);
router.use(fallback);
module.exports = router;