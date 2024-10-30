import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend);

function App() {
    const [sensorData, setSensorData] = useState([]);
    const [selectedPlant, setSelectedPlant] = useState("Plant 1");
    const [activeTab, setActiveTab] = useState("Dashboard");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/sensors');
                const data = await response.json();
                setSensorData(data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 5000);

        return () => clearInterval(interval);
    }, []);

    const thresholds = {
        light: { low: 20, high: 80 },
        moisture: { low: 30, high: 70 },
        temperature: { low: 15, high: 30 }
    };

    const getRecommendations = (entry) => {
        const recommendations = [];
        if (entry.light < thresholds.light.low) recommendations.push("Move to a brighter area.");
        if (entry.light > thresholds.light.high) recommendations.push("Reduce exposure to direct light.");
        if (entry.moisture < thresholds.moisture.low) recommendations.push("Water the plant.");
        if (entry.moisture > thresholds.moisture.high) recommendations.push("Allow soil to dry out a bit.");
        if (entry.temperature < thresholds.temperature.low) recommendations.push("Move to a warmer location.");
        if (entry.temperature > thresholds.temperature.high) recommendations.push("Move to a cooler location.");
        return recommendations;
    };

    const filteredData = sensorData.filter(entry => entry.plant_id === selectedPlant);

    const createChartData = (key) => ({
        labels: filteredData.map(entry => new Date(entry.timestamp).toLocaleTimeString()),
        datasets: [{
            label: key.charAt(0).toUpperCase() + key.slice(1),
            data: filteredData.map(entry => entry[key]),
            fill: false,
            backgroundColor: key === 'light' ? '#8884d8' : key === 'moisture' ? '#82ca9d' : '#ffc658',
            borderColor: key === 'light' ? '#8884d8' : key === 'moisture' ? '#82ca9d' : '#ffc658',
            tension: 0.4
        }]
    });

    return (
        <div className="container my-5">
            <h1 className="text-center mb-4">🌱 Smart Garden Dashboard</h1>

            <ul className="nav nav-tabs justify-content-center mb-4">
                <li className="nav-item">
                    <button 
                        className={`nav-link ${activeTab === "Dashboard" ? "active" : ""}`} 
                        onClick={() => setActiveTab("Dashboard")}
                    >
                        Dashboard
                    </button>
                </li>
                <li className="nav-item">
                    <button 
                        className={`nav-link ${activeTab === "Graph" ? "active" : ""}`} 
                        onClick={() => setActiveTab("Graph")}
                    >
                        Graph
                    </button>
                </li>
            </ul>

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

                    <h3 className="text-center mb-4">{selectedPlant}</h3>
                    <div className="row">
                        {filteredData.length > 0 ? (
                            filteredData.map((entry, index) => (
                                <div key={index} className="col-12 col-md-6 col-lg-4 mb-3">
                                    <div className="card shadow-sm p-3">
                                        <p><strong>🌞 Light:</strong> {entry.light}</p>
                                        <p><strong>💧 Moisture:</strong> {entry.moisture}</p>
                                        <p><strong>🌡 Temperature:</strong> {entry.temperature} °C</p>
                                        <p className="text-muted">
                                            <small><strong>Timestamp:</strong> {new Date(entry.timestamp).toLocaleString()}</small>
                                        </p>
                                        <div>
                                            <strong>Recommendations:</strong>
                                            <ul>
                                                {getRecommendations(entry).length > 0 ? (
                                                    getRecommendations(entry).map((rec, i) => (
                                                        <li key={i}>{rec}</li>
                                                    ))
                                                ) : (
                                                    <li>All conditions are optimal.</li>
                                                )}
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

            {activeTab === "Graph" && (
                <div className="text-center">
                    <h3>Graphs for {selectedPlant}</h3>
                    <div className="row">
                        {/* Light Levels Chart */}
                        <div className="col-12 col-md-6 mb-4">
                            <h5>Light Levels</h5>
                            <Line data={createChartData('light')} />
                        </div>

                        {/* Moisture Levels Chart */}
                        <div className="col-12 col-md-6 mb-4">
                            <h5>Moisture Levels</h5>
                            <Line data={createChartData('moisture')} />
                        </div>

                        {/* Temperature Levels Chart */}
                        <div className="col-12 col-md-6 mb-4">
                            <h5>Temperature Levels</h5>
                            <Line data={createChartData('temperature')} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
