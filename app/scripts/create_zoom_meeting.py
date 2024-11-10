import os
import requests
import json
from datetime import datetime, timedelta

# Read Zoom OAuth credentials from environment variables
ACCOUNT_ID = os.environ.get('ZOOM_ACCOUNT_ID')
CLIENT_ID = os.environ.get('ZOOM_CLIENT_ID')
CLIENT_SECRET = os.environ.get('ZOOM_CLIENT_SECRET')

# Check if all required environment variables are set
if not all([ACCOUNT_ID, CLIENT_ID, CLIENT_SECRET]):
    raise EnvironmentError("Missing required Zoom credentials in environment variables. "
                           "Please set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET.")

# Zoom API base URL
BASE_URL = 'https://api.zoom.us/v2'

def get_access_token():
    url = f"https://zoom.us/oauth/token?grant_type=account_credentials&account_id={ACCOUNT_ID}"
    response = requests.post(url, auth=(CLIENT_ID, CLIENT_SECRET))
    
    if response.status_code == 200:
        return response.json()['access_token']
    else:
        raise Exception(f"Failed to get access token: {response.text}")

def schedule_meeting(topic, start_time, duration):
    access_token = get_access_token()
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    data = {
        'topic': topic,
        'type': 2,  # Scheduled meeting
        'start_time': start_time,
        'duration': duration,
        'timezone': 'America/Los_Angeles',  # Adjust as needed
        'settings': {
            'host_video': True,
            'participant_video': True,
            'join_before_host': False,
            'mute_upon_entry': False,
            'watermark': False,
            'use_pmi': False,
            'approval_type': 0,
            'audio': 'both',
            'auto_recording': 'none'
        }
    }
    
    response = requests.post(f'{BASE_URL}/users/me/meetings', headers=headers, data=json.dumps(data))
    
    if response.status_code == 201:
        meeting = response.json()
        print(f"Meeting scheduled successfully!")
        print(f"Join URL: {meeting['join_url']}")
        print(f"Meeting ID: {meeting['id']}")
        print(f"Password: {meeting['password']}")
    else:
        print(f"Failed to schedule meeting. Status code: {response.status_code}")
        print(f"Response: {response.text}")

# Example usage
if __name__ == '__main__':
    topic = "My Scheduled Zoom Meeting"
    start_time = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%dT%H:%M:%S')
    duration = 60  # minutes

    schedule_meeting(topic, start_time, duration)