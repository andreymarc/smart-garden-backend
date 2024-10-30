import random
import time
import requests

def simulate_data():
    light = random.randint(0, 100)         # Simulated brightness
    moisture = random.randint(0, 100)      # Simulated soil moisture
    temperature = round(random.uniform(15, 35), 2)  # Simulated temperature
    return {"light": light, "moisture": moisture, "temperature": temperature}

def send_data():
    url = "http://localhost:3000/api/sensors"  # Update this with your API endpoint
    while True:
        data = simulate_data()
        try:
            response = requests.post(url, json=data)
            print("Sent data:", data, "Status:", response.status_code)
        except Exception as e:
            print("Error sending data:", e)
        time.sleep(5)  # Send data every 5 seconds

# Run the simulation
if __name__ == "__main__":
    send_data()
