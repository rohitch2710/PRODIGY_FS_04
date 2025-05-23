const dotenv = require("dotenv").config();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");
const connectDB = require("./utils/connectDB");
const authRouter = require("./routes/auth");
const verifyLogin = require("./middlewares/verifyLogin");
const verifySocketLogin = require("./middlewares/VerifySocketLogin");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(verifyLogin);

app.use(express.static("public"));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.get("/", (req, res) => {
  try {
    const { userStatus } = req;
    if (!userStatus.loggedIn) return res.redirect("/auth/login");
    res.render("index", {
      userId: userStatus.userId,
      username: userStatus.username
    });
  } catch (error) {
    res.render("error", {
      error: "Server side error occurred",
      message: error
    });
  }
});

app.use("/auth", authRouter);

app.all(/.*/, (req, res) => {
  res.render("not-found", {
    error: "Page not found"
  });
});

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "/"
  }
});

io.use(verifySocketLogin);

let onlineUsers = [];

io.on("connection", (socket) => {
  const userExist = onlineUsers.find(
    (user) => user.username === socket.username
  );
  if (userExist) {
    socket.emit("already_online");
    socket.disconnect(true);
    return;
  } else {
    const userJoined = {
      username: socket.username,
      userId: socket.userId,
      id: socket.id
    };
    onlineUsers.push(userJoined);
  }
  socket.emit("get_online_users", onlineUsers);
  socket.broadcast.emit("get_online_users", onlineUsers);
  socket.on("private_message", ({ toUserId, message }) => {
    const toUser = onlineUsers.find((user) => user.userId === toUserId);
    if (toUser === undefined) {
      socket.emit("user_offline");
    } else {
      socket.emit("message_sent", { message });
      io.to(toUser.id).emit("private_message", {
        fromUsername: socket.username,
        fromUserId: socket.userId,
        message
      });
    }
  });
  socket.on("public_message", ({ message }) => {
    socket.broadcast.emit("public_message", {
      fromId: socket.userId,
      fromUsername: socket.username,
      message
    });
  });

  socket.on("disconnect", () => {
    onlineUsers = onlineUsers.filter((user) => user.id !== socket.id);
    socket.broadcast.emit("get_online_users", onlineUsers);
  });
});

server.listen(PORT, async () => {
  console.clear();
  await connectDB();
  console.log(`Server running on http://localhost:${PORT}`);
});
