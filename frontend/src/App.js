import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend } from 'chart.js';
import './App.css'; // Custom CSS for modern styles

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend);

function App() {
    const [sensorData, setSensorData] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [selectedPlant, setSelectedPlant] = useState("Plant 1");
    const [activeTab, setActiveTab] = useState("Dashboard");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/sensors');
                const data = await response.json();
                setSensorData(data);
                generateNotifications(data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 300000); // Fetch every 5 minutes
        return () => clearInterval(interval);
    }, []);

    const thresholds = {
        light: { low: 20, high: 80 },
        moisture: { low: 30, high: 70 },
        temperature: { low: 15, high: 30 },
    };

    const generateRecommendations = ({ light, moisture, temperature }) => {
        const recommendations = [];
        if (light < thresholds.light.low) recommendations.push("Move to a brighter area.");
        if (light > thresholds.light.high) recommendations.push("Reduce exposure to direct light.");
        if (moisture < thresholds.moisture.low) recommendations.push("Water the plant.");
        if (moisture > thresholds.moisture.high) recommendations.push("Allow soil to dry out a bit.");
        if (temperature < thresholds.temperature.low) recommendations.push("Move to a warmer location.");
        if (temperature > thresholds.temperature.high) recommendations.push("Move to a cooler location.");
        return recommendations;
    };

    const generateNotifications = (data) => {
        const newNotifications = [];
        data.forEach((entry) => {
            if (entry.moisture > thresholds.moisture.high) {
                newNotifications.push({
                    type: 'Flood Alert',
                    message: `${entry.plant_id}: High moisture levels detected.`,
                });
            }
            if (entry.temperature > thresholds.temperature.high) {
                newNotifications.push({
                    type: 'Extreme Weather',
                    message: `${entry.plant_id}: Extreme temperature detected (${entry.temperature}°C).`,
                });
            }
            if (entry.moisture < thresholds.moisture.low) {
                newNotifications.push({
                    type: 'Water Needed',
                    message: `${entry.plant_id}: Low moisture detected. Please water the plant.`,
                });
            }
        });
        setNotifications(newNotifications);
    };

    const filteredData = sensorData.filter(entry => entry.plant_id === selectedPlant);

    const createChartData = (key) => ({
        labels: filteredData.map(entry => new Date(entry.timestamp).toLocaleTimeString()),
        datasets: [{
            label: key.charAt(0).toUpperCase() + key.slice(1),
            data: filteredData.map(entry => entry[key]),
            fill: false,
            backgroundColor: key === 'light' ? '#007bff' : key === 'moisture' ? '#28a745' : '#ffc107',
            borderColor: key === 'light' ? '#007bff' : key === 'moisture' ? '#28a745' : '#ffc107',
            tension: 0.4,
        }],
    });

    return (
        <div className="container my-5">
            <h1 className="text-center mb-4">🌱 Smart Garden Dashboard</h1>

            {/* Notifications Section */}
            <div className="notifications mb-4 p-3 rounded shadow-sm">
                <h4>Notifications</h4>
                {notifications.length > 0 ? (
                    <ul className="list-group">
                        {notifications.map((note, index) => (
                            <li key={index} className={`list-group-item ${note.type === 'Flood Alert' ? 'list-group-item-danger' : note.type === 'Extreme Weather' ? 'list-group-item-warning' : 'list-group-item-info'}`}>
                                <strong>{note.type}:</strong> {note.message}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-muted">No notifications at the moment.</p>
                )}
            </div>

            {/* Navigation Tabs */}
            <ul className="nav nav-tabs justify-content-center mb-4">
                {["Dashboard", "Graph"].map(tab => (
                    <li key={tab} className="nav-item">
                        <button
                            className={`nav-link ${activeTab === tab ? "active" : ""}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    </li>
                ))}
            </ul>

            {/* Dashboard View */}
            {activeTab === "Dashboard" && (
                <>
                    <div className="d-flex justify-content-center flex-wrap mb-4">
                        {["Plant 1", "Plant 2", "Plant 3"].map((plant) => (
                            <button
                                key={plant}
                                className={`btn btn-${selectedPlant === plant ? 'primary' : 'secondary'} m-2`}
                                onClick={() => setSelectedPlant(plant)}
                            >
                                {plant}
                            </button>
                        ))}
                    </div>

                    <div className="row">
                        {filteredData.length > 0 ? (
                            filteredData.map((entry, index) => (
                                <div key={index} className="col-12 col-md-6 col-lg-4 mb-3">
                                    <div className="card shadow-sm p-3 border-0 rounded">
                                        <h5 className="text-center">{entry.plant_id}</h5>
                                        <p><strong>🌞 Light:</strong> {entry.light}</p>
                                        <p><strong>💧 Moisture:</strong> {entry.moisture}</p>
                                        <p><strong>🌡 Temperature:</strong> {entry.temperature} °C</p>
                                        <p className="text-muted">
                                            <small><strong>Timestamp:</strong> {new Date(entry.timestamp).toLocaleString()}</small>
                                        </p>
                                        <div>
                                            <strong>Recommendations:</strong>
                                            <ul>
                                                {generateRecommendations(entry).map((rec, i) => (
                                                    <li key={i}>{rec}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center">No data available for {selectedPlant}</p>
                        )}
                    </div>
                </>
            )}

            {/* Graph View */}
            {activeTab === "Graph" && (
                <div className="text-center">
                    <h3>Graphs for {selectedPlant}</h3>
                    <div className="row">
                        {["light", "moisture", "temperature"].map((key) => (
                            <div key={key} className="col-12 col-md-6 mb-4">
                                <h5>{key.charAt(0).toUpperCase() + key.slice(1)} Levels</h5>
                                <Line data={createChartData(key)} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
