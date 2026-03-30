"""
AdvenSure - Travel Journal & Planner

This module handles:
- Session state management
- Navigation between different pages
- Home page display with statistics
"""

# Import streamlit and files to run different pages and load data
import streamlit as st
from trips import show_trips
from journal import show_journal
import data_manager

st.set_page_config(page_title = 'AdvenSure - Your Ultimate Travel Journal & Planner', layout = 'wide')

# Display AdvenSure banner
st.image('assets/banner.png', width=3000)

# Initialise trips and journal entries if there is no existing data
if 'trips' not in st.session_state: 
    saved_data = data_manager.load_data()
    st.session_state.trips = saved_data['trips']

if 'journal_entries' not in st.session_state:
    saved_data = data_manager.load_data()
    st.session_state.journal_entries = saved_data['journal_entries']

# Set up pages in the Navigation sidebar
pages = st.sidebar.radio('Navigation', ['Home', 'My Journal', 'Trips'])

# Home Page view
if pages == 'Home':
    st.header('Welcome!')
    st.subheader('How are you doing today?')
    st.write('AdvenSure is your travel companion for journaling, planning, and budgeting your adventures!')
    
    # Show stats
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric('Total Trips', len(st.session_state.trips))
    with col2:
        st.metric('Journal Entries', len(st.session_state.journal_entries))
    with col3:
        total_activities = sum(len(trip.get('itinerary', [])) for trip in st.session_state.trips)
        st.metric('Activities Planned', total_activities)
    
    st.divider()
    
    st.subheader('How to Use AdvenSure:')
    st.write('1. Create a Trip - Go to Trips page and add your adventure details')
    st.write('2. Journal Your Experiences - Visit My Journal to write entries and tag them to trips')
    st.write('3. Track Your Budget - Set budgets and log expenses for each trip')
    st.write('4. Plan Activities - Build your itinerary with dates, times, and locations')
    
    st.info('💡 Tip: All your data is automatically saved!')

# My Journal page view
elif pages == 'My Journal':
    show_journal()

# Trips page view
elif pages == 'Trips':
    show_trips()