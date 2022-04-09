const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const apiRoutes = require("./routes/api");
const authRoutes = require("./routes/auth");

dotenv.config();

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

const apiRouter = express.Router();
apiRoutes(apiRouter);
app.use("/api", apiRouter);

const authRouter = express.Router();
authRoutes(authRouter);
app.use("/auth", authRouter);

app.get("/", (req, res) => res.send("Peekaboo Dashboard Backend"));

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
