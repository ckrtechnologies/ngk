import app from './app.js';
import ENV from './config/env.js';

const PORT = ENV.PORT;

const server = app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`🚀 NGK2 Backend Server running on port ${PORT}`);
  console.log(`🌍 Mode: ${ENV.NODE_ENV}`);
  console.log(`🚗 TecDoc Endpoint: ${ENV.SERVICE_URL}`);
  console.log(`===================================================`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

export default server;
