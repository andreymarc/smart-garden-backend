import React, { useEffect, useState } from 'react';

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
        const interval = setInterval(fetchData, 5000); // Fetch data every 5 seconds

        return () => clearInterval(interval); // Cleanup on component unmount
    }, []);

    return (
        <div className="App">
            <h1>Smart Garden Sensor Data</h1>
            <div>
                {sensorData.length > 0 ? (
                    sensorData.map((entry, index) => (
                        <div key={index}>
                            <p>Light: {entry.light}</p>
                            <p>Moisture: {entry.moisture}</p>
                            <p>Temperature: {entry.temperature} °C</p>
                            <p>Timestamp: {new Date(entry.timestamp).toLocaleString()}</p>
                            <hr />
                        </div>
                    ))
                ) : (
                    <p>Loading data...</p>
                )}
            </div>
        </div>
    );
}

export default App;
