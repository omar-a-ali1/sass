const express = require('express');
const healthRoutes = require('./health');
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
router.use(fallback);
module.exports = router;