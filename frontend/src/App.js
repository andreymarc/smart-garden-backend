import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function App() {
    const [sensorData, setSensorData] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [expandedPlants, setExpandedPlants] = useState({});
    const [activeTab, setActiveTab] = useState("Dashboard");

    // Fetch sensor data from backend
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

    const togglePlantData = (plant) => {
        setExpandedPlants((prev) => ({
            ...prev,
            [plant]: !prev[plant],
        }));
    };

    const createChartData = (key, plant) => {
        const filteredData = sensorData.filter(entry => entry.plant_id === plant);
        return {
            labels: filteredData.map(entry => new Date(entry.timestamp).toLocaleTimeString()),
            datasets: [
                {
                    label: key.charAt(0).toUpperCase() + key.slice(1),
                    data: filteredData.map(entry => entry[key]),
                    borderColor: key === 'light' ? '#007bff' : key === 'moisture' ? '#28a745' : '#ffc107',
                    backgroundColor: key === 'light' ? '#007bff' : key === 'moisture' ? '#28a745' : '#ffc107',
                    tension: 0.4,
                    fill: false,
                },
            ],
        };
    };

    return (
        <div className="container my-5">
            <h1 className="text-center mb-4">🌱 Smart Garden Dashboard</h1>

            {/* Notifications Section */}
            <div className="mb-4">
                <button
                    className="btn btn-outline-primary"
                    onClick={() => setShowNotifications(!showNotifications)}
                >
                    {showNotifications ? "Hide Notifications" : "Show Notifications"}
                </button>

                {showNotifications && (
                    <div className="notifications mt-3 p-3 rounded shadow-sm">
                        <h4>Notifications</h4>
                        {notifications.length > 0 ? (
                            <ul className="list-group">
                                {notifications.map((note, index) => (
                                    <li key={index} className={`list-group-item ${note.type === 'Flood Alert'
                                        ? 'list-group-item-danger'
                                        : note.type === 'Extreme Weather'
                                            ? 'list-group-item-warning'
                                            : 'list-group-item-info'
                                        }`}>
                                        <strong>{note.type}:</strong> {note.message}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted">No notifications at the moment.</p>
                        )}
                    </div>
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
                            <div key={plant} className="mb-3 w-100">
                                <button
                                    className="btn btn-primary w-100"
                                    onClick={() => togglePlantData(plant)}
                                >
                                    {expandedPlants[plant] ? `Hide ${plant} Data` : `Show ${plant} Data`}
                                </button>

                                {expandedPlants[plant] && (
                                    <div className="mt-3">
                                        {sensorData.filter(entry => entry.plant_id === plant).length > 0 ? (
                                            sensorData.filter(entry => entry.plant_id === plant).map((entry, index) => (
                                                <div key={index} className="card shadow-sm p-3 mb-3">
                                                    <p><strong>🌞 Light:</strong> {entry.light}</p>
                                                    <p><strong>💧 Moisture:</strong> {entry.moisture}</p>
                                                    <p><strong>🌡 Temperature:</strong> {entry.temperature} °C</p>
                                                    <p className="text-muted">
                                                        <small><strong>Timestamp:</strong> {new Date(entry.timestamp).toLocaleString()}</small>
                                                    </p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-center text-muted">No data available for {plant}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Graph View */}
            {activeTab === "Graph" && (
                <div className="text-center">
                    <h3>Graphs for Selected Plants</h3>
                    {["Plant 1", "Plant 2", "Plant 3"].map(plant => (
                        <div key={plant} className="mb-4">
                            <h5>{plant}</h5>
                            <Line data={createChartData('light', plant)} />
                            <Line data={createChartData('moisture', plant)} />
                            <Line data={createChartData('temperature', plant)} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default App;
