import Divider from "@material-ui/core/Divider";
import Drawer from "@material-ui/core/Drawer";
import HomeIcon from "@material-ui/icons/Home";
import EmojiPeopleIcon from "@material-ui/icons/EmojiPeople";
import OpacityIcon from "@material-ui/icons/Opacity";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import List from "@material-ui/core/List";
import Typography from "@material-ui/core/Typography";
import {
  useHistory
} from "react-router-dom";

const Sidebar = (props) => {
  const { classes, setPage } = props;
  const history = useHistory();

  return (
    <Drawer
      className={classes.drawer}
      variant="permanent"
      classes={{
        paper: classes.drawerPaper,
      }}
      anchor="left"
    >
      <div
        className={classes.logo}
        style={{
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: "1em",
          paddingBottom: "1em",
        }}
      >
        <img
          src={process.env.PUBLIC_URL + "/logo192.png"}
          style={{ height: "1.8em", marginRight: "0.7em" }}
        />
        <Typography variant="h5">Peekaboo</Typography>
      </div>
      <Divider />
      <List>
        <ListItem button key="Home" onClick={() => history.push("/")}>
          <ListItemIcon className={props.classes.drawerIcon}>
            <HomeIcon />
          </ListItemIcon>
          <ListItemText primary="Home" />
        </ListItem>
      </List>
      <Divider />
      <List>
        <ListItem
          button
          key="Hello Visitor"
          onClick={() => history.push("/hello_visitor")}
        >
          <ListItemIcon className={props.classes.drawerIcon}>
            <EmojiPeopleIcon />
          </ListItemIcon>
          <ListItemText primary="HelloVisitor" />
        </ListItem>
        <ListItem
          button
          key="Smart Irrigation"
          onClick={() => history.push("smart_irrigation")}
        >
          <ListItemIcon className={props.classes.drawerIcon}>
            <OpacityIcon />
          </ListItemIcon>
          <ListItemText primary="Smart Irrigation" />
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar;
