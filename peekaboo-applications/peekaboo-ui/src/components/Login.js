import {
  Button,
  Card,
  CardContent,
  Grid,
  Link,
  TextField,
  Typography,
} from "@material-ui/core";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import axios from "axios";
import * as actions from "../actions";

const AUTH_URL = process.env.REACT_APP_BACKEND_URL + "/auth";

const Login = (props) => {
  const { register } = props;
  const dispatch = useDispatch();
  const history = useHistory();
  const [nameText, setNameText] = useState("");
  const [emailText, setEmailText] = useState("");
  const [passwordText, setPasswordText] = useState("");

  const submitForm = async (register) => {
    let data;
    if (register) {
      try {
        const response = await axios.post(AUTH_URL + "/register", {
          name: nameText,
          email: emailText,
          password: passwordText,
        });
        data = response.data;
      } catch (err) {
        console.error("Failed to register");
        console.error(err);
        return;
      }
    } else {
      try {
        const response = await axios.post(AUTH_URL + "/login", {
          email: emailText,
          password: passwordText,
        });
        data = response.data;
      } catch (err) {
        console.error("Failed to login");
        console.error(err);
        return;
      }
    }
    const { user, token } = data;
    await dispatch(actions.auth.setUser(user, token));
    history.push("/");
  };

  const keyHandler = (e) => {
    if (e.key === "Enter") {
      submitForm(register);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs></Grid>
      <Grid item xs={4}>
        <Card>
          <CardContent>
            <Grid container direction="column" spacing={3}>
              <Grid item>
                <Typography variant="h5">Peekaboo UI</Typography>
              </Grid>
              {/* Show name field only if registering */}
              {register ? (
                <Grid item>
                  <TextField
                    label="Name"
                    value={nameText}
                    onKeyDown={keyHandler}
                    onChange={(e) => setNameText(e.target.value)}
                  />
                </Grid>
              ) : null}
              <Grid item>
                <TextField
                  label="Email"
                  value={emailText}
                  onKeyDown={keyHandler}
                  onChange={(e) => setEmailText(e.target.value)}
                />
              </Grid>
              <Grid item>
                <TextField
                  label="Password"
                  type="password"
                  value={passwordText}
                  onKeyDown={keyHandler}
                  onChange={(e) => setPasswordText(e.target.value)}
                />
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  onClick={() => submitForm(register)}
                >
                  {register ? "Register" : "Login"}
                </Button>
              </Grid>
              <Grid item>
                {register ? (
                  <Link href="/login">Already have an account? Login</Link>
                ) : (
                  <Link href="/register">Don't have an account? Register</Link>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs></Grid>
    </Grid>
  );
};

export default Login;
