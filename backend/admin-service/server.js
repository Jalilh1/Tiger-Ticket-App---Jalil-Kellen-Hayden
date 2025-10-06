const express = require('express');
const cors = require('cors');
const app = express();
const routes = require('./routes/adminRoutes');
const  initializeDatabase = require('./setup');

app.use(cors());
app.use('/api/admin', routes);
const PORT = 5001;

app.get('/', (req, res) => {
    res.send('Admin Service is running');
});

initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Admin Service running at http://localhost:${PORT}`);
        console.log('API available at http://localhost:5001/api/admin-service/events');
    });
    })
    .catch((err) => {
        console.error('Failed to initialize database', err);
        process.exit(1);
    });

