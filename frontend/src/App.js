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
