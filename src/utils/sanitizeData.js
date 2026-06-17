/**
 * Data Sanitizer
 *
 * Strips sensitive fields (password, __v) and internal metadata
 * from Mongoose documents or plain objects before returning them
 * in API responses. Additional fields can be removed dynamically.
 *
 * @module helpers/sanitizeData
 */

/**
 * Sanitize a document by removing sensitive and internal fields
 *
 * Converts Mongoose documents to plain objects via `toObject()`,
 * then deletes default sensitive fields (`__v`, `password`) plus
 * any additional field names provided.
 *
 * @param {Object}   doc          - Raw Mongoose document or plain object
 * @param {...string} fields       - Optional additional field names to remove
 * @returns {Object|null} Cleaned plain object, or null if input is falsy
 */
const sanitizeData = (doc, ...fields) => {
  if (!doc) return null;

  const cleanedObj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };

  delete cleanedObj.__v;
  if ('password' in cleanedObj) {
    delete cleanedObj.password;
  }

  if (fields.length > 0) {
    fields.forEach(field => {
      delete cleanedObj[field];
    });
  }

  return cleanedObj;
};

module.exports = sanitizeData;