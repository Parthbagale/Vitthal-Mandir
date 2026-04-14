from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
import joblib
import os
from datetime import datetime
import numpy as np

class CrowdPredictionView(APIView):
    permission_classes = [AllowAny]
    
    EKADASHI_DATES = {
        # 2026 Dates
        (2026, 3, 15): "Papamochani Ekadashi",
        (2026, 3, 29): "Kamada Ekadashi",
        (2026, 4, 13): "Varuthini Ekadashi",
        (2026, 4, 27): "Mohini Ekadashi",
        (2026, 5, 13): "Apara Ekadashi",
        (2026, 5, 27): "Padmini Ekadashi",
        (2026, 6, 11): "Parama Ekadashi",
        (2026, 6, 25): "Nirjala Ekadashi",
        (2026, 7, 10): "Yogini / Vaishnava Yogini Ekadashi",
        (2026, 7, 25): "Devshayani / Shayani Ekadashi (Ashadi Ekadashi)",
        (2026, 8, 9): "Kamika Ekadashi",
        (2026, 8, 23): "Shravana Putrada Ekadashi",
        (2026, 9, 6): "Aja Ekadashi",
        (2026, 9, 21): "Parsva Ekadashi",
        (2026, 10, 6): "Indira Ekadashi",
        (2026, 10, 21): "Papankusha Ekadashi",
        (2026, 11, 5): "Rama Ekadashi (Prabodhini begins)",
        (2026, 11, 20): "Utthana / Prabodhini Ekadashi (Kartiki Ekadashi period)",
        (2026, 12, 4): "Pashankusha Ekadashi",
        (2026, 12, 20): "Mokshada / Vaikuntha Ekadashi",
        
        # 2027 Dates (User Provided)
        (2027, 1, 3): "Saphala Ekadashi",
        (2027, 1, 18): "Pausha Putrada Ekadashi",
        (2027, 2, 1): "Shattila Ekadashi",
        (2027, 2, 17): "Jaya Ekadashi",
        (2027, 3, 3): "Vijaya Ekadashi",
        (2027, 3, 18): "Amalaki Ekadashi",
        (2027, 4, 2): "Papmochani Ekadashi",
        (2027, 4, 16): "Kamada Ekadashi",
        (2027, 5, 2): "Varuthini Ekadashi",
        (2027, 5, 16): "Mohini Ekadashi",
        (2027, 6, 1): "Apara Ekadashi",
        (2027, 6, 14): "Nirjala Ekadashi",
        (2027, 6, 30): "Yogini Ekadashi",
        (2027, 7, 14): "Devshayani (Ashadhi) Ekadashi",
        (2027, 7, 29): "Kamika Ekadashi",
        (2027, 8, 12): "Putrada Ekadashi",
        (2027, 8, 28): "Aja Ekadashi",
        (2027, 9, 11): "Parivartini (Parsva) Ekadashi",
        (2027, 9, 26): "Indira Ekadashi",
        (2027, 10, 11): "Papankusha Ekadashi",
        (2027, 10, 25): "Rama Ekadashi",
        (2027, 11, 9): "Devutthana (Kartiki) Ekadashi",
        (2027, 11, 23): "Utpanna Ekadashi",
        (2027, 12, 9): "Mokshada Ekadashi",
        (2027, 12, 23): "Saphala Ekadashi"
    }
    
    def get_ekadashi_info(self, target_date):
        """Returns (is_ekadashi, festival_name) for a given date."""
        key = (target_date.year, target_date.month, target_date.day)
        if key in self.EKADASHI_DATES:
            return 1, self.EKADASHI_DATES[key]
        return 0, None

    def get(self, request):
        date_str = request.query_params.get('date')
        if not date_str:
            return Response({"error": "Date parameter is required (YYYY-MM-DD)"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d')
        except ValueError:
            return Response({"error": "Invalid date format. Use YYYY-MM-DD"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Feature extraction
        day_of_week = target_date.weekday()
        month = target_date.month
        
        # Enhanced Ekadashi logic
        is_ekadashi, festival_name = self.get_ekadashi_info(target_date)
        
        # Holiday logic (Weekends + some fixed holidays)
        is_holiday = 1 if day_of_week >= 5 or target_date.day in [1, 15, 26] else 0
        
        # Weather simulation (Default Sunny for prediction)
        weather_encoded = 0
        
        # Load model
        model_path = os.path.join(os.getcwd(), 'crowd_prediction', 'ml_models', 'crowd_model.joblib')
        if not os.path.exists(model_path):
            return Response({"error": "Model not found. Technical issue."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        model = joblib.load(model_path)
        
        # Predict
        features = [[day_of_week, month, is_ekadashi, is_holiday, weather_encoded]]
        predicted_devotees = int(model.predict(features)[0])
        
        # Crowd level logic
        if predicted_devotees <= 5000:
            crowd_level = "Low"
        elif predicted_devotees <= 15000:
            crowd_level = "Medium"
        else:
            crowd_level = "High"
            
        # Peak time and best time logic (Rule based)
        peak_time = "9 AM - 12 PM"
        best_time = "3 PM - 5 PM"
        if is_ekadashi or day_of_week == 6:
            peak_time = "8 AM - 2 PM"
            best_time = "6 PM - 10 PM"
            
        # Hourly prediction simulation
        hours = list(range(4, 23)) # 4 AM to 10 PM
        hourly_data = []
        for h in hours:
            # Bell curve centered around peak time
            peak_hour = 11 if not (is_ekadashi or day_of_week == 6) else 10
            dist = np.exp(-((h - peak_hour)**2) / (2 * 4**2))
            count = int(predicted_devotees * dist * 0.15)
            hourly_data.append({"hour": f"{h}:00", "count": count})

        return Response({
            "date": date_str,
            "is_ekadashi": bool(is_ekadashi),
            "festival_name": festival_name,
            "predicted_devotees": predicted_devotees,
            "crowd_level": crowd_level,
            "peak_time": peak_time,
            "best_time_for_darshan": best_time,
            "hourly_predictions": hourly_data
        })

class EkadashiDatesView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        iso_dates = {}
        for (y, m, d), name in CrowdPredictionView.EKADASHI_DATES.items():
            date_str = f"{y}-{m:02d}-{d:02d}"
            iso_dates[date_str] = name
        return Response({"ekadashi_dates": iso_dates})
