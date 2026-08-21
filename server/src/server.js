const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

let server;

const startServer = async () => {
  try {
    await connectDB();
    server = app.listen(PORT, () => {
      console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });

    server.on('error', (e) => {
      if (e.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Retrying in 1 second...`);
        setTimeout(() => {
          server.close();
          server.listen(PORT);
        }, 1000);
      } else {
        console.error('Server error:', e);
      }
    });

  } catch (err) {
    console.error('Fatal startup error:', err);
    process.exit(1);
  }
};

startServer();

const gracefulShutdown = () => {
  console.log('Shutdown signal received. Shutting down gracefully.');
  if (server) {
    server.close(() => {
      console.log('Process terminated.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('SIGUSR2', gracefulShutdown); // For nodemon restarts
