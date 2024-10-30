const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

let sensorData = [];

app.post('/api/sensors', (req, res) => {
    const { plant_id, light, moisture, temperature } = req.body;
    const timestamp = new Date();
    sensorData.push({ plant_id, light, moisture, temperature, timestamp });
    res.status(201).send({ message: "Data stored" });
});

app.get('/api/sensors', (req, res) => {
    res.json(sensorData);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
