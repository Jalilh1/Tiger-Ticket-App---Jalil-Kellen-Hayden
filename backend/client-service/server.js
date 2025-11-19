/**
 * Client service bootstrap
 * Brief: Express app wiring for client-facing API.
 * Side effects: Starts HTTP server and mounts /api/client routes.
 */

const express = require('express');
const cors = require('cors');
const app = express();
const routes = require('./routes/clientRoutes');
require('dotenv').config({ path: './.env' });


app.use(cors());
app.use(express.json());
app.use('/api/client', routes);



const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Client Server running at http://localhost:${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api/client/events`);
    });
