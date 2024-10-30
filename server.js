const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.json());

let sensorData = [];

// Endpoint to receive data
app.post('/api/sensors', (req, res) => {
    const { light, moisture, temperature } = req.body;
    const timestamp = new Date();
    sensorData.push({ light, moisture, temperature, timestamp });
    console.log("Data received:", req.body);
    res.status(201).send({ message: "Data stored" });
});

// Endpoint to get all data (for testing)
app.get('/api/sensors', (req, res) => {
    res.send(sensorData);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
