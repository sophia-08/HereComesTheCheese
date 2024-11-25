import requests
import os

access_token = os.environ.get('SAMSUNG_TOKEN')
device_id="eeaa40d8-ff66-486a-b12b-5a8b69299ddc"

url = f"https://api.smartthings.com/v1/devices/{device_id}/commands"
headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json"
}

data = {
    "commands": [
        {
            "component": "main",
            "capability": "switch",
            "command": "on"
        }
    ]
}

response = requests.post(url, json=data, headers=headers)

if response.status_code == 200:
    print("Light turned on successfully")
else:
    print(f"Error: {response.status_code}")
