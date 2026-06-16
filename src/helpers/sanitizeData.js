/**
 * Clean data documents by removing sensitive and internal metadata fields dynamically
 * @param {Object} doc - Raw Mongoose document or plain JavaScript object
 * @param {...string} fields - Optional specific fields to remove dynamically
 * @returns {Object} Cleaned plain JavaScript object
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