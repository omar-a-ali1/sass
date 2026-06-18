/**
 * API Key Controller
 *
 * Handles HTTP request/response for API key management endpoints.
 *
 * @module controllers/apiKey.controller
 */

const create = async (req, res, next) =>
{
  try {
    const apiKeyService = req.getService('apiKeyService');
    const { name, permissions } = req.validatedBody;
    const result = await apiKeyService.generateKey(req.user.id, name, permissions);
    return res.respond(result, 201);
  } catch (err)
  {
    next(err)
  }
}

const list = async (req, res, next) =>
{
  try {
    const apiKeyService = req.getService('apiKeyService');
    const keys = await apiKeyService.listKeys(req.user.id);
    return res.respond(keys);
  } catch (err)
  {
    next(err)
  }
}

const revoke = async (req, res, next) =>
{
  try {
    const apiKeyService = req.getService('apiKeyService');
    await apiKeyService.revokeKey(req.params.id);
    return res.respond({ message: 'API key revoked' });
  } catch (err)
  {
    next(err)
  }
}

module.exports = {
  create,
  list,
  revoke,
}
