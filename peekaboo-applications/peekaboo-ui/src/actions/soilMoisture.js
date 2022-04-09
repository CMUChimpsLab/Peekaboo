export const setSoilMoisture = (soilMoisture) => {
  return {
    type: "SET_SOIL_MOISTURE",
    category: "soilMoisture",
    soilMoisture
  }
}

export const setSensors = (sensors) => {
  return {
    type: "SET_SENSORS",
    category: "soilMoisture",
    sensors
  }
}