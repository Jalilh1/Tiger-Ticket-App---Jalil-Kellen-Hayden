const express = require('express');
const cors = require('cors');
const app = express();
const routes = require('./routes/clientRoutes');
app.use(cors());
app.use('/api', routes);
const PORT = 6001;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));