const formatJoiErrors = (joiError) => {
  const formattedErrors = {};

  joiError.details.forEach((err) => {
    const field = err.path[0];

    if (!formattedErrors[field]) {
      formattedErrors[field] = [];
    }

    const cleanMessage = err.message.replace(/"/g, '');
    formattedErrors[field].push(cleanMessage);
  });

  return formattedErrors;
};

module.exports = formatJoiErrors;