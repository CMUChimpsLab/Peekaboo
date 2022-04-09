import {
  Button,
  Card,
  Container,
  Grid,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from "@material-ui/core";
import Icon from "@mdi/react";
import { mdiWeatherPouring, mdiWeatherSnowy } from "@mdi/js";
import axios from "axios";
import { useEffect, useState } from "react";
import { connect, useDispatch } from "react-redux";
import * as actions from "../actions";
import { DateTime } from "luxon";

const dateFormat = "ccc dd MMM yyyy";

const WeatherWidget = (props) => {
  const { weather } = props;
  const { city, lat, lon, forecast } = weather;
  const dispatch = useDispatch();
  const [textCity, setTextCity] = useState(city);

  useEffect(() => {
    axios
      .get("https://api.openweathermap.org/data/2.5/weather", {
        params: {
          q: city,
          appid: process.env.REACT_APP_WEATHER_API_KEY,
        },
      })
      .then((response) => {
        const { lat, lon } = response.data.coord;
        dispatch(actions.weather.setLatLon(lat, lon));
      })
      .catch((err) => {
        console.error("Failed to retrieve latitude+longitude data");
        console.error(err);
      });
  }, [city]);

  useEffect(() => {
    // Get forecast and current weather
    axios
      .get("https://api.openweathermap.org/data/2.5/onecall", {
        params: {
          lat,
          lon,
          appid: process.env.REACT_APP_WEATHER_API_KEY,
          exclude: "minutely,hourly,alerts",
        },
      })
      .then((response) => {
        const { daily } = response.data;
        const data = daily.map((entry) => {
          return {
            dt: entry.dt * 1000,
            snow: entry.snow ? entry.snow : 0,
            rain: entry.rain ? entry.rain : 0,
          };
        });
        dispatch(actions.weather.setForecast(data));
      })
      .catch((err) => {
        console.error("Failed to retrieve weather forecast");
        console.error(err);
      });
  }, [lat, lon]);

  return (
    <div style={{
      width: "80%",
      marginLeft: "auto",
      marginRight: "auto"
    }}>
      <Grid container justify="flex-end">
        <TextField
          id="cityInput"
          label="City"
          variant="outlined"
          value={textCity}
          onChange={(e) => setTextCity(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              dispatch(actions.weather.setCity(textCity));
            }
          }}
          style={{
            marginRight: "1em",
            padding: "0px",
          }}
        />
        <Button
          variant="contained"
          onClick={(e) => {
            dispatch(actions.weather.setCity(textCity));
          }}
        >
          Change
        </Button>
      </Grid>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell />
            {forecast.map((data) => {
              return (
                <TableCell key={data.dt}>
                  {DateTime.fromMillis(data.dt).toFormat(dateFormat)}
                </TableCell>
              );
            })}
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>
              <Icon path={mdiWeatherPouring} size={1} />
              <br />
              Rain (mm)
            </TableCell>
            {forecast.map((data) => {
              return (
                <TableCell key={data.dt}>{data.rain.toFixed(2)}</TableCell>
              );
            })}
          </TableRow>
          <TableRow>
            <TableCell>
              <Icon path={mdiWeatherSnowy} size={1} />
              <br />
              Snow (mm)
            </TableCell>
            {forecast.map((data) => {
              return (
                <TableCell key={data.dt}>{data.snow.toFixed(2)}</TableCell>
              );
            })}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

const mapStateToProps = (state) => {
  const { weather } = state;
  return { weather };
};

export default connect(mapStateToProps)(WeatherWidget);
