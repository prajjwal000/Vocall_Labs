const mongoose = require('mongoose');

const getHealth = (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({
    success: true,
    message: 'Nexus API is running',
    service: 'nexus-api',
    database: dbStatus
  });
};

module.exports = { getHealth };
