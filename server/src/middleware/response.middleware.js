// Standardize all responses going forward
const sendSuccess = (res, data, status = 200) => {
  res.status(status).json(data); // Always send data directly
};

module.exports = { sendSuccess };