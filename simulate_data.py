import random
import time
import requests

def simulate_data(plant_id):
    light = random.randint(0, 100)
    moisture = random.randint(0, 100)
    temperature = round(random.uniform(15, 35), 2)
    return {"plant_id": plant_id, "light": light, "moisture": moisture, "temperature": temperature}

def send_data():
    url = "http://localhost:3000/api/sensors"  # Ensure this matches your backend port
    plant_ids = ["Plant 1", "Plant 2", "Plant 3"]  # Three plant identifiers
    while True:
        for plant_id in plant_ids:
            data = simulate_data(plant_id)
            try:
                response = requests.post(url, json=data)
                print("Sent data:", data, "Status:", response.status_code)
            except Exception as e:
                print("Error sending data:", e)
        time.sleep(10)

if __name__ == "__main__":
    send_data()
