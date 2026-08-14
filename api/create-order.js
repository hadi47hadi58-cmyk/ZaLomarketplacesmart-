/**
 * Vercel Serverless Function - ZaLo Create Order API
 */
const ordersHandler = require('./orders');

module.exports = async (req, res) => {
  return ordersHandler(req, res);
};
