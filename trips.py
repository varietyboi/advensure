import streamlit as st
import data_manager
from budget import show_budget
from itinerary import show_itinerary

def show_trips():
    st.header('My Trips')

    # New Trip form
    with st.expander('+ Add New Trip'):
        trip_name = st.text_input('Trip Name', key=f'')
        trip_destination = st.text_input('Destination', key=f'destination_{trip_name}')
        trip_start_date = st.date_input('Date of Departure', key=f'start_date_{trip_name}')
        trip_end_date = st.date_input('Date of Returning', key=f'end_date_{trip_name}')
        
        # Add to trip dict variable when user clicks Create Trip
        if st.button('Create Trip'):
            trip = {
                'name': trip_name,
                'destination': trip_destination,
                'start_date': trip_start_date,
                'end_date': trip_end_date
            }

            # Append to Session State
            st.session_state.trips.append(trip)

            # Success Message
            st.success(f'{trip_name} has begun!')

            # Save to data_manajer.json file
            data_manager.save_data()

    # Display existing trips
    if st.session_state.trips:
        for trip in st.session_state.trips:
            st.subheader(f"{trip['name']}")
            st.write(f"{trip['destination']}")
            st.write(f"{trip['start_date']} → {trip['end_date']}")
        
            # Create tabs for Journal, Budget, Itinerary
            tab1, tab2, tab3 = st.tabs(['Journal', 'Budget', 'Itinerary'])
        
            with tab1:
                # Show journal entries for this trip
                trip_journals = [j for j in st.session_state.journal_entries if j.get('trip_tag') == trip['name']]
            
                if trip_journals:
                    st.write(f"Journal Entries ({len(trip_journals)}): ")
                    for entry in trip_journals:
                        with st.expander(f"{entry['title']} | {entry['date']}"):
                            st.write(f"{entry['time']}")
                            st.write(entry['body'])
                else:
                    st.info('No journal entries tagged to this trip yet.')
        
            with tab2:
                from budget import show_budget
                show_budget(trip['name'])
        
            with tab3:
                from itinerary import show_itinerary
                show_itinerary(trip['name'])
            
            # Separator between trips
            st.divider() 
    
    else:
        # If no trips exist yet, show the message below
        st.info('No trips yet. Create your first adventure above!')


