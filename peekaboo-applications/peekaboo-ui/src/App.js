import "./App.css";
import React, { useRef, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { makeStyles } from "@material-ui/core/styles";
import {
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Grid,
  IconButton,
  MenuItem,
  Popper,
  Grow,
  Paper,
  ClickAwayListener,
  MenuList,
} from "@material-ui/core";
import { MuiThemeProvider, createMuiTheme } from "@material-ui/core/styles";
import { blueGrey, grey, blue } from "@material-ui/core/colors";
import { AccountCircle } from "@material-ui/icons";
import * as actions from "./actions";
import SmartIrrigation from "./components/SmartIrrigation";
import Sidebar from "./components/Sidebar";
import Home from "./components/Home";
import Settings from "./components/Settings";
import HelloVisitor from "./components/HelloVisitor";
import Login from "./components/Login";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useLocation,
  useHistory,
} from "react-router-dom";
import axios from "axios";

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
  },
  appBar: {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: drawerWidth,
    background: "transparent",
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    border: 0,
    backgroundColor: blueGrey[700],
    color: "#fff",
    width: drawerWidth,
  },
  drawerIcon: {
    color: blueGrey[200],
  },
  toolbar: theme.mixins.toolbar,
  content: {
    marginLeft: drawerWidth,
    flexGrow: 1,
    backgroundColor: grey[100],
    padding: theme.spacing(5),
  },
}));

const theme = createMuiTheme({
  palette: {
    primary: {
      main: blue[600],
    },
  },
});

// Log user in with cached access token
const validateToken = async (dispatch) => {
  const accessToken = window.localStorage.getItem("accessToken");
  if (accessToken != null) {
    try {
      const response = await axios.post(
        process.env.REACT_APP_BACKEND_URL + "/auth/login",
        {
          token: accessToken,
        }
      );
      const { user } = response.data;
      if (user != null) {
        dispatch(actions.auth.setUser(user, null));
      }
    } catch (err) {
      console.error(err);
    }
  }
};

const App = () => {
  const classes = useStyles();
  const [menuOpen, setMenuOpen] = useState(false);
  const user = useSelector((store) => store.user);
  const menuAnchor = useRef(null);
  const history = useHistory();
  const dispatch = useDispatch();

  // Convert path string to page title in Title Case
  const location = useLocation().pathname;
  let pageTitle = location
    .substr(1)
    .replace("_", " ")
    .replace(/\w\S*/g, (str) => str.charAt(0).toUpperCase() + str.substr(1));

  useEffect(() => {
    if (user.name == null) {
      validateToken(dispatch);
    }
  }, []);

  return (
    <div className="App">
      <CssBaseline />
      <MuiThemeProvider theme={theme}>
        <AppBar elevation={0} position="fixed" className={classes.appBar}>
          <Toolbar>
            <Grid justify="space-between" alignItems="center" container>
              <Grid item>
                <Typography variant="h4" style={{ color: "black" }}>
                  {pageTitle}
                </Typography>
              </Grid>
              <Grid item>
                <IconButton ref={menuAnchor} onClick={() => setMenuOpen(true)}>
                  <AccountCircle fontSize="large" />
                </IconButton>
              </Grid>
            </Grid>
            <Popper
              open={menuOpen}
              anchorEl={menuAnchor.current}
              role={undefined}
              transition
              disablePortal
            >
              {({ TransitionProps, placement }) => (
                <Grow
                  {...TransitionProps}
                  style={{
                    transformOrigin:
                      placement === "bottom" ? "center top" : "center bottom",
                  }}
                >
                  <Paper>
                    <ClickAwayListener onClickAway={() => setMenuOpen(false)}>
                      <MenuList autoFocusItem={menuOpen} id="menu-list-grow">
                        {user.name ? (
                          <MenuItem
                            onClick={() => {
                              setMenuOpen(false);
                              history.push("/settings");
                            }}
                          >
                            Account Settings
                          </MenuItem>
                        ) : (
                          <MenuItem
                            onClick={() => {
                              setMenuOpen(false);
                              history.push("/login");
                            }}
                          >
                            Login
                          </MenuItem>
                        )}
                        {user.name ? (
                          <MenuItem
                            onClick={() => {
                              setMenuOpen(false);
                              dispatch(actions.auth.logout());
                              history.push("/home");
                            }}
                          >
                            Log Out
                          </MenuItem>
                        ) : null}
                      </MenuList>
                    </ClickAwayListener>
                  </Paper>
                </Grow>
              )}
            </Popper>
          </Toolbar>
        </AppBar>
        <Sidebar classes={classes} />
        <main className={classes.content}>
          <div className={classes.toolbar} />
          <Switch>
            <Route path="/hello_visitor">
              <HelloVisitor />
            </Route>
            <Route path="/smart_irrigation">
              <SmartIrrigation />
            </Route>
            <Route path="/settings">
              <Settings />
            </Route>
            <Route path="/login">
              <Login />
            </Route>
            <Route path="/register">
              <Login register />
            </Route>
            <Route path="/">
              <Home />
            </Route>
          </Switch>
        </main>
      </MuiThemeProvider>
      <Switch>
        <Route path="/home">Hello</Route>
      </Switch>
    </div>
  );
};

export default App;
