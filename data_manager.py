import json
import os
import streamlit as st

def save_data():
    
    # Create a dictionary with all data
    data = {
        'trips': st.session_state.trips,
        'journal_entries': st.session_state.journal_entries
    }

    # Convert dates to strings since dates can't be saved in JSON directly
    # Loop through trips and convert start_date and end_date to strings
    for trip in data['trips']:
        trip['start_date'] = str(trip['start_date'])
        trip['end_date'] = str(trip['end_date'])
    
    # Loop through journal_entries and convert date and time to strings
    for entry in data['journal_entries']:
        entry['date'] = str(entry['date'])
        entry['time'] = str(entry['time'])

    # Create data folder if it doesn't exist
    os.makedirs('data', exist_ok = True)
    
    # Write to JSON file
    with open('data/app_data.json', 'w') as f:
        json.dump(data, f) 

def load_data():
    # Open app_data file and read data
    try:
        with open('data/app_data.json', 'r') as f:
            return json.load(f)
    # create empty trips and journal_entries lists if file not found
    except FileNotFoundError: 
        return {'trips': [], 'journal_entries': []}
