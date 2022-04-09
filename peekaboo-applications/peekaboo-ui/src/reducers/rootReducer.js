const initState = {
  user: {},
  sensors: [],
  soilMoisture: [],
  weather: {
    city: "Pittsburgh",
    lat: 40.4406,
    lon: -79.9959,
    historical: [],
    forecast: [],
  },
};

const weatherReducer = (state, action) => {
  if (action.type === "SET_WEATHER_CITY") {
    return {
      ...state,
      weather: {
        ...state.weather,
        city: action.city,
      },
    };
  } else if (action.type === "SET_WEATHER_LAT_LON") {
    const { lat, lon } = action;
    return {
      ...state,
      weather: {
        ...state.weather,
        lat,
        lon,
      },
    };
  } else if (action.type === "SET_WEATHER_HISTORICAL") {
    return {
      ...state,
      weather: {
        ...state.weather,
        historical: action.data,
      },
    };
  } else if (action.type === "SET_WEATHER_FORECAST") {
    return {
      ...state,
      weather: {
        ...state.weather,
        forecast: action.data,
      },
    };
  }
};

const soilMoistureReducer = (state, action) => {
  if (action.type === "SET_SOIL_MOISTURE") {
    return {
      ...state,
      soilMoisture: action.soilMoisture,
    };
  } else if (action.type === "SET_SENSORS") {
    return {
      ...state,
      sensors: action.sensors,
    };
  }
};

const authReducer = (state, action) => {
  if (action.type === "AUTH_LOGOUT") {
    window.localStorage.setItem("accessToken", null);
    return {
      ...state,
      user: {},
    };
  } else if (action.type === "SET_USER") {
    if (action.user != null) {
      if (action.token != null) {
        window.localStorage.setItem("accessToken", action.token);
      }
      return {
        ...state,
        user: {
          ...action.user,
          token:
            action.token == null
              ? window.localStorage.getItem("accessToken")
              : action.token,
        },
      };
    } else {
      return state;
    }
  }
};

const rootReducer = (state = initState, action) => {
  const reducerMap = {
    weather: weatherReducer,
    soilMoisture: soilMoistureReducer,
    auth: authReducer,
  };
  if (reducerMap[action.category] != null) {
    state = reducerMap[action.category](state, action);
  }
  return state;
};

export default rootReducer;
