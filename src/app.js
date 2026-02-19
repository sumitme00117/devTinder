const express = require("express");
const connectDB = require("./config/database");

const cookieParser = require("cookie-parser");
const cors = require("cors");
const http = require("http");
require("dotenv").config();
const initializeSocket = require("./utils/socket");
const authRouter = require("./routers/auth");
const profileRouter = require("./routers/profile");
const requestRouter = require("./routers/request");
const userRouter = require("./routers/user");
const paymentRouter = require("./routers/payment");
const chatRouter = require("./routers/chat");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/", paymentRouter);
app.use("/", chatRouter)


const server = http.createServer(app);

initializeSocket(server)



connectDB()
  .then(() => {
    console.log("Database connection establised");
    server.listen(process.env.PORT, () => {
      console.log("Server is running on port " + process.env.PORT);
    });
  })
  .catch((err) => {
    console.log("Database connection failed", err);
  });
