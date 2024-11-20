const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const { mqtt, io, iot } = require('aws-iot-device-sdk-v2');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

let sensorData = [];

// Database connection
const dbConnection = mysql.createConnection({
    host: 'smart-garden-db.c1gc4q2uet6b.us-east-1.rds.amazonaws.com',
    user: 'admin',
    password: '0523670072',
    database: 'smart_garden_db'
});

dbConnection.connect(error => {
    if (error) {
        console.error('Error connecting to the database:', error);
    } else {
        console.log('Connected to the AWS RDS database.');
    }
});

// AWS IoT Core MQTT Configuration
const config_builder = iot.AwsIotMqttConnectionConfigBuilder.new_mtls_builder_from_path(
    '/Users/andreymarchuk/Downloads/awsIoT/certificate.pem.crt',
    '/Users/andreymarchuk/Downloads/awsIoT/private.pem.key'
);
config_builder.with_certificate_authority_from_path(undefined, '/Users/andreymarchuk/Downloads/awsIoT/root-ca.pem');
config_builder.with_clean_session(false);
config_builder.with_client_id('ExpressServerClient');
config_builder.with_endpoint('a1jdknvzevt8bn-ats.iot.us-east-1.amazonaws.com');

const config = config_builder.build();
const client = new mqtt.MqttClient(new io.ClientBootstrap());
const connection = client.new_connection(config);

// Connect to AWS IoT Core and subscribe to the topic
(async () => {
    try {
        await connection.connect();
        console.log('Connected to AWS IoT Core');

        await connection.subscribe('smart/garden/sensor', mqtt.QoS.AtLeastOnce, (topic, payload) => {
            try {
                const payloadString = new TextDecoder('utf-8').decode(payload);
                const data = JSON.parse(payloadString);
                console.log('Received message:', data);

                const sensorEntry = {
                    plant_id: 'Plant 1',
                    ...data,
                    timestamp: new Date(data.timestamp * 1000)
                };
                sensorData.push(sensorEntry);
            } catch (error) {
                console.error('Error processing message:', error);
            }
        });

    } catch (error) {
        console.error('Connection error:', error);
    }
})();

// Routes
app.post('/api/sensors', (req, res) => {
    const { plant_id, light, moisture, temperature } = req.body;
    const timestamp = new Date();

    // Save to in-memory array
    const sensorEntry = { plant_id, light, moisture, temperature, timestamp };
    sensorData.push(sensorEntry);

    // Insert into RDS
    const query = `INSERT INTO sensor_data (plant_id, light, moisture, temperature, timestamp) VALUES (?, ?, ?, ?, ?)`;
    const values = [plant_id, light, moisture, temperature, timestamp];

    dbConnection.query(query, values, (error, results) => {
        if (error) {
            console.error('Error inserting data:', error);
            res.status(500).send({ message: 'Database insertion failed' });
        } else {
            res.status(201).send({ message: 'Data stored in database' });
        }
    });
});

app.get('/api/sensors', (req, res) => {
    res.json(sensorData);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
