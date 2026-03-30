import streamlit as st
import data_manager

def show_journal():
    st.header('My Journal')

    # Fields for new journal entry
    with st.expander('+ New Journal Entry'):
        entry_title = st.text_input('Title', key=f'')
        entry_body = st.text_area('How do you feel today?', height=150, key=f'body_{entry_title}')
        entry_date = st.date_input('Date', key=f'date_{entry_title}')
        entry_time = st.time_input('Time', key=f'time_{entry_title}')

        # List of tags for journal entries
        trip_tags = ['No Trip'] + [trip['name'] for trip in st.session_state.trips]

        # Let user select a tag
        selected_trip = st.selectbox('Tag to Trip (Optional)', trip_tags)

        # If user clicks button, create a journal entry with the following information
        if st.button('Add to Journal'):
            journal = {
                'title': entry_title,
                'body': entry_body,
                'date': entry_date,
                'time': entry_time,
                'trip_tag': selected_trip if selected_trip != 'No Trip' else None
            }

            st.session_state.journal_entries.append(journal)

            st.success(f'Journal entry saved!')

            data_manager.save_data()

    if st.session_state.journal_entries:
        st.write(f"All Journal Entries ({len(st.session_state.journal_entries)}):")
    
        # Sort by date (newest first)
        sorted_entries = sorted(st.session_state.journal_entries, key=lambda x: x['date'], reverse=True)
    
        for entry in sorted_entries:

            # Create expander title with trip tag if it exists
            title = f"{entry['title']} - {entry['date']}"
            if entry.get('trip_tag'):
                title = f"{entry['trip_tag']} | {title} | {entry['time']}"
        
            with st.expander(title):
                if entry.get('trip_tag'):
                    st.write(f"Tagged to: {entry['trip_tag']}")
                st.divider()
                st.write(entry['body'])
    else:
        st.info('No journal entries yet. Create your first memory above!')