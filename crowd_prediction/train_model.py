import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import joblib
from sklearn.ensemble import RandomForestRegressor
import os

def generate_synthetic_data(num_days=1000):
    start_date = datetime(2023, 1, 1)
    data = []
    
    for i in range(num_days):
        current_date = start_date + timedelta(days=i)
        day_of_week = current_date.weekday()
        month = current_date.month
        
        # Festival logic (simplified Ekadashi simulation)
        # Ekadashi usually occurs twice a month. For synthesis, we'll pick fixed days.
        is_ekadashi = 1 if current_date.day in [11, 26] else 0
        
        # Holiday logic (Weekends + some random holidays)
        is_holiday = 1 if day_of_week >= 5 or current_date.day in [1, 15, 26] else 0
        
        # Weather simulation
        weather_options = ['Sunny', 'Cloudy', 'Rain']
        # Seasonality: rainy season roughly July-Sept
        if month in [7, 8, 9]:
            weather = np.random.choice(weather_options, p=[0.2, 0.3, 0.5])
        else:
            weather = np.random.choice(weather_options, p=[0.7, 0.2, 0.1])
            
        weather_encoded = {'Sunny': 0, 'Cloudy': 1, 'Rain': 2}[weather]
        
        # Devotee count logic
        base_devotees = 3000
        if day_of_week == 6: # Sunday
            base_devotees += 5000
        elif day_of_week == 5: # Saturday
            base_devotees += 3000
            
        if is_ekadashi:
            base_devotees += 15000
        
        if is_holiday:
            base_devotees += 4000
            
        # Weather impact
        if weather == 'Rain':
            base_devotees -= 2000
            
        # Add some randomness
        devotees = int(base_devotees + np.random.normal(0, 500))
        devotees = max(500, devotees) # Minimum 500 devotees
        
        data.append({
            'date': current_date.strftime('%Y-%m-%d'),
            'day': day_of_week,
            'month': month,
            'festival': is_ekadashi,
            'holiday': is_holiday,
            'weather': weather_encoded,
            'devotees': devotees
        })
        
    return pd.DataFrame(data)

def train_model():
    df = generate_synthetic_data()
    
    X = df[['day', 'month', 'festival', 'holiday', 'weather']]
    y = df['devotees']
    
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    # Ensure directory exists
    model_dir = os.path.join(os.getcwd(), 'crowd_prediction', 'ml_models')
    os.makedirs(model_dir, exist_ok=True)
    
    model_path = os.path.join(model_dir, 'crowd_model.joblib')
    joblib.dump(model, model_path)
    print(f"Model trained and saved to {model_path}")

if __name__ == "__main__":
    train_model()
