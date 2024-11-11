const express = require('express');
const cors = require('cors');
const { mqtt, io, iot } = require('aws-iot-device-sdk-v2');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

let sensorData = [];

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
        // Convert ArrayBuffer to string
        const payloadString = new TextDecoder('utf-8').decode(payload);
        // Parse the JSON string
        const data = JSON.parse(payloadString);
        console.log('Received message:', data);
        // Assign a default plant_id
        const sensorEntry = {
            plant_id: 'Plant 1', // Default plant_id
            ...data,
            timestamp: new Date(data.timestamp * 1000) // Convert UNIX timestamp to JavaScript Date object
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

// Express.js Routes
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
