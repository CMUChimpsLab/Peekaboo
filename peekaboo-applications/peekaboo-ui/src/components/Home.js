import { Card, CardContent, Typography } from "@material-ui/core";
import { useSelector } from "react-redux";

const Home = (props) => {
  const user = useSelector((store) => store.user);
  let message;
  if (user?.name) {
    message = <Typography variant="h5">{`Welcome, ${user.name}`}</Typography>;
  } else {
    message = (
      <div>
        <Typography variant="h5">Welcome to Peekaboo UI!</Typography>
        <br />
        <Typography>Please login or register!</Typography>
      </div>
    );
  }
  return (
    <Card>
      <CardContent>{message}</CardContent>
    </Card>
  );
};

export default Home;
