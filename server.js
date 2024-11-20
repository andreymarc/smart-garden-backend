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

        // **Notification Logic**
        const notifications = [];
        if (data.moisture > 90) {
            notifications.push({
                type: 'Flood Alert',
                message: 'High moisture levels detected. Risk of flooding!'
            });
        }
        if (data.temperature > 40) {
            notifications.push({
                type: 'Extreme Weather Warning',
                message: 'Extreme temperature detected.'
            });
        }
        if (data.moisture < 20) {
            notifications.push({
                type: 'Water Needed',
                message: 'Plant needs water. Low moisture levels detected.'
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
            // **Notification Logic**
            const notifications = [];

            // Flood Alert
            if (moisture > 90) {
                notifications.push({
                    type: 'Flood Alert',
                    message: `High moisture levels detected for ${plant_id}. Risk of flooding!`
                });
            }

            // Extreme Weather Warning
            if (temperature > 40) {
                notifications.push({
                    type: 'Extreme Weather Warning',
                    message: `Extreme temperature detected for ${plant_id}. Current temperature: ${temperature}°C.`
                });
            }

            // Water Needed
            if (moisture < 20) {
                notifications.push({
                    type: 'Water Needed',
                    message: `Plant ${plant_id} needs water. Low moisture levels detected.`
                });
            }

            console.log('Generated Notifications:', notifications);

            res.status(201).send({
                message: 'Data stored in database',
                notifications: notifications
            });
        }
    });

    app.get('/api/notifications', (req, res) => {
    const notifications = [];

    // Analyze the in-memory data for notifications
    sensorData.forEach(({ plant_id, light, moisture, temperature }) => {
        if (moisture > 90) {
            notifications.push({
                type: 'Flood Alert',
                message: `High moisture levels detected for ${plant_id}. Risk of flooding!`
            });
        }
        if (temperature > 40) {
            notifications.push({
                type: 'Extreme Weather Warning',
                message: `Extreme temperature detected for ${plant_id}.`
            });
        }
        if (moisture < 20) {
            notifications.push({
                type: 'Water Needed',
                message: `Plant ${plant_id} needs water. Low moisture levels detected.`
            });
        }
    });

    res.json(notifications);
});

});

const cron = require('node-cron');

// A simulated storage for scheduled notifications (you can replace this with database integration)
let scheduledNotifications = [];

// Scheduler for fertilizer alerts (every three months)
// cron.schedule('0 0 1 */3 *', () => { // Runs at midnight on the 1st day of every 3rd month
//     console.log('Scheduler: Time to add fertilizer for all plants!');
//     scheduledNotifications.push({
//         type: 'Fertilizer Reminder',
//         message: 'It’s time to add fertilizer to your plants.',
//         timestamp: new Date(),
//     });
// });




// Scheduler for changing planting medium (every six months)
// cron.schedule('0 0 1 */6 *', () => { // Runs at midnight on the 1st day of every 6th month
//     console.log('Scheduler: Time to change the planting medium for all plants!');
//     scheduledNotifications.push({
//         type: 'Planting Medium Reminder',
//         message: 'It’s time to change the planting medium for your plants.',
//         timestamp: new Date(),
//     });
// });

cron.schedule('* * * * *', () => { // Runs every minute
    const notification = {
        type: 'Fertilizer Reminder',
        message: 'It’s time to add fertilizer to your plants.',
        timestamp: new Date(),
    };
    scheduledNotifications.push(notification);
    console.log('Scheduler: New Fertilizer Reminder Added:', notification);
});

// Scheduler for planting medium change reminders (every 2 minutes for testing)
cron.schedule('*/2 * * * *', () => { // Runs every 2 minutes
    const notification = {
        type: 'Planting Medium Reminder',
        message: 'It’s time to change the planting medium for your plants.',
        timestamp: new Date(),
    };
    scheduledNotifications.push(notification);
    console.log('Scheduler: New Planting Medium Reminder Added:', notification);
});

// API to fetch scheduled notifications
app.get('/api/scheduled-notifications', (req, res) => {
    res.json(scheduledNotifications);
});



app.get('/api/sensors', (req, res) => {
    res.json(sensorData);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
