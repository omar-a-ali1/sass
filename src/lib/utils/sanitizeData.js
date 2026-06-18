/**
 * Data Sanitizer
 *
 * Strips sensitive fields (password, __v) and internal metadata
 * from Mongoose documents or plain objects before returning them
 * in API responses. Accepts extra field names for fine-grained control.
 *
 * Two call modes:
 *
 *   // single document
 *   sanitizeData(user)
 *   sanitizeData(user, ['token', 'secret'])
 *
 *   // inside .map() with extra fields
 *   users.map(sanitizeData(['token']))     // returns a mapper function
 *
 * @module helpers/sanitizeData
 */

const sanitizeData = (doc, extra = []) => {
  if (!doc) return null;

  const cleanedObj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };

  delete cleanedObj.__v;
  delete cleanedObj.password;

  for (const field of extra) {
    delete cleanedObj[field];
  }

  return cleanedObj;
};

const sanitize = (input, extra = []) => {
  if (Array.isArray(input) && input.every((i) => typeof i === 'string')) {
    return (doc) => sanitizeData(doc, input);
  }
  return sanitizeData(input, Array.isArray(extra) ? extra : []);
};

module.exports = sanitize;