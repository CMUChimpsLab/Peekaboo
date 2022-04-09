import {
  Card,
  CardContent,
  FormControl,
  MenuItem,
  Select,
  Typography,
} from "@material-ui/core";
import { useEffect, useState } from "react";
import { useSelector, useDispatch, connect } from "react-redux";
import * as actions from "../actions";
import ApexChart from "./ApexChart";
import WeatherWidget from "./WeatherWidget";
import axios from "axios";
import { DateTime } from "luxon";

const DATA_URL = process.env.REACT_APP_BACKEND_URL + "/api/data";
const SENSORS_URL = process.env.REACT_APP_BACKEND_URL + "/api/sensors";

const SmartIrrigation = (props) => {
  const dispatch = useDispatch();
  const { soilMoisture } = props;
  const sensors = useSelector((store) => store.sensors);
  const token = useSelector((store) => store.user.token);
  const [selectedSensor, setSelectedSensor] = useState(null);

  if (sensors.length > 0 && selectedSensor == null) {
    setSelectedSensor(sensors[0]._id);
  }


  const updateSensors = async () => {
    try {
      const response = await axios.get(SENSORS_URL + "/all", {
        headers: {
          "x-access-token": token,
        },
      });
      const newSensors = response.data;
      dispatch(actions.soilMoisture.setSensors(newSensors));
    } catch (err) {
      console.error(err);
    }
  };

  const getData = async () => {
    try {
      const response = await axios.get(DATA_URL + "/" + selectedSensor, {
        headers: {
          "x-access-token": token,
        },
      });
      const moistureData = response.data.map((entry) => {
        return {
          x: DateTime.fromISO(entry.created_at).toMillis(),
          y: entry.moisture,
        };
      });
      dispatch(actions.soilMoisture.setSoilMoisture(moistureData));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    updateSensors();
  }, []);

  useEffect(() => {
    getData();
  }, [selectedSensor]);

  return (
    <div>
      <Card>
        <CardContent>
          <Typography variant="h5">Soil Moisture</Typography>
          <FormControl
            variant="outlined"
            style={{ float: "left", zIndex: 100 }}
          >
            <Select
              value={selectedSensor}
              onChange={(e) => setSelectedSensor(e.target.value)}
            >
              {sensors.map((sensor) => (
                <MenuItem value={sensor._id}>{sensor.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <ApexChart name="Soil Moisture" data={soilMoisture} />
        </CardContent>
      </Card>
      <Card style={{ marginTop: "2em", marginBottom: "2em" }}>
        <CardContent>
          <WeatherWidget />
        </CardContent>
      </Card>
    </div>
  );
};

const mapStateToProps = (state) => {
  const { soilMoisture } = state;
  return { soilMoisture };
};

export default connect(mapStateToProps)(SmartIrrigation);
