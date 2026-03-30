import streamlit as st
import data_manager

def show_itinerary(trip_name):
    st.subheader('Itinerary')
    
    # Find trip
    trip = {}
    for t in st.session_state.trips:
        if t['name'] == trip_name:
            trip = t
            break
    
    # Initialize itinerary list if it doesn't exist
    if 'itinerary' not in trip:
        trip['itinerary'] = []
    
    # Add activity form
    with st.expander('+ Add Activity'):
        
        # Similar to expenses: activity name, date, time, location, notes
        activity_name = st.text_input('Activity Name', key=f'name_{trip_name}')
        activity_date = st.date_input('Date', key=f'dates_{trip_name}')
        activity_time = st.time_input('Time', key=f'time_{trip_name}')
        activity_location = st.text_input('Location', key=f'location_{trip_name}')
        activity_notes = st.text_input('Notes', key=f'notes_{trip_name}')

        # Create activity dict and append to trip['itinerary']
        if st.button('Save Activity', key=f'button_{trip_name}'):
            activities = {
                'name': activity_name,
                'date': str(activity_date),
                'time': str(activity_time),
                'location': activity_location,
                'notes': activity_notes
            }
        
            # Save and rerun
            trip['itinerary'].append(activities)
            data_manager.save_data()
            st.success(f'Added: {activity_name} on {activity_date}, {activity_time} at {activity_location}')
            st.rerun()
    
    st.divider()

    # Display activities
    if trip['itinerary']:
        st.write('Planned Activities:')

        # Sort by date
        sorted_activities = sorted(trip['itinerary'], key=lambda x: (x['date'], x['time']))
        
        for activity in sorted_activities:
            with st.container():
                col1, col2 = st.columns([1, 3])
                with col1:
                    st.write(f"{activity['date']}")
                    st.write(f"{activity['time']}")
                with col2:
                    st.write(f"{activity['name']}")
                    st.write(f"{activity['location']}")
                    if activity['notes']:
                        st.write(f"{activity['notes']}")
                st.divider()
    else:
        st.info('No activities planned yet!')