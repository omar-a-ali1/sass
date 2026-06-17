const router = require('express').Router();




module.exports = router


module.exports = {
  method: 'get',
  path: '/',
  handler: (req, res) => { res.json({ message: 'SASS work !' }) },
  docs: {
    tags: ['UP'],
    summary: 'Check if FrameWork Work correclty ',
    description: 'return SASS WORK !',
    responses: {
      200: { description: 'System is healthy' },
      400: { $ref: '#/components/responses/NotFoundError' }, 
      500: { $ref: '#/components/responses/InternalServerError' },
      503: { $ref: '#/components/responses/ServiceUnavailableError' },
    },
  },
};
