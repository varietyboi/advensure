import streamlit as st
import data_manager

def show_budget(trip_name):
    st.subheader('Budget Tracker')

    # Identify the Trip
    trip = {}
    for t in st.session_state.trips:
        if t['name'] == trip_name:
            trip = t
            break
    
    # Initialize expenses list if it doesn't exist
    if 'expenses' not in trip:
        trip['expenses'] = []

    # Check if trip has max_budget set
    if ('max_budget' not in trip) or (trip['max_budget'] is None):
        
        st.info('Set your max budget for this trip')
        max_budget = st.number_input('Max Budget', min_value=0.0, step=100.0, key=f'budget_{trip_name}')
        if st.button('Set Budget', key = f'set_budget_{trip_name}'):
            
            # Save max_budget to trip
            trip['max_budget'] = max_budget
            
            # Save data
            data_manager.save_data()
            
            # Success message and rerun
            st.success('Max Budget Set!')
            st.rerun()
    else:
            
        # Budget is set, show it with option to update
        col1, col2 = st.columns([3, 1])
        
        with col1:
            st.metric('Max Budget', f'${trip["max_budget"]:.2f}')
        
        with col2:
            if st.button('Update', key=f'update_budget_{trip_name}'):
                
                # Set max_budget to None to show form again
                trip['max_budget'] = None

                # Save and rerun
                data_manager.save_data()
                st.rerun()

    st.divider()

    # Add Expense Form
    with st.expander('+ Add Expense'):

        # item, amount, category, date
        expense_item = st.text_input('What Did You Spend On?', key=f'item_{trip_name}')
        expense_amount = st.number_input('Amount Spent:', min_value=0.0, step=0.01, key=f'amount_{trip_name}')
        expense_category = st.selectbox('Category', ['Food', 'Transport', 'Accommodation', 'Activities', 'Shopping', 'Other'], key=f'category_{trip_name}')
        expense_date = st.date_input('Date', key=f'date_{trip_name}')

        # Button to add
        if st.button('Add Expense', key=f'add_exp_{trip_name}'):
            expenses = {
                'item': expense_item,
                'amount': expense_amount,
                'category': expense_category,
                'date': str(expense_date)
            }

            trip['expenses'].append(expenses)
            data_manager.save_data()
            st.success(f'Added: {expense_item} - ${expense_amount:.2f}')
            st.rerun()

    st.divider()

    # Display Expenses and Totals
    if trip['expenses']:
        # Calculate total
        total_spent = sum(exp['amount'] for exp in trip['expenses'])
        
        # Show metrics
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric('Total Spent', f'${total_spent:.2f}')
        with col2:
            if 'max_budget' in trip and trip['max_budget']:
                remaining = trip['max_budget'] - total_spent
                st.metric('Remaining', f'${remaining:.2f}', 
                         delta=f'${remaining:.2f}',
                         delta_color='normal' if remaining >= 0 else 'inverse')
        with col3:
            if 'max_budget' in trip and trip['max_budget']:
                percentage = (total_spent / trip['max_budget']) * 100
                st.metric('Budget Used', f'{percentage:.1f}%')
        
        st.divider()
        st.write('**Expense History:**')
        
        # Show each expense
        for i, exp in enumerate(trip['expenses']):
            col1, col2, col3, col4 = st.columns([2, 2, 2, 1])
            with col1:
                st.write(f"{exp['date']}")
            with col2:
                st.write(f"**{exp['item']}**")
            with col3:
                st.write(f"_{exp['category']}_")
            with col4:
                st.write(f"${exp['amount']:.2f}")
    else:
        st.info('No expenses yet. Add your first expense above!')

        

