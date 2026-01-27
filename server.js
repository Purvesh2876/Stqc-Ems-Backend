const http = require('http');
const fs = require('fs');
const app = require('./app');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: '.env' });

// Define the PORT
const PORT = process.env.PORT || 5001;

// SSL Certificate
// const sslOptions = {
//   key: fs.readFileSync('config/ambicam.key'),
//   cert: fs.readFileSync('config/ambicam.crt'),
// };

// Create HTTPS server
http.createServer(app).listen(PORT, () => {
  console.log(`HTTPS Server running on port ${PORT}`);
});

// // SSL Certificate
// const sslOptions = {
//   key: fs.readFileSync('config/ambicam.key'),
//   cert: fs.readFileSync('config/ambicam.crt'),
// };

// // Create HTTPS server
// https.createServer(sslOptions, app).listen(PORT, () => {
//   console.log(`HTTPS Server running on port ${PORT}`);
// });
