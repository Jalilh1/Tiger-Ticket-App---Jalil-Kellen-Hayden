/**
 * Admin service bootstrap
 * Brief: Express app wiring, CORS/JSON middleware, routes, DB initialization.
 * Side effects: Starts HTTP server; initializes SQLite schema before listen.
 * // WHY: Initialize DB before accepting traffic to avoid first-request race conditions.
 */

const express = require('express');
const cors = require('cors');
const routes = require('./routes/adminRoutes');
const initializeDatabase = require('./setup');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());         

app.use('/api/admin', routes);        

app.get('/', (_req, res) => res.send('Admin Service is running'));

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Admin Service running at http://localhost:${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api/admin/events`); 
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database', err);
    process.exit(1);
  });
