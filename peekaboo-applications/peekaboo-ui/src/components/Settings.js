import {
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  Divider,
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Tooltip,
} from "@material-ui/core";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";
import axios from "axios";
import * as actions from "../actions";
import { FileCopy } from "@material-ui/icons";
import copy from "copy-to-clipboard";

const SENSORS_URL = process.env.REACT_APP_BACKEND_URL + "/api/sensors";

const Settings = (props) => {
  const history = useHistory();
  const dispatch = useDispatch();
  const name = useSelector((store) => store.user.name);
  const token = useSelector((store) => store.user.token);

  if (name == null) {
    history.push("/");
  }
  const [nameText, setNameText] = useState(name);
  const [sensorText, setSensorText] = useState("");

  const sensors = useSelector((store) => store.sensors);
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
  const createSensor = async () => {
    try {
      const response = await axios.post(
        SENSORS_URL + "/create",
        {
          name: sensorText,
        },
        {
          headers: {
            "x-access-token": token,
          },
        }
      );
      updateSensors();
    } catch (err) {
      console.error(err);
    }
  };

  const sensorComponents = sensors.map((sensor) => (
    <TableRow key={sensor.name}>
      <TableCell>
        <Typography>{sensor.name}</Typography>
      </TableCell>
      <TableCell>
        <Box component="div">{sensor.key}</Box>
      </TableCell>
      <TableCell>
        <Tooltip title="Copy">
          <IconButton
            onClick={() => {
              copy(sensor.key);
            }}
          >
            <FileCopy />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  ));

  useEffect(() => {
    updateSensors();
  }, []);

  return (
    <Grid container spacing={3}>
      <Grid item xs>
        <Card>
          <CardContent>
            <Typography
              variant="h5"
              style={{
                paddingBottom: "2em",
              }}
            >
              Account Settings
            </Typography>
            <Grid container direction="column">
              <Grid item>
                <TextField
                  label="Name"
                  value={nameText}
                  onChange={(e) => setNameText(e.target.value)}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs>
        <Card>
          <CardContent>
            <Typography
              variant="h5"
              style={{
                paddingBottom: "2em",
              }}
            >
              Sensors
            </Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>API Key</TableCell>
                  <TableCell>Copy</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>{sensorComponents}</TableBody>
            </Table>
            <Grid container justify="center" style={{ marginTop: "2em" }}>
              <Grid item>
                <TextField
                  label="Sensor Name"
                  value={sensorText}
                  onChange={(e) => setSensorText(e.target.value)}
                />
              </Grid>
              <Grid item>
                <Button variant="contained" onClick={createSensor}>
                  Create
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default Settings;
