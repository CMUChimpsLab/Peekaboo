export const setCity = (city) => {
  return {
    type: "SET_WEATHER_CITY",
    category: "weather",
    city
  }
}

export const setLatLon = (lat, lon) => {
  return {
    type: "SET_WEATHER_LAT_LON",
    category: "weather",
    lat,
    lon
  }
}

export const setHistorical = (data) => {
  return {
    type: "SET_WEATHER_HISTORICAL_DATA",
    category: "weather",
    data
  }
}

export const setForecast = (data) => {
  return {
    type: "SET_WEATHER_FORECAST",
    category: "weather",
    data
  }
}