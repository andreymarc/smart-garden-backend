const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const { mqtt, io, iot } = require('aws-iot-device-sdk-v2');
const cron = require('node-cron');
const { Configuration, OpenAIApi } = require('openai');


const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

let sensorData = [];
let scheduledNotifications = [];

// Database connection
const dbConnection = mysql.createConnection({
    host: 'smart-garden-db',
    user: 'admin',
    password: 'secret_number',
    database: 'smart_garden_db',
});

dbConnection.connect((error) => {
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
                    plant_id: 'Plant 1', // Example plant ID
                    ...data,
                    timestamp: new Date(data.timestamp * 1000),
                };
                sensorData.push(sensorEntry);

                // Generate Notifications
                const notifications = [];
                if (data.moisture > 90) {
                    notifications.push({
                        type: 'Flood Alert',
                        message: 'High moisture levels detected. Risk of flooding!',
                    });
                }
                if (data.temperature > 40) {
                    notifications.push({
                        type: 'Extreme Weather Warning',
                        message: 'Extreme temperature detected.',
                    });
                }
                if (data.moisture < 20) {
                    notifications.push({
                        type: 'Water Needed',
                        message: 'Plant needs water. Low moisture levels detected.',
                    });
                }

                console.log('Generated Notifications from MQTT:', notifications);
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

    const sensorEntry = { plant_id, light, moisture, temperature, timestamp };
    sensorData.push(sensorEntry);

    // Insert into RDS
    const query = `INSERT INTO sensor_data (plant_id, light, moisture, temperature, timestamp) VALUES (?, ?, ?, ?, ?)`;
    const values = [plant_id, light, moisture, temperature, timestamp];

    dbConnection.query(query, values, (error, results) => {
        if (error) {
            console.error('Error inserting data:', error);
            return res.status(500).send({ message: 'Database insertion failed' });
        }

        // Generate Notifications
        const notifications = [];
        if (moisture > 90) {
            notifications.push({
                type: 'Flood Alert',
                message: `High moisture levels detected for ${plant_id}. Risk of flooding!`,
            });
        }
        if (temperature > 40) {
            notifications.push({
                type: 'Extreme Weather Warning',
                message: `Extreme temperature detected for ${plant_id}. Current temperature: ${temperature}°C.`,
            });
        }
        if (moisture < 20) {
            notifications.push({
                type: 'Water Needed',
                message: `Plant ${plant_id} needs water. Low moisture levels detected.`,
            });
        }

        console.log('Generated Notifications:', notifications);

        res.status(201).send({
            message: 'Data stored in database',
            notifications,
        });
    });
});

app.get('/api/notifications', (req, res) => {
    const notifications = [];

    sensorData.forEach(({ plant_id, light, moisture, temperature }) => {
        if (moisture > 90) {
            notifications.push({
                type: 'Flood Alert',
                message: `High moisture levels detected for ${plant_id}. Risk of flooding!`,
            });
        }
        if (temperature > 40) {
            notifications.push({
                type: 'Extreme Weather Warning',
                message: `Extreme temperature detected for ${plant_id}.`,
            });
        }
        if (moisture < 20) {
            notifications.push({
                type: 'Water Needed',
                message: `Plant ${plant_id} needs water. Low moisture levels detected.`,
            });
        }
    });

    res.json(notifications);
});

app.get('/api/scheduled-notifications', (req, res) => {
    res.json(scheduledNotifications);
});

app.get('/api/sensors', (req, res) => {
    res.json(sensorData);
});

// Cron Jobs for Reminders
cron.schedule('* * * * *', () => { // Runs every minute
    const notification = {
        type: 'Fertilizer Reminder',
        message: 'It’s time to add fertilizer to your plants.',
        timestamp: new Date(),
    };
    scheduledNotifications.push(notification);
    console.log('Scheduler: New Fertilizer Reminder Added:', notification);
});

cron.schedule('*/2 * * * *', () => { // Runs every 2 minutes
    const notification = {
        type: 'Planting Medium Reminder',
        message: 'It’s time to change the planting medium for your plants.',
        timestamp: new Date(),
    };
    scheduledNotifications.push(notification);
    console.log('Scheduler: New Planting Medium Reminder Added:', notification);
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
