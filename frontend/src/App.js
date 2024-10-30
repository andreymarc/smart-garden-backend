import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
    const [sensorData, setSensorData] = useState([]);
    
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

    // Define thresholds for optimal conditions
    const thresholds = {
        light: { low: 20, high: 80 },
        moisture: { low: 30, high: 70 },
        temperature: { low: 15, high: 30 }
    };

    // Generate recommendations based on sensor data
    const getRecommendations = (entry) => {
        let recommendations = [];
        
        if (entry.light < thresholds.light.low) recommendations.push("Move to a brighter area");
        if (entry.light > thresholds.light.high) recommendations.push("Reduce exposure to direct light");
        
        if (entry.moisture < thresholds.moisture.low) recommendations.push("Water the plant");
        if (entry.moisture > thresholds.moisture.high) recommendations.push("Allow soil to dry out a bit");

        if (entry.temperature < thresholds.temperature.low) recommendations.push("Move to a warmer location");
        if (entry.temperature > thresholds.temperature.high) recommendations.push("Move to a cooler location");

        return recommendations;
    };

    // Group data by `plant_id`
    const groupedData = sensorData.reduce((acc, entry) => {
        if (!acc[entry.plant_id]) acc[entry.plant_id] = [];
        acc[entry.plant_id].push(entry);
        return acc;
    }, {});

    return (
        <div className="container my-5">
            <h1 className="text-center mb-4">🌱 Smart Garden Dashboard</h1>
            {["Plant 1", "Plant 2", "Plant 3"].map((plantId) => (
                <div key={plantId} className="mb-4">
                    <h3>{plantId}</h3>
                    <div className="row">
                        {groupedData[plantId] ? (
                            groupedData[plantId].map((entry, index) => (
                                <div key={index} className="col-md-4 mb-3">
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
                                                    <li>All conditions are optimal</li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>No data available for {plantId}</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default App;
