/**
 * File Upload Middleware
 *
 * Bridges multer (multipart/form-data parsing) with the configured
 * storage strategy (local / S3).  Factory that returns an Express
 * middleware array so routes can declare:
 *
 *   middleware: [authenticate, upload({ field: 'avatar', maxCount: 1 })],
 *
 * @module middlewares/upload
 */

const path = require('path');
const crypto = require('crypto');

/**
 * @typedef {Object} UploadOptions
 * @property {string}  [field='file']   - Form field name
 * @property {number}  [maxCount=1]     - Max files for the field
 * @property {number}  [maxSize=5*1024*1024] - Max file size in bytes
 * @property {RegExp}  [allowedMimes]   - Allowed MIME types pattern
 * @property {string}  [prefix='']      - Optional sub-directory prefix
 */

/**
 * Create an upload middleware array.
 *
 * Returns [ multerMiddleware, uploadToStorage ] so the pipeline is:
 *   multer parses multipart → storage strategy persists → req.uploadedFiles populated.
 *
 * @param {UploadOptions} opts
 * @returns {import('express').RequestHandler[]}
 */
function upload(opts = {}) {
  const {
    field = 'file',
    maxCount = 1,
    maxSize = 5 * 1024 * 1024,
    allowedMimes = null,
    prefix = '',
  } = opts;

  const multerMw = _buildMulterMiddleware(field, maxCount, maxSize, allowedMimes);
  const persistMw = _buildPersistMiddleware(field, prefix);

  return [multerMw, persistMw];
}

/* ── internal helpers ─────────────────────────────────────────────── */

function _buildMulterMiddleware(field, maxCount, maxSize, allowedMimes) {
  let multer;
  try {
    multer = require('multer');
  } catch {
    throw new Error(
      'multer is not installed. Run: npm install multer',
    );
  }

  const storage = multer.memoryStorage();

  const mw = multer({
    storage,
    limits: { fileSize: maxSize },
    fileFilter: allowedMimes
      ? (_req, file, cb) => {
          cb(null, allowedMimes.test(file.mimetype));
        }
      : undefined,
  })[
    maxCount === 1 ? 'single' : 'array'
  ](field, maxCount > 1 ? maxCount : undefined);

  mw._label = `upload({ field: '${field}', maxSize: ${maxSize} })`;
  return mw;
}

function _buildPersistMiddleware(field, prefix) {
  const persist = async (req, res, next) => {
    const storageStrategy = req.getService('storageStrategy');
    if (!storageStrategy) {
      return next(new Error('storageStrategy not registered in container'));
    }

    const files = req.files && req.files.length ? req.files : req.file ? [req.file] : [];

    if (!files.length) {
      req.uploadedFiles = [];
      return next();
    }

    try {
      const results = await Promise.all(
        files.map(async (file) => {
          const ext = path.extname(file.originalname);
          const name = `${crypto.randomUUID()}${ext}`;
          const key = prefix ? `${prefix}/${name}` : name;

          const storageKey = await storageStrategy.upload(key, file.buffer, file.mimetype);
          const url = storageStrategy.getUrl(storageKey);

          return {
            key: storageKey,
            url,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
          };
        }),
      );

      req.uploadedFiles = results;
      req.uploadedFile = results[0] || null;
      next();
    } catch (err) {
      next(err);
    }
  };

  persist._label = `upload→storage({ field: '${field}' })`;
  return persist;
}

module.exports = upload;
