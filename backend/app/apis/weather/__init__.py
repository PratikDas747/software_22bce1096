from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import databutton as db
import requests

router = APIRouter()

class WeatherData(BaseModel):
    temperature: float
    humidity: float
    rainfall: float
    description: str
    icon: str
    location: str

class ForecastDay(BaseModel):
    day: str
    temp: float
    description: str
    icon: str

class WeatherResponse(BaseModel):
    current: WeatherData
    forecast: list[ForecastDay]

@router.get("/weather/current")
def get_weather(lat: float, lon: float) -> WeatherResponse:
    """
    Get current weather and 7-day forecast based on coordinates.
    """
    api_key = db.secrets.get("OPENWEATHER_API_KEY")
    
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenWeather API key not configured")
    
    # Get current weather
    current_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&units=metric&appid={api_key}"
    
    try:
        current_response = requests.get(current_url, timeout=10)
        current_response.raise_for_status()
        current_data = current_response.json()
    except requests.exceptions.HTTPError as e:
        print(f"HTTP Error fetching current weather: {e}")
        if e.response.status_code == 429:
            raise HTTPException(status_code=429, detail="Weather API rate limit exceeded. Please try again in a few minutes.")
        raise HTTPException(status_code=500, detail=f"Failed to fetch weather data: {str(e)}")
    except requests.exceptions.RequestException as e:
        print(f"Error fetching current weather: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch weather data")
    
    # Get 7-day forecast
    forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&units=metric&appid={api_key}"
    
    try:
        forecast_response = requests.get(forecast_url, timeout=10)
        forecast_response.raise_for_status()
        forecast_data = forecast_response.json()
    except requests.exceptions.HTTPError as e:
        print(f"HTTP Error fetching forecast: {e}")
        if e.response.status_code == 429:
            raise HTTPException(status_code=429, detail="Weather API rate limit exceeded. Please try again in a few minutes.")
        raise HTTPException(status_code=500, detail=f"Failed to fetch forecast data: {str(e)}")
    except requests.exceptions.RequestException as e:
        print(f"Error fetching forecast: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch forecast data")
    
    # Parse current weather
    current_weather = WeatherData(
        temperature=round(current_data["main"]["temp"], 1),
        humidity=current_data["main"]["humidity"],
        rainfall=current_data.get("rain", {}).get("1h", 0) or current_data.get("rain", {}).get("3h", 0) or 0,
        description=current_data["weather"][0]["description"].title(),
        icon=current_data["weather"][0]["icon"],
        location=current_data["name"]
    )
    
    # Parse forecast - get one per day (noon data)
    forecast_list = []
    days_seen = set()
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    
    for item in forecast_data["list"]:
        # Get date from timestamp
        from datetime import datetime
        dt = datetime.fromtimestamp(item["dt"])
        date_str = dt.strftime("%Y-%m-%d")
        
        # Only take noon forecasts (12:00) and max 7 days
        if date_str not in days_seen and len(forecast_list) < 7:
            days_seen.add(date_str)
            forecast_list.append(
                ForecastDay(
                    day=day_names[dt.weekday()],
                    temp=round(item["main"]["temp"], 1),
                    description=item["weather"][0]["description"].title(),
                    icon=item["weather"][0]["icon"]
                )
            )
    
    return WeatherResponse(
        current=current_weather,
        forecast=forecast_list
    )
